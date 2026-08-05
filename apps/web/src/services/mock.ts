/**
 * Offline mock service — mirrors the API surface with deterministic data from
 * @umhlabatea/core so every feature works without a running backend.
 */
import type { Track, Listing, Registration, AgentTask, Episode, Tier, LiveSale, User } from "../types";

// --- Seed data ---------------------------------------------------------------

const MOCK_USER: User = {
  id: "usr_demo",
  email: "demo@umhlabatea.io",
  tier: "pro",
  createdAt: new Date().toISOString(),
};

const MOCK_TRACKS: Track[] = [
  { id: "trk_ubuntu", title: "Ubuntu Rising", artistName: "Nkosi Mthembu", genre: "Afro Jazz", bpm: 100, key: "Dm", priceRands: 85, durationSec: 225, plays: 42000, likes: 3100 },
  { id: "trk_ancestral", title: "Ancestral Echoes", artistName: "Amara Soul", genre: "Neo-Soul", bpm: 84, key: "Am", priceRands: 120, durationSec: 240, plays: 30500, likes: 2600 },
  { id: "trk_township", title: "Township Dreams", artistName: "The Zulu Collective", genre: "Afrobeat", bpm: 108, key: "Em", priceRands: 95, durationSec: 210, plays: 51000, likes: 4200 },
  { id: "trk_sunrise", title: "African Sunrise", artistName: "DJ Khanyisa", genre: "Amapiano", bpm: 116, key: "Cm", priceRands: 75, durationSec: 318, plays: 88000, likes: 7300 },
  { id: "trk_logdrum", title: "Log Drum Prayer", artistName: "DJ Khanyisa", genre: "Amapiano", bpm: 115, key: "Fm", priceRands: 80, durationSec: 300, plays: 64000, likes: 5100 },
];

const MOCK_LISTINGS: Listing[] = [
  { id: "lst_1", type: "beat", title: "Amapiano Sunrise Loop", description: "Hard-hitting log drum with gospel keys — 8-bar loop, 116 BPM, Cm", genre: "Amapiano", bpm: 116, priceRands: 150, sellerName: "DJ Khanyisa", sellerId: "art_khanyisa", status: "active", tags: "amapiano,log drum,gospel" },
  { id: "lst_2", type: "loop", title: "Afrobeat Percussion Pack", description: "8 live percussion loops, WAV + AIFF, 108 BPM", genre: "Afrobeat", bpm: 108, priceRands: 80, sellerName: "The Zulu Collective", sellerId: "art_zulu", status: "active", tags: "afrobeat,percussion,live" },
  { id: "lst_3", type: "session", title: "Piano & Vocals — Remote Session", description: "Remote session performance: piano + vocals for your track. 2-hour window.", genre: "Neo-Soul", priceRands: 950, sellerName: "Amara Soul", sellerId: "art_amara", status: "active", tags: "neo-soul,piano,vocals,remote" },
  { id: "lst_4", type: "beat", title: "Deep House Basement", description: "Rolling bassline + chord stabs. Full arrangement, 122 BPM, Am.", genre: "House", bpm: 122, priceRands: 200, sellerName: "Nkosi Mthembu", sellerId: "art_nkosi", status: "active", tags: "house,deep,bass,chords" },
  { id: "lst_5", type: "stem", title: "Ubuntu Rising — Stems Bundle", description: "Multi-track stems: drums, bass, keys, strings, lead vox. Mix-ready.", genre: "Afro Jazz", bpm: 100, priceRands: 350, sellerName: "Nkosi Mthembu", sellerId: "art_nkosi", status: "active", tags: "afro-jazz,stems,collab,mix" },
  { id: "lst_6", type: "loop", title: "Log Drum Essentials Vol. 1", description: "12 signature log drum loops at 115–118 BPM. The foundation of Amapiano.", genre: "Amapiano", bpm: 116, priceRands: 120, sellerName: "DJ Khanyisa", sellerId: "art_khanyisa", status: "active", tags: "amapiano,log drum,essentials" },
];

const MOCK_REGISTRATIONS: Registration[] = [
  { id: "reg_1", bodyId: "samro", bodyName: "SAMRO", trackId: "trk_ubuntu", trackTitle: "Ubuntu Rising", state: "prepared" },
  { id: "reg_2", bodyId: "risa", bodyName: "RISA", trackId: "trk_sunrise", trackTitle: "African Sunrise", state: "registered" },
];

const MOCK_TASKS: AgentTask[] = [
  { id: "task_1", agent: "legal", title: "Register Ubuntu Rising with SAMRO", source: "recorder", status: "open", createdAt: new Date().toISOString() },
  { id: "task_2", agent: "mixing", title: "Mix and master Log Drum Prayer", source: "manual", status: "done", createdAt: new Date().toISOString() },
  { id: "task_3", agent: "marketing", title: "Schedule launch campaign for African Sunrise", source: "recorder", status: "open", createdAt: new Date().toISOString() },
];

const MOCK_EPISODES: Episode[] = [
  { id: "ep_1", title: "Amapiano Deep Dive", description: "A conversation on the origins of the log drum sound.", transcript: "We start with the log drum — a 200hz resonant hit that defines the genre.", showNotes: "Key topics: log drum tuning, piano progressions, 115 BPM", duration: 1820, status: "published" },
];

