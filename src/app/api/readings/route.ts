import { NextResponse } from "next/server";
import { readingRequestSchema, type ApiError } from "@/contracts/reading";
import { createReading } from "@/server/reading-service";

export async function POST(request: Request) {
  const parsed = readingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json<ApiError>({
      error: { code: "INVALID_REQUEST", message: "Select a valid question, period, and two different cards." },
    }, { status: 400 });
  }
  try {
    return NextResponse.json(await createReading(parsed.data));
  } catch {
    return NextResponse.json<ApiError>({
      error: { code: "READING_FAILED", message: "The oracle is unavailable. Please try again with the same cards." },
    }, { status: 503 });
  }
}
