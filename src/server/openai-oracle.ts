import "server-only";
import OpenAI, { type ClientOptions } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { AstroEvent, DateRange, OracleText } from "@/contracts/reading";
import { buildOracleUserPrompt, ORACLE_SYSTEM_PROMPT } from "./oracle-prompt";
import type { OracleInput, OracleProvider } from "./providers/types";

const DIRECT_OPENAI_BASE_URL = "https://api.openai.com/v1";

const oracleStructuredOutputSchema = z.object({
  answer: z.string(),
  recommendation: z.string(),
  cosmicReferences: z.array(z.object({
    eventId: z.string(),
    advice: z.string(),
  }).strict()).nullable(),
}).strict();

const proseSchema = z.string().trim().min(1).max(800);
const adviceSchema = z.string().trim().min(1).max(300);

export interface OracleTransportResponse {
  status: string;
  outputParsed: unknown;
  refused: boolean;
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

export interface OracleTransportRequest {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  signal: AbortSignal;
}

export interface OracleTransport {
  generate(request: OracleTransportRequest): Promise<OracleTransportResponse>;
}

interface OracleLog {
  status: string;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export class OracleGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OracleGenerationError";
  }
}

export function createOpenAITransport(
  apiKey: string,
  timeoutMs = 20_000,
  client?: OpenAI,
  baseURL?: string,
  createClient: (options: ClientOptions) => OpenAI = (options) => new OpenAI(options),
): OracleTransport {
  const openAIClient = client ?? createClient({
    apiKey,
    baseURL: baseURL ?? DIRECT_OPENAI_BASE_URL,
    maxRetries: 0,
    timeout: timeoutMs,
  });
  return {
    async generate(request) {
      const response = await openAIClient.responses.parse({
        model: request.model,
        input: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        text: { format: zodTextFormat(oracleStructuredOutputSchema, "corporate_oracle_reading") },
        reasoning: { effort: "none" },
        max_output_tokens: 1_200,
        store: false,
      }, { signal: request.signal, maxRetries: 0, timeout: timeoutMs });

      const refused = response.output.some((item) => item.type === "message"
        && item.content.some((content) => content.type === "refusal"));
      return {
        status: response.status ?? "unknown",
        outputParsed: response.output_parsed,
        refused,
        usage: response.usage ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };
    },
  };
}

export function createOpenAIOracleProvider(options: {
  apiKey?: string;
  model: string;
  baseURL?: string;
  timeoutMs?: number;
  transport?: OracleTransport;
  log?: (metadata: OracleLog) => void;
}): OracleProvider {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const transport = options.transport
    ?? createOpenAITransport(options.apiKey ?? "", timeoutMs, undefined, options.baseURL);
  const log = options.log ?? ((metadata: OracleLog) => console.info("oracle_request", metadata));

  return {
    mode: "live",
    async generate(input) {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await transport.generate({
          model: options.model,
          systemPrompt: ORACLE_SYSTEM_PROMPT,
          userPrompt: buildOracleUserPrompt(input),
          signal: controller.signal,
        });
        if (response.refused) {
          log({ status: "refused", durationMs: Date.now() - startedAt, ...response.usage });
          throw new OracleGenerationError("The oracle declined the request.");
        }
        if (response.status !== "completed") {
          log({ status: response.status, durationMs: Date.now() - startedAt, ...response.usage });
          throw new OracleGenerationError("The oracle response did not complete.");
        }
        try {
          const output = validateAndRenderOutput(response.outputParsed, input.events, input.period);
          log({ status: "completed", durationMs: Date.now() - startedAt, ...response.usage });
          return output;
        } catch (error) {
          log({ status: "invalid_output", durationMs: Date.now() - startedAt, ...response.usage });
          throw error;
        }
      } catch (error) {
        if (controller.signal.aborted) {
          log({ status: "timeout", durationMs: Date.now() - startedAt });
          throw new OracleGenerationError("The oracle request timed out.");
        }
        if (!(error instanceof OracleGenerationError)) {
          log({ status: "error", durationMs: Date.now() - startedAt });
          throw new OracleGenerationError("The oracle request failed.");
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

export function validateAndRenderOutput(
  output: unknown,
  events: AstroEvent[],
  period: DateRange,
): OracleText {
  const parsed = oracleStructuredOutputSchema.safeParse(output);
  if (!parsed.success) throw new OracleGenerationError("The oracle returned malformed output.");

  const answer = proseSchema.safeParse(parsed.data.answer);
  const recommendation = proseSchema.safeParse(parsed.data.recommendation);
  if (!answer.success || !recommendation.success) {
    throw new OracleGenerationError("The oracle returned empty or oversized text.");
  }

  const references = parsed.data.cosmicReferences;
  if (events.length === 0) {
    if (references !== null) {
      throw new OracleGenerationError("The oracle referenced an event that was not supplied.");
    }
    return { answer: answer.data, recommendation: recommendation.data, cosmicNote: null };
  }
  if (references === null) {
    return { answer: answer.data, recommendation: recommendation.data, cosmicNote: null };
  }
  if (references.length < 1 || references.length > 2) {
    throw new OracleGenerationError("The oracle returned an invalid number of event references.");
  }

  const eventById = new Map(events.map((event) => [event.id, event]));
  const seen = new Set<string>();
  const notes = references.map((reference) => {
    const advice = adviceSchema.safeParse(reference.advice);
    const event = eventById.get(reference.eventId);
    if (!advice.success || !event || seen.has(reference.eventId)) {
      throw new OracleGenerationError("The oracle returned an invalid event reference.");
    }
    seen.add(reference.eventId);
    return `${formatEventTiming(event, period)} ${advice.data}`;
  });

  return { answer: answer.data, recommendation: recommendation.data, cosmicNote: notes.join(" ") };
}

export function formatEventTiming(event: AstroEvent, period: DateRange): string {
  if (event.end === null) {
    return `${event.name} occurs on ${formatUtcDate(event.start)}.`;
  }

  const activeStart = new Date(Math.max(Date.parse(event.start), Date.parse(period.start)));
  const exclusiveEnd = Math.min(Date.parse(event.end), Date.parse(period.end));
  const activeLastInstant = new Date(exclusiveEnd - 1);
  const startLabel = formatUtcDate(activeStart.toISOString());
  const endLabel = formatUtcDate(activeLastInstant.toISOString());
  const activeRange = startLabel === endLabel
    ? startLabel
    : activeStart.getUTCFullYear() === activeLastInstant.getUTCFullYear()
      ? `${formatUtcMonthDay(activeStart.toISOString())}–${endLabel}`
      : `${startLabel}–${endLabel}`;
  return `${event.name} is active during ${activeRange}.`;
}

function formatUtcMonthDay(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
  }).format(new Date(isoDate));
}

function formatUtcDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}
