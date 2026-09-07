import 'server-only';

export const ASTRA_MODEL = 'gpt-6-astra' as const;
export const SOL_FALLBACK_MODEL = 'gpt-5.6-sol' as const;

export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export type ModelRoute = {
  primary: string;
  fallback: string;
  reasoningEffort: ReasoningEffort;
};

export type ModelRunTelemetry = {
  traceId: string;
  model: string;
  startedAt: string;
  durationMs: number;
  ok: boolean;
  fallbackUsed: boolean;
  status?: number;
  responseId?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  errorCode?: string;
};

export type ResponsesRequest = {
  traceId: string;
  instructions: string;
  input: string;
  reasoningEffort?: ReasoningEffort;
  maxOutputTokens?: number;
  metadata?: Record<string, string>;
  onTelemetry?: (event: ModelRunTelemetry) => void | Promise<void>;
};

export type ResponsesResult = {
  id: string;
  model: string;
  outputText: string;
  fallbackUsed: boolean;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

type OpenAIResponsePayload = {
  id?: string;
  model?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

const DEFAULT_ROUTE: ModelRoute = {
  primary: process.env.OPENAI_PRIMARY_MODEL?.trim() || ASTRA_MODEL,
  fallback: process.env.OPENAI_FALLBACK_MODEL?.trim() || SOL_FALLBACK_MODEL,
  reasoningEffort: normalizeReasoningEffort(process.env.OPENAI_REASONING_EFFORT),
};

function normalizeReasoningEffort(value?: string): ReasoningEffort {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
    case 'xhigh':
    case 'max':
      return value;
    default:
      return 'medium';
  }
}

function shouldFallback(status: number, payload: OpenAIResponsePayload): boolean {
  const code = payload.error?.code?.toLowerCase() ?? '';
  const message = payload.error?.message?.toLowerCase() ?? '';

  if (status === 404) return true;
  if (status === 403 && (code.includes('model') || message.includes('model'))) return true;
  if (status === 429) return true;
  if (status >= 500) return true;

  return false;
}

function extractOutputText(payload: OpenAIResponsePayload): string {
  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text ?? '')
    .join('\n')
    .trim();
}

async function callResponsesApi(args: {
  apiKey: string;
  model: string;
  request: ResponsesRequest;
  fallbackUsed: boolean;
}): Promise<ResponsesResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  let status: number | undefined;
  let payload: OpenAIResponsePayload = {};

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: args.model,
        instructions: args.request.instructions,
        input: args.request.input,
        reasoning: {
          effort: args.request.reasoningEffort ?? DEFAULT_ROUTE.reasoningEffort,
        },
        max_output_tokens: args.request.maxOutputTokens ?? 4096,
        metadata: {
          trace_id: args.request.traceId,
          ...args.request.metadata,
        },
      }),
      cache: 'no-store',
    });

    status = response.status;
    payload = (await response.json()) as OpenAIResponsePayload;

    if (!response.ok) {
      const error = new Error(
        payload.error?.message || `OpenAI Responses API failed with HTTP ${response.status}`,
      );
      Object.assign(error, {
        status: response.status,
        code: payload.error?.code,
        openAI: payload,
      });
      throw error;
    }

    const result: ResponsesResult = {
      id: payload.id ?? 'unknown',
      model: payload.model ?? args.model,
      outputText: extractOutputText(payload),
      fallbackUsed: args.fallbackUsed,
      usage: {
        inputTokens: payload.usage?.input_tokens,
        outputTokens: payload.usage?.output_tokens,
        totalTokens: payload.usage?.total_tokens,
      },
    };

    await args.request.onTelemetry?.({
      traceId: args.request.traceId,
      model: result.model,
      startedAt,
      durationMs: Date.now() - started,
      ok: true,
      fallbackUsed: args.fallbackUsed,
      status,
      responseId: result.id,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      totalTokens: result.usage.totalTokens,
    });

    return result;
  } catch (error) {
    const typed = error as Error & { status?: number; code?: string };
    await args.request.onTelemetry?.({
      traceId: args.request.traceId,
      model: args.model,
      startedAt,
      durationMs: Date.now() - started,
      ok: false,
      fallbackUsed: args.fallbackUsed,
      status: typed.status ?? status,
      errorCode: typed.code ?? payload.error?.code,
    });
    throw error;
  }
}

export function getModelRoute(): ModelRoute {
  return { ...DEFAULT_ROUTE };
}

export async function runAstraFirst(request: ResponsesRequest): Promise<ResponsesResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }

  const route = getModelRoute();

  try {
    return await callResponsesApi({
      apiKey,
      model: route.primary,
      request,
      fallbackUsed: false,
    });
  } catch (error) {
    const typed = error as Error & {
      status?: number;
      openAI?: OpenAIResponsePayload;
    };

    if (
      route.fallback === route.primary ||
      typeof typed.status !== 'number' ||
      !shouldFallback(typed.status, typed.openAI ?? {})
    ) {
      throw error;
    }

    return callResponsesApi({
      apiKey,
      model: route.fallback,
      request,
      fallbackUsed: true,
    });
  }
}
