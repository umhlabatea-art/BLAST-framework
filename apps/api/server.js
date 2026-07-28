#!/usr/bin/env node
/**
 * Umhlabatea API entry point. The frontend is now the Expo app (apps/mobile),
 * so this process serves the JSON API only.
 */
import { createApp } from "./src/app.js";

const PORT = Number(process.env.PORT || 5000);

createApp().listen(PORT, () => {
  console.log(`[umhlabatea-api] listening on http://localhost:${PORT}`);
});
