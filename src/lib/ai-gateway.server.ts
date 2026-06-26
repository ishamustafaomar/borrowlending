// Lightweight Lovable AI Gateway client (no AI SDK dependency for this small use case)
const BASE_URL = "https://ai.gateway.lovable.dev/v1";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function chatJSON<T = unknown>(opts: {
  model?: string;
  system?: string;
  user: string;
  schema?: Record<string, unknown>;
}): Promise<T | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const messages: ChatMessage[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.user });

  const body: Record<string, unknown> = {
    model: opts.model ?? "google/gemini-3-flash-preview",
    messages,
  };

  if (opts.schema) {
    body.tools = [
      {
        type: "function",
        function: {
          name: "respond",
          description: "Return the structured answer",
          parameters: opts.schema,
        },
      },
    ];
    body.tool_choice = { type: "function", function: { name: "respond" } };
  } else {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "raw",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
        tool_calls?: Array<{ function?: { arguments?: string } }>;
      };
    }>;
  };

  const choice = json.choices?.[0]?.message;
  const raw = choice?.tool_calls?.[0]?.function?.arguments ?? choice?.content;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
