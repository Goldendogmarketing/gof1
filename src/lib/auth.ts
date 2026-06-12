import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma, hasDatabaseUrl } from "@/lib/db";

// Inlined here to avoid a circular import with src/lib/admin.ts.
function isMasterAdminEmail(email: string): boolean {
  const masterRaw = process.env.MASTER_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
  if (!masterRaw) return false;
  return email.trim().toLowerCase() === masterRaw.trim().toLowerCase();
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // Cap session at 8 hours so a forgotten browser doesn't leave an admin
    // panel hot indefinitely. The library default is 30 days, which is too
    // long for a panel that can edit prices, delete customers, and refund orders.
    maxAge: 60 * 60 * 8
  },
  pages: {
    signIn: "/account"
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        // Env-admin shortcut: only honors the master admin's email. Other admin
        // accounts must exist as DB User rows (granted by the master at /admin/users).
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
          const matchesEnvAdmin =
            email === process.env.ADMIN_EMAIL.toLowerCase() &&
            password === process.env.ADMIN_PASSWORD &&
            isMasterAdminEmail(email);

          if (matchesEnvAdmin) {
            return {
              id: "env-admin",
              email,
              name: "Greek Olive Fusion Owner",
              role: "ADMIN"
            } as any;
          }
        }

        if (!hasDatabaseUrl()) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const passwordMatches = await compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "CUSTOMER";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role ?? "CUSTOMER";
      }

      return session;
    }
  }
};

export function isAdminSession(session: unknown) {
  const role = (session as { user?: { role?: string } } | null)?.user?.role;
  return role === "ADMIN" || role === "STAFF";
}
