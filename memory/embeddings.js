/**
 * Pluggable text-embedding provider for the vector memory backend.
 *
 * An embedder exposes:
 *   embed(text | string[]) -> Promise<number[][]>   (always returns a matrix)
 *   dimension : number
 *   name      : string
 *
 * Providers (selected via EMBEDDING_PROVIDER):
 *   - mock   : deterministic, offline hashed bag-of-words (default; for tests)
 *   - openai : OpenAI-compatible /embeddings (also works for OpenRouter)
 *   - ollama : local Ollama /api/embeddings
 *
 * The mock embedder produces real, comparable vectors (shared vocabulary ->
 * higher cosine similarity), so the entire vector pipeline can be exercised
 * without network access or API keys. Swap EMBEDDING_PROVIDER to go live.
 */

// A large dimension keeps hash collisions rare, so the offline mock embedder
// ranks by genuine token overlap rather than collision noise. Real providers
// (openai/ollama) supply true semantic vectors instead.
const MOCK_DIM = 4096;

/** Stable FNV-1a hash -> non-negative 32-bit int. */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function l2normalize(vec) {
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

class MockEmbedder {
  constructor() {
    this.dimension = MOCK_DIM;
    this.name = "mock";
  }
  async embed(input) {
    const texts = Array.isArray(input) ? input : [input];
    return texts.map((text) => {
      const vec = new Array(MOCK_DIM).fill(0);
      for (const tok of tokenize(text)) {
        vec[fnv1a(tok) % MOCK_DIM] += 1;
      }
      return l2normalize(vec);
    });
  }
}

class OpenAIEmbedder {
  constructor({ apiKey, model, baseUrl }) {
    if (!apiKey) throw new Error("EMBEDDING_API_KEY is required for openai embeddings.");
    this.apiKey = apiKey;
    this.model = model || "text-embedding-3-small";
    this.baseUrl = baseUrl || "https://api.openai.com/v1";
    this.name = `openai:${this.model}`;
    this.dimension = 1536; // text-embedding-3-small default
  }
  async embed(input) {
    const texts = Array.isArray(input) ? input : [input];
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!res.ok) throw new Error(`openai embeddings ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.data.map((d) => d.embedding);
  }
}

class OllamaEmbedder {
  constructor({ model, baseUrl }) {
    this.model = model || "nomic-embed-text";
    this.baseUrl = baseUrl || "http://localhost:11434";
    this.name = `ollama:${this.model}`;
    this.dimension = 0; // discovered on first call
  }
  async embed(input) {
    const texts = Array.isArray(input) ? input : [input];
    const out = [];
    // Ollama's embeddings endpoint handles one prompt per call.
    for (const text of texts) {
      const res = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: text }),
      });
      if (!res.ok) throw new Error(`ollama embeddings ${res.status}: ${await res.text()}`);
      const data = await res.json();
      out.push(data.embedding);
    }
    if (out[0]) this.dimension = out[0].length;
    return out;
  }
}

export function createEmbedder(env = process.env) {
  const name = (env.EMBEDDING_PROVIDER || "mock").toLowerCase();
  const config = {
    apiKey: env.EMBEDDING_API_KEY || env.LLM_API_KEY,
    model: env.EMBEDDING_MODEL,
    baseUrl: env.EMBEDDING_BASE_URL,
  };
  switch (name) {
    case "mock":
      return new MockEmbedder();
    case "openai":
    case "openrouter":
      return new OpenAIEmbedder(config);
    case "ollama":
      return new OllamaEmbedder(config);
    default:
      throw new Error(`Unknown EMBEDDING_PROVIDER: ${name}`);
  }
}

export function cosineSimilarity(a, b) {
  if (a.length !== b.length) throw new Error("vector length mismatch");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
