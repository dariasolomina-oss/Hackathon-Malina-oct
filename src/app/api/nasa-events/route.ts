import { NextResponse } from "next/server";
import { z } from "zod";
import { getNasaSkyEvents, isSupportedNasaPeriod } from "@/server/nasa/events";

const periodSchema = z.object({ start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) }).strict();
export async function POST(request: Request) {
  const parsed = periodSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isSupportedNasaPeriod(parsed.data)) return NextResponse.json({ events: [] }, { status: 400 });
  return NextResponse.json({ events: await getNasaSkyEvents(parsed.data) });
}
