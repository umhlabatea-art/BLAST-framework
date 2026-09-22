/**
 * Single entry point for data access. Chooses the offline mock (default) or the
 * live HTTP client when EXPO_PUBLIC_API_URL is configured. Nothing else in the
 * app imports the concrete clients.
 */
import type { ApiClient } from "./types";
import { mockClient } from "./mockClient";
import { httpClient } from "./httpClient";

export const api: ApiClient = process.env.EXPO_PUBLIC_API_URL ? httpClient : mockClient;

export const isLive = Boolean(process.env.EXPO_PUBLIC_API_URL);

export * from "./types";
