export interface NormalizedApiError {
  message: string;
  status: number;
  retryAfterMs?: number;
  retryable: boolean;
}

type RetryAwareError = Error & {
  retryAfterMs?: number;
};

function extractStatusFromMessage(message: string): number | undefined {
  const geminiMatch = message.match(/gemini(?:\s+image)?\s+api\s+error\s*\((\d{3})\)/i);
  if (geminiMatch) {
    return Number(geminiMatch[1]);
  }

  const statusMatch = message.match(/\bstatus(?:=|:)\s*(\d{3})\b/i);
  if (statusMatch) {
    return Number(statusMatch[1]);
  }

  return undefined;
}

function extractRetryAfterMsFromMessage(message: string): number | undefined {
  const retryInfoMatch = message.match(/"retryDelay"\s*:\s*"([0-9.]+)s"/i);
  if (retryInfoMatch) {
    const seconds = Number(retryInfoMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  const retryInMatch = message.match(/retry(?:\s+again)?\s+in\s+([0-9.]+)\s*s?/i);
  if (retryInMatch) {
    const seconds = Number(retryInMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  return undefined;
}

export function normalizeApiError(
  error: unknown,
  fallbackMessage: string
): NormalizedApiError {
  if (error instanceof Error) {
    const message = error.message || fallbackMessage;
    const status = extractStatusFromMessage(message) ?? 500;
    const retryAfterMs =
      'retryAfterMs' in error
        ? (error as RetryAwareError).retryAfterMs
        : extractRetryAfterMsFromMessage(message);
    const retryable = status === 429 || status === 503;

    return {
      message,
      status,
      retryAfterMs,
      retryable,
    };
  }

  return {
    message: fallbackMessage,
    status: 500,
    retryable: false,
  };
}
