// Single AI endpoint for the app's photo scanning, profit review, and market
// benchmarking features. Calls Anthropic's Messages API server-side. ANTHROPIC_API_KEY is a Supabase
// Edge Function secret (set via `supabase secrets set`), never shipped to the client.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const DEFAULT_MODEL = "claude-haiku-4-5";
const SUBMIT_TOOL_NAME = "submit_result";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (!ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY is not configured" }, 500);
  }

  let payload: {
    prompt?: string;
    response_json_schema?: Record<string, unknown>;
    file_urls?: string[];
    model?: string;
    add_context_from_internet?: boolean;
  };

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { prompt, response_json_schema, file_urls, model, add_context_from_internet } = payload;

  if (!prompt) {
    return jsonResponse({ error: "prompt is required" }, 400);
  }

  const content: Record<string, unknown>[] = [];
  if (Array.isArray(file_urls)) {
    for (const url of file_urls) {
      content.push({ type: "image", source: { type: "url", url } });
    }
  }
  content.push({ type: "text", text: prompt });

  const tools: Record<string, unknown>[] = [];
  if (add_context_from_internet) {
    tools.push({ type: "web_search_20260209", name: "web_search" });
  }
  if (response_json_schema) {
    tools.push({
      name: SUBMIT_TOOL_NAME,
      description: "Submit the final structured result matching the required schema.",
      input_schema: response_json_schema,
    });
  }

  const body: Record<string, unknown> = {
    model: model || DEFAULT_MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content }],
  };
  if (tools.length > 0) body.tools = tools;
  // Force the structured-output tool only when there's no web search in play —
  // forcing a tool_choice prevents Claude from calling any other tool first,
  // which would block it from using web_search before answering.
  if (response_json_schema && !add_context_from_internet) {
    body.tool_choice = { type: "tool", name: SUBMIT_TOOL_NAME };
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return jsonResponse({ error: errText }, anthropicRes.status);
  }

  const data = await anthropicRes.json();
  const blocks: Array<Record<string, unknown>> = data.content || [];

  let result: unknown = null;
  if (response_json_schema) {
    const toolUse = blocks.find(
      (b) => b.type === "tool_use" && b.name === SUBMIT_TOOL_NAME,
    );
    result = toolUse?.input ?? null;
  } else {
    const textBlock = blocks.find((b) => b.type === "text");
    result = textBlock?.text ?? null;
  }

  return jsonResponse(result);
});
