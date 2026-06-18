#!/usr/bin/env node
/**
 * Start the chat bot.
 *
 *   DISCORD_BOT_TOKEN=... node chat/cli.js
 *
 * Shares the BLAST store (DATABASE_URL or in-memory) so leads created in chat
 * appear in the API, and runs Hermes with the configured LLM provider (mock by
 * default), saving outcomes to MEMORY_VAULT when set.
 */
import { buildStore } from "../src/backend/build-store.js";
import { createHermesRunner } from "../routines/runner.js";
import { createCommandRouter } from "./commands.js";
import { startDiscordBot } from "./discord.js";

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error("Set DISCORD_BOT_TOKEN to start the bot.");
    process.exit(2);
  }

  const store = await buildStore(process.env, { log: (m) => console.error(`[chat] ${m}`) });
  const hermes = createHermesRunner();
  const runner = (task) => hermes({ name: "chat", task, tags: ["chat"] });
  const router = createCommandRouter({
    runner,
    store,
    ownerId: process.env.CHAT_OWNER_ID || "chat",
  });

  await startDiscordBot({ token, router });
  // Keep the process alive.
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error("[chat] fatal:", err.message);
  process.exit(1);
});
