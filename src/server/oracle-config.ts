import "server-only";

export type OracleConfig =
  | { mode: "mock" }
  | { mode: "live"; apiKey: string; model: string };

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

  return {
    mode,
    apiKey,
    model: environment.OPENAI_MODEL?.trim() || "gpt-6-luna",
  };
}
