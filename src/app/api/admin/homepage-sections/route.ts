import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, isAdminSession } from "@/lib/auth";
import { prisma, hasDatabaseUrl } from "@/lib/db";

const schema = z.object({
  key: z.string().min(2),
  title: z.string().min(2),
  body: z.string().optional(),
  eyebrow: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  published: z.boolean().optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session) && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "DATABASE_URL is required." }, { status: 400 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid section details." },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const section = await prisma.homepageSection.upsert({
    where: { key: input.key },
    update: input,
    create: {
      key: input.key,
      kind: "STORY",
      title: input.title,
      body: input.body,
      eyebrow: input.eyebrow,
      ctaLabel: input.ctaLabel,
      ctaHref: input.ctaHref,
      published: input.published ?? true
    }
  });

  return NextResponse.json({ section });
}
