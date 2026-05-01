import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma, hasDatabaseUrl } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
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

        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
          const matchesEnvAdmin =
            email === process.env.ADMIN_EMAIL.toLowerCase() && password === process.env.ADMIN_PASSWORD;

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
