#!/usr/bin/env node
/**
 * Umhlabatea API entry point. The frontend is now the Expo app (apps/mobile),
 * so this process serves the JSON API only.
 */
import { createApp } from "./src/app.js";
import { createInMemoryStore } from "./src/lib/store.js";

const PORT = Number(process.env.PORT || 5000);

let store = createInMemoryStore();
if (process.env.DATABASE_URL) {
  const { createPrismaStore } = await import("./src/lib/prisma-store.js");
  store = await createPrismaStore();
  console.log("[umhlabatea-api] using Prisma store");
}

createApp({ store }).listen(PORT, () => {
  console.log(`[umhlabatea-api] listening on http://localhost:${PORT}`);
});
