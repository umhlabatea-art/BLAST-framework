/** Barrel for the offline AI-agent stubs. */
export { seoAeo } from "./seo.js";
export {
  STATES as COMPLIANCE_STATES,
  BODIES as RIGHTS_BODIES,
  createRegistration,
  advance as advanceRegistration,
  prepareSamroPayload,
  prepareCapassoRow,
  prepareIsrc,
} from "./compliance.js";
export { splitSale, affiliateEarning, summarize } from "./revenue.js";
export { generate as generateTrack, generateJob, stubProvider, replicateProvider } from "./musicgen.js";
export { routeAgent, AGENT_IDS } from "./tasks.js";
