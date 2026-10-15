import "server-only";

export type OracleConfig =
  | { mode: "mock" }
  | { mode: "live"; apiKey: string; model: string; baseURL?: string };

export class OracleConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OracleConfigurationError";
  }
}

export function getOracleConfig(
  environment: Record<string, string | undefined> = process.env,
): OracleConfig {
  const mode = environment.ORACLE_MODE?.trim() || "mock";
  if (mode === "mock") return { mode };
  if (mode !== "live") {
    throw new OracleConfigurationError('ORACLE_MODE must be either "mock" or "live".');
  }

  const apiKey = environment.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new OracleConfigurationError("OPENAI_API_KEY is required when ORACLE_MODE=live.");
  }

  const baseURL = parseOpenAIBaseURL(environment.OPENAI_BASE_URL);

  return {
    mode,
    apiKey,
    model: environment.OPENAI_MODEL?.trim() || "gpt-6-luna",
    ...(baseURL ? { baseURL } : {}),
  };
}

function parseOpenAIBaseURL(value: string | undefined): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new OracleConfigurationError("OPENAI_BASE_URL must be a valid HTTPS URL.");
  }

  if (url.protocol !== "https:" || !url.hostname || url.username || url.password
    || candidate.includes("?") || candidate.includes("#")) {
    throw new OracleConfigurationError(
      "OPENAI_BASE_URL must be an HTTPS URL without credentials, a query, or a fragment.",
    );
  }

  return url.toString().replace(/\/$/, "");
}
