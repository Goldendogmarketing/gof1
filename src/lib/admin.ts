import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (isAdminSession(session)) return session;

  if (process.env.NODE_ENV === "development" && !process.env.ADMIN_EMAIL) {
    return {
      user: {
        name: "Demo Owner",
        email: "owner@greekolivefusion.local",
        role: "ADMIN"
      }
    };
  }

  redirect("/account?next=/admin");
}
