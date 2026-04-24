import { env } from './env.ts';

interface ResponsesFunctionCall {
  type: 'function_call';
  call_id: string;
  name: string;
  arguments: string;
}

interface ResponsesTextPart {
  type: 'output_text' | 'text';
  text?: string;
}

interface ResponsesMessageItem {
  type: 'message';
  role?: string;
  content?: ResponsesTextPart[];
}

interface ResponsesApiResponse {
  id?: string;
  output_text?: string;
  output?: Array<ResponsesFunctionCall | ResponsesMessageItem>;
}

export interface ResponsesLoopResult {
  responseId: string | null;
  text: string;
  functionCalls: ResponsesFunctionCall[];
}

export interface ClientToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

function extractText(response: ResponsesApiResponse) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const text = (response.output ?? [])
    .flatMap((item) => {
      if (item.type !== 'message') {
        return [];
      }

      return (item.content ?? []).map((part) => part.text ?? '');
    })
    .join('\n')
    .trim();

  return text;
}

function extractFunctionCalls(response: ResponsesApiResponse) {
  return (response.output ?? []).filter((item): item is ResponsesFunctionCall => item.type === 'function_call');
}

export async function callOpenClaw(input: {
  agentId: string;
  sessionKey: string;
  previousResponseId?: string | null;
  instructions: string;
  input: unknown;
  tools?: ClientToolDefinition[];
}) {
  const response = await fetch(`${env.openclawBaseUrl}/v1/responses`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.openclawGatewayToken}`,
      'content-type': 'application/json',
      'x-openclaw-agent-id': input.agentId
    },
    body: JSON.stringify({
      model: `openclaw/${input.agentId}`,
      user: input.sessionKey,
      previous_response_id: input.previousResponseId ?? undefined,
      instructions: input.instructions,
      input: input.input,
      tools: input.tools
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenClaw request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as ResponsesApiResponse;

  return {
    responseId: data.id ?? null,
    text: extractText(data),
    functionCalls: extractFunctionCalls(data)
  } satisfies ResponsesLoopResult;
}