const MOCK_TIERS: Tier[] = [
  { id: "free", name: "Starter", priceRands: 0, period: "forever", tagline: "Test the waters", agents: ["seo"], features: ["5 AI track generations/month", "Community access", "SAMRO draft registration", "Basic SEO metadata"] },
  { id: "pro", name: "Pro Artist", priceRands: 299, annualRands: 2690, period: "per month", tagline: "The full creative suite", highlighted: true, agents: ["seo", "mixing", "marketing", "crm"], features: ["Unlimited generations", "All 6 AI agents", "Full rights pipeline", "80/20 revenue split", "Podcast Studio", "Marketplace seller access", "Priority support"] },
  { id: "studio", name: "Label / Studio", priceRands: 899, annualRands: 8090, period: "per month", tagline: "Built for teams", agents: ["seo", "mixing", "marketing", "crm", "visual", "legal"], features: ["Everything in Pro", "Up to 10 artists", "Visual agent (cover art)", "Legal agent (contract review)", "Admin dashboard", "White-label player", "Custom ISRC batch"] },
];

const LIVE_SALES_ARTISTS = ["Sipho Ngwenya", "Thandi Mbeki", "Zanele Dlamini", "Bongani Khumalo", "Nomsa Nkosi"];
const LIVE_SALES_TRACKS = ["Isibindi", "Thula Mama", "Jabulani", "Ubuntu Spirit", "African Sky"];
const LIVE_SALES_CITIES = ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"];

export const mock = {
  // Auth
  login: (_email: string, _password: string) =>
    Promise.resolve({ token: "mock_token", user: MOCK_USER }),
  register: (email: string, _password: string) =>
    Promise.resolve({ token: "mock_token", user: { ...MOCK_USER, email } }),
  me: () => Promise.resolve({ user: MOCK_USER }),

  // Tracks
  getTracks: () => Promise.resolve({ tracks: MOCK_TRACKS }),
  getTrack: (id: string) => Promise.resolve({ track: MOCK_TRACKS.find((t) => t.id === id) }),
  generateTrack: (prompt: string, genre?: string) =>
    Promise.resolve({
      track: {
        id: `gen_${Date.now()}`,
        title: prompt.slice(0, 40),
        genre: genre || "Amapiano",
        bpm: 116,
        key: "Cm",
        priceRands: 80,
        durationSec: 180,
        plays: 0,
        likes: 0,
        generated: true,
        artistName: "You",
      } as Track,
    }),

  // Marketplace
  getListings: (_params?: Record<string, string>) =>
    Promise.resolve({ listings: MOCK_LISTINGS, total: MOCK_LISTINGS.length }),
  createListing: (data: Partial<Listing>) =>
    Promise.resolve({ listing: { id: `lst_${Date.now()}`, ...data, sellerId: "usr_demo", status: "active" } as Listing }),
  bookListing: (id: string, note?: string) =>
    Promise.resolve({ booking: { id: `book_${Date.now()}`, listingId: id, buyerId: "usr_demo", status: "pending", note: note || "" } }),

  // Rights
  getRegistrations: () => Promise.resolve({ registrations: MOCK_REGISTRATIONS }),
  createRegistration: (bodyId: string, trackId: string) =>
    Promise.resolve({ registration: { id: `reg_${Date.now()}`, bodyId, bodyName: bodyId.toUpperCase(), trackId, state: "draft" } as Registration }),
  advanceRegistration: (id: string) =>
    Promise.resolve({ registration: { ...MOCK_REGISTRATIONS.find((r) => r.id === id), state: "prepared" } as Registration }),

  // Tasks
  getTasks: () => Promise.resolve({ tasks: MOCK_TASKS }),
  createTask: (title: string, source?: string) =>
    Promise.resolve({
      task: {
        id: `task_${Date.now()}`,
        title,
        agent: "crm",
        source: source || "manual",
        status: "open",
        createdAt: new Date().toISOString(),
      } as AgentTask,
    }),
  completeTask: (id: string) =>
    Promise.resolve({ task: { ...MOCK_TASKS.find((t) => t.id === id), status: "done" } as AgentTask }),

  // Podcast
  getEpisodes: () => Promise.resolve({ episodes: MOCK_EPISODES }),

  // Plans
  getTiers: () => Promise.resolve({ tiers: MOCK_TIERS }),

  // Live feed
  getLiveFeed: (): LiveSale[] =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `sale_${i}`,
      artist: LIVE_SALES_ARTISTS[i % LIVE_SALES_ARTISTS.length],
      track: LIVE_SALES_TRACKS[i % LIVE_SALES_TRACKS.length],
      city: LIVE_SALES_CITIES[i % LIVE_SALES_CITIES.length],
      priceRands: 50 + (i * 23 % 100),
    })),

  // Revenue stub
  getRevenue: () =>
    Promise.resolve({
      summary: { salesCount: 8, grossRands: 720, artistEarningsRands: 576, paidOutRands: 480, pendingRands: 96, belowThreshold: false },
      programs: [],
    }),

  // Admin stats
  getAdminStats: () =>
    Promise.resolve({
      stats: { seedTracks: 5, generatedTracks: 3, totalTracks: 8, artists: 4, registrations: 2, agentTasks: 3, listings: 6, communityPosts: 3 },
    }),
};
