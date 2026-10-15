import type { ApiError, ReadingRequest, ReadingResponse } from "@/contracts/reading";

export async function requestReading(request: ReadingRequest): Promise<ReadingResponse> {
  const response = await fetch("/api/readings", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as ApiError | null;
    throw new Error(payload?.error?.message ?? "The oracle is unavailable. Please try again.");
  }
  return response.json() as Promise<ReadingResponse>;
}
