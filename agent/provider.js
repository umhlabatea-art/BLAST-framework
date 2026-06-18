/**
 * Pluggable LLM provider.
 *
 * A provider exposes a single async method:
 *     complete({ system, user, temperature }) -> string
 *
 * Supported providers (selected via LLM_PROVIDER):
 *   - openrouter : OpenAI-compatible /chat/completions
 *   - anthropic  : Anthropic Messages API
 *   - ollama     : local Ollama /api/chat
 *   - mock       : deterministic, offline — used for tests and dry runs
 *
 * All network providers read credentials from environment variables so secrets
 * never appear in code (see .env.example).
 */

class OpenRouterProvider {
  constructor({ apiKey, model, baseUrl }) {
    if (!apiKey) throw new Error("LLM_API_KEY is required for openrouter.");
    this.apiKey = apiKey;
    this.model = model || "anthropic/claude-3.5-sonnet";
    this.baseUrl = baseUrl || "https://openrouter.ai/api/v1";
  }
  async complete({ system, user, temperature = 0.2 }) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`openrouter ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }
}

class AnthropicProvider {
  constructor({ apiKey, model }) {
    if (!apiKey) throw new Error("LLM_API_KEY is required for anthropic.");
    this.apiKey = apiKey;
    this.model = model || "claude-3-5-sonnet-latest";
  }
  async complete({ system, user, temperature = 0.2 }) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        temperature,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) {
      throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text ?? "";
  }
}

class OllamaProvider {
  constructor({ model, baseUrl }) {
    this.model = model || "llama3.1";
    this.baseUrl = baseUrl || "http://localhost:11434";
  }
  async complete({ system, user, temperature = 0.2 }) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        options: { temperature },
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`ollama ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    return data.message?.content ?? "";
  }
}

/**
 * Deterministic provider for tests and offline dry runs. It inspects the prompt
 * to decide what to return, and simulates a critic that demands one revision
 * before passing — so the critic loop can be exercised without any network.
 */
class MockProvider {
  constructor() {
    this.critiqueCalls = 0;
  }
  async complete({ user }) {
    const text = user.toLowerCase();

    // Critic request: detected by asking for a JSON verdict.
    if (text.includes("verdict")) {
      this.critiqueCalls += 1;
      if (this.critiqueCalls === 1) {
        return JSON.stringify({
          verdict: "revise",
          score: 60,
          issues: [
            {
              severity: "major",
              location: "draft:1",
              problem: "Missing input validation.",
              fix: "Guard against null/empty input before use.",
            },
          ],
          summary: "Logic is close but lacks input validation.",
        });
      }
      return JSON.stringify({
        verdict: "pass",
        score: 95,
        issues: [],
        summary: "Validation added; ready to ship.",
      });
    }

    // Revision request.
    if (text.includes("revise") || text.includes("issues to fix")) {
      return [
        "function greet(name) {",
        "  if (!name || typeof name !== 'string') {",
        "    throw new Error('name must be a non-empty string');",
        "  }",
        "  return `Hello, ${name}!`;",
        "}",
      ].join("\n");
    }

    // Initial generation.
    return [
      "function greet(name) {",
      "  return `Hello, ${name}!`;",
      "}",
    ].join("\n");
  }
}

export function createProvider(env = process.env) {
  const name = (env.LLM_PROVIDER || "mock").toLowerCase();
  const config = {
    apiKey: env.LLM_API_KEY,
    model: env.LLM_MODEL,
    baseUrl: env.LLM_BASE_URL,
  };
  switch (name) {
    case "openrouter":
      return new OpenRouterProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "ollama":
      return new OllamaProvider(config);
    case "mock":
      return new MockProvider();
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${name}`);
  }
}
