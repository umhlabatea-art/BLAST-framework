#!/usr/bin/env node
/**
 * BLAST backend entry point. Serves the API and the static frontend.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

const app = createApp();

// Serve the minimal frontend from ../frontend at the site root.
app.use(express.static(path.resolve(here, "..", "frontend")));

app.listen(PORT, () => {
  console.log(`[blast] API + frontend on http://localhost:${PORT}`);
});
