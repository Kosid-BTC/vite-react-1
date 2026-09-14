import { FALLBACK_MODEL, type ReasoningEffort } from './modelPolicy';

type ResponsesRequest = {
  model: string;
  input: string;
  reasoning: { effort: ReasoningEffort };
  parallel_tool_calls: boolean;
  metadata?: Record<string, string>;
};

type ResponsesPayload = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  error?: { code?: string; message?: string };
};

export type ModelGatewayResult = {
  responseId: string | null;
  modelRequested: string;
  modelUsed: string;
  fallbackUsed: boolean;
  text: string;
};

function extractOutputText(payload: ResponsesPayload): string {
  if (payload.output_text?.trim()) return payload.output_text.trim();

  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n');
}

function canFallback(status: number, payload: ResponsesPayload): boolean {
  const code = payload.error?.code?.toLowerCase() ?? '';
  const message = payload.error?.message?.toLowerCase() ?? '';

  return (
    status === 403 ||
    status === 404 ||
    code.includes('model') ||
    message.includes('model') ||
    message.includes('access') ||
    message.includes('permission')
  );
}

async function callResponses(request: ResponsesRequest): Promise<{ status: number; payload: ResponsesPayload }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
    cache: 'no-store',
  });

  const payload = (await response.json()) as ResponsesPayload;
  return { status: response.status, payload };
}

export async function runModel(input: {
  model: string;
  prompt: string;
  reasoning: ReasoningEffort;
  metadata?: Record<string, string>;
}): Promise<ModelGatewayResult> {
  const primaryRequest: ResponsesRequest = {
    model: input.model,
    input: input.prompt,
    reasoning: { effort: input.reasoning },
    parallel_tool_calls: true,
    metadata: input.metadata,
  };

  const primary = await callResponses(primaryRequest);
  if (primary.status >= 200 && primary.status < 300) {
    return {
      responseId: primary.payload.id ?? null,
      modelRequested: input.model,
      modelUsed: primary.payload.model ?? input.model,
      fallbackUsed: false,
      text: extractOutputText(primary.payload),
    };
  }

  if (!canFallback(primary.status, primary.payload) || input.model === FALLBACK_MODEL) {
    throw new Error(primary.payload.error?.message ?? `OpenAI Responses API failed with HTTP ${primary.status}`);
  }

  const fallback = await callResponses({ ...primaryRequest, model: FALLBACK_MODEL });
  if (fallback.status < 200 || fallback.status >= 300) {
    throw new Error(fallback.payload.error?.message ?? `OpenAI fallback failed with HTTP ${fallback.status}`);
  }

  return {
    responseId: fallback.payload.id ?? null,
    modelRequested: input.model,
    modelUsed: fallback.payload.model ?? FALLBACK_MODEL,
    fallbackUsed: true,
    text: extractOutputText(fallback.payload),
  };
}
