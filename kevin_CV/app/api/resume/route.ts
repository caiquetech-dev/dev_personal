import { NextRequest, NextResponse } from "next/server";
import {
  isAdminTokenValid,
  readResumeContent,
  validateResumeContentErrors,
  writeResumeContent,
} from "@/lib/resume-store";
import type { ResumeContentByLocale } from "@/data/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await readResumeContent();
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!isAdminTokenValid(token)) {
    return NextResponse.json(
      { error: "Unauthorized resume admin request." },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const validationErrors = validateResumeContentErrors(payload);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Invalid resume payload.", errors: validationErrors },
      { status: 400 },
    );
  }

  try {
    const result = await writeResumeContent(payload as ResumeContentByLocale);
    if (!result.ok) {
      return NextResponse.json(
        { error: "Invalid resume payload.", errors: result.errors },
        { status: result.status },
      );
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save resume content.",
      },
      { status: 500 },
    );
  }
}
