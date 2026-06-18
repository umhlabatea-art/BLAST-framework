/**
 * Offline tests for the memory module, run against the fixture vault.
 * No network, no API keys. Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadVault, parseNote, parseFrontmatter } from "./vault.js";
import { createObsidianMemory, tokenize } from "./memory-store.js";
import { createEmbedder, cosineSimilarity } from "./embeddings.js";
import { createMemoryRouter } from "./memory-router.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const VAULT = path.join(here, "fixtures", "vault");

let passed = 0;
const ok = (name) => { console.log(`  ok - ${name}`); passed++; };

// --- frontmatter parsing -------------------------------------------------
{
  const inline = parseFrontmatter("title: Foo\ntags: [a, b, c]");
  assert.equal(inline.title, "Foo");
  assert.deepEqual(inline.tags, ["a", "b", "c"]);
  ok("parses inline list frontmatter");

  const block = parseFrontmatter("tags:\n  - security\n  - backend");
  assert.deepEqual(block.tags, ["security", "backend"]);
  ok("parses block list frontmatter");
}

// --- note parsing --------------------------------------------------------
{
  const note = parseNote({
    root: "/root",
    file: "/root/Note.md",
    raw: "---\ntitle: T\ntags: [x]\n---\nbody with #inline and [[Other Note|alias]].",
  });
  assert.equal(note.title, "T");
  assert.ok(note.tags.includes("x"), "frontmatter tag present");
  assert.ok(note.tags.includes("inline"), "inline #tag captured");
  assert.deepEqual(note.links, ["Other Note"], "wikilink target extracted without alias");
  ok("parseNote extracts title, tags, and wikilinks");
}

// --- vault loading (recursive) ------------------------------------------
let notes;
{
  notes = await loadVault(VAULT);
  assert.equal(notes.length, 4, "should load 4 notes incl. one in a subfolder");
  const ids = notes.map((n) => n.id);
  assert.ok(ids.some((id) => id.includes("Pasta Recipe.md")), "recursed into notes/");
  ok("loadVault recurses and loads all notes");
}

// --- tokenizer drops stopwords ------------------------------------------
{
  const toks = tokenize("The quick brown fox and a dog");
  assert.ok(!toks.includes("the"), "stopword removed");
  assert.ok(toks.includes("quick"), "content word kept");
  ok("tokenizer drops stopwords");
}

// --- ranked search -------------------------------------------------------
{
  const memory = await createObsidianMemory({ vaultPath: VAULT });
  const stats = memory.stats();
  assert.equal(stats.notes, 4);

  const stripe = memory.search("stripe webhook checkout", { limit: 3 });
  assert.equal(stripe[0].title, "Stripe Integration", "stripe query ranks Stripe note first");
  assert.ok(stripe[0].snippet.length > 0, "result includes a snippet");
  ok("search ranks the Stripe note top for a payments query");

  const auth = memory.search("jwt token scrypt password", { limit: 3 });
  assert.equal(auth[0].title, "Auth Patterns", "auth query ranks Auth note first");
  ok("search ranks the Auth note top for a security query");

  // The pasta note must not surface for a technical query.
  const techHits = memory.search("stripe auth backend", { limit: 5 });
  assert.ok(
    !techHits.some((h) => h.title === "Pasta Recipe"),
    "irrelevant note excluded from technical query"
  );
  ok("irrelevant note is not returned for a technical query");

  // Empty / no-match behavior.
  assert.deepEqual(memory.search("", { limit: 3 }), [], "empty query returns nothing");
  assert.deepEqual(memory.search("zzzqzzz", { limit: 3 }), [], "no-match returns nothing");
  ok("empty and no-match queries return no results");

  // get() retrieves a full note.
  const full = memory.get(stripe[0].id);
  assert.ok(full && full.body.includes("Checkout"), "get returns the full note");
  ok("get() returns the full note by id");
}

// --- input validation ----------------------------------------------------
{
  await assert.rejects(() => createObsidianMemory({}), /vaultPath is required/);
  await assert.rejects(
    () => createObsidianMemory({ vaultPath: path.join(here, "does-not-exist") }),
    /not a directory/
  );
  ok("createObsidianMemory validates its inputs");
}

// --- embeddings ----------------------------------------------------------
{
  const embedder = createEmbedder({ EMBEDDING_PROVIDER: "mock" });
  const [a, b, c] = await embedder.embed([
    "stripe payment checkout webhook",
    "stripe payment refund processing",
    "boil pasta with garlic and oil",
  ]);
  assert.equal(a.length, embedder.dimension, "embedding has provider dimension");
  const simAB = cosineSimilarity(a, b);
  const simAC = cosineSimilarity(a, c);
  assert.ok(simAB > simAC, "payment texts are more similar than payment vs pasta");
  ok("mock embedder produces comparable vectors");

  assert.throws(() => createEmbedder({ EMBEDDING_PROVIDER: "nope" }), /Unknown EMBEDDING_PROVIDER/);
  ok("unknown embedding provider is rejected");
}

// --- vector backend ------------------------------------------------------
{
  const embedder = createEmbedder({ EMBEDDING_PROVIDER: "mock" });
  const mem = await createObsidianMemory({ vaultPath: VAULT, backend: "vector", embedder });
  assert.equal(mem.backend, "vector");
  assert.equal(mem.stats().notes, 4);
  const hits = await mem.search("payment processing and webhooks", { limit: 2 });
  assert.equal(hits[0].title, "Stripe Integration", "vector search ranks Stripe note first");
  assert.ok(mem.get(hits[0].id).body.includes("Checkout"), "get returns full note");
  ok("vector backend ranks the Stripe note top");
}

// --- hybrid backend ------------------------------------------------------
{
  const embedder = createEmbedder({ EMBEDDING_PROVIDER: "mock" });
  const mem = await createObsidianMemory({ vaultPath: VAULT, backend: "hybrid", embedder });
  assert.equal(mem.backend, "hybrid");
  const hits = await mem.search("jwt token authentication", { limit: 2 });
  assert.equal(hits[0].title, "Auth Patterns", "hybrid search ranks Auth note first");
  ok("hybrid backend merges BM25 + vector scores");

  await assert.rejects(
    () => createObsidianMemory({ vaultPath: VAULT, backend: "nonsense" }),
    /Unknown memory backend/
  );
  ok("unknown memory backend is rejected");
}

// --- 3-level memory router ----------------------------------------------
{
  const longterm = await createObsidianMemory({ vaultPath: VAULT, backend: "bm25" });
  const router = createMemoryRouter({ longterm });

  // With only long-term, recall returns vault notes tagged with the level.
  const ltHits = await router.recall("stripe webhook", { limit: 2 });
  assert.ok(ltHits.length > 0, "router recalls from long-term");
  assert.equal(ltHits[0].level, "longterm");
  ok("router recalls from the long-term tier");

  // Add a session/context memory; it should outrank long-term for the same topic.
  router.remember("Decision: refunds must be issued within 24h of request.", {
    title: "Refund SLA decision",
    tags: ["payments"],
  });
  const merged = await router.recall("refund policy timing", { limit: 3 });
  assert.equal(merged[0].level, "context", "recent context outranks long-term");
  ok("context tier is weighted above long-term");

  const stats = router.stats();
  assert.equal(stats.context, 1);
  assert.ok(stats.longterm, "router reports long-term stats");
  ok("router reports per-tier stats");
}

console.log(`\nAll ${passed} memory tests passed.`);
