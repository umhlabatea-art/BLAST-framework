/**
 * Marketplace module — beats, loops, session musicians, and stem bundles.
 *
 * Seed listings come from SEED_LISTINGS below; user-created listings persist
 * to the store. Buyers can book a listing (e.g. hire a session musician) which
 * creates a Booking record.
 */
import { Router } from "express";
import { requireAuth } from "../lib/auth.js";

const SEED_LISTINGS = [
  {
    id: "lst_1",
    type: "beat",
    title: "Amapiano Sunrise Loop",
    description: "Hard-hitting log drum with gospel keys — 8-bar loop, 116 BPM, Cm",
    genre: "Amapiano",
    bpm: 116,
    priceRands: 150,
    sellerName: "DJ Khanyisa",
    sellerId: "art_khanyisa",
    status: "active",
    tags: "amapiano,log drum,gospel",
    createdAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "lst_2",
    type: "loop",
    title: "Afrobeat Percussion Pack",
    description: "8 live percussion loops, WAV + AIFF, 108 BPM",
    genre: "Afrobeat",
    bpm: 108,
    priceRands: 80,
    sellerName: "The Zulu Collective",
    sellerId: "art_zulu",
    status: "active",
    tags: "afrobeat,percussion,live",
    createdAt: "2026-01-12T14:00:00.000Z",
  },
  {
    id: "lst_3",
    type: "session",
    title: "Piano & Vocals — Remote Session",
    description: "Remote session performance: piano + vocals for your track. 2-hour window.",
    genre: "Neo-Soul",
    bpm: null,
    priceRands: 950,
    sellerName: "Amara Soul",
    sellerId: "art_amara",
    status: "active",
    tags: "neo-soul,piano,vocals,remote",
    createdAt: "2026-01-15T11:00:00.000Z",
  },
  {
    id: "lst_4",
    type: "beat",
    title: "Deep House Basement",
    description: "Rolling bassline + chord stabs. Full arrangement, 122 BPM, Am.",
    genre: "House",
    bpm: 122,
    priceRands: 200,
    sellerName: "Nkosi Mthembu",
    sellerId: "art_nkosi",
    status: "active",
    tags: "house,deep,bass,chords",
    createdAt: "2026-01-18T16:00:00.000Z",
  },
  {
    id: "lst_5",
    type: "stem",
    title: "Ubuntu Rising — Stems Bundle",
    description: "Multi-track stems: drums, bass, keys, strings, lead vox. Mix-ready.",
    genre: "Afro Jazz",
    bpm: 100,
    priceRands: 350,
    sellerName: "Nkosi Mthembu",
    sellerId: "art_nkosi",
    status: "active",
    tags: "afro-jazz,stems,collab,mix",
    createdAt: "2026-01-20T08:00:00.000Z",
  },
  {
    id: "lst_6",
    type: "loop",
    title: "Log Drum Essentials Vol. 1",
    description: "12 signature log drum loops at 115–118 BPM. The foundation of Amapiano.",
    genre: "Amapiano",
    bpm: 116,
    priceRands: 120,
    sellerName: "DJ Khanyisa",
    sellerId: "art_khanyisa",
    status: "active",
    tags: "amapiano,log drum,essentials",
    createdAt: "2026-01-22T10:00:00.000Z",
  },
];

const VALID_TYPES = ["beat", "loop", "session", "stem"];

export function createMarketplaceRouter({ store }) {
  const router = Router();

  // List listings with optional filters: type, genre, maxPrice, q (text search).
  router.get("/marketplace", async (req, res) => {
    const { type, genre, maxPrice, q } = req.query;
    const userListings = await store.list("listings");
    const all = [...userListings, ...SEED_LISTINGS];

    let filtered = all.filter((l) => l.status === "active");
    if (type) filtered = filtered.filter((l) => l.type === type);
    if (genre) filtered = filtered.filter((l) => l.genre?.toLowerCase() === String(genre).toLowerCase());
    if (maxPrice) filtered = filtered.filter((l) => l.priceRands <= Number(maxPrice));
    if (q) {
      const qLow = String(q).toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(qLow) ||
          (l.description || "").toLowerCase().includes(qLow) ||
          (l.tags || "").toLowerCase().includes(qLow),
      );
    }

    res.json({ listings: filtered, total: filtered.length });
  });

  // Get a single listing.
  router.get("/marketplace/:id", async (req, res) => {
    const listing =
      (await store.get("listings", req.params.id)) ||
      SEED_LISTINGS.find((l) => l.id === req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ listing });
  });

  // Create a listing (authenticated sellers only).
  router.post("/marketplace", requireAuth, async (req, res) => {
    const { type, title, description, priceRands, genre, bpm, tags } = req.body || {};

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` });
    }
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!priceRands || Number(priceRands) <= 0) {
      return res.status(400).json({ error: "priceRands must be a positive number" });
    }

    const listing = await store.insert("listings", {
      type,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : "",
      priceRands: Number(priceRands),
      genre: genre || "Other",
      bpm: bpm ? Number(bpm) : null,
      tags: typeof tags === "string" ? tags : "",
      sellerId: req.user.sub,
      sellerName: req.user.email,
      status: "active",
    });
    res.status(201).json({ listing });
  });

  // Book a listing (authenticated buyers).
  router.post("/marketplace/:id/book", requireAuth, async (req, res) => {
    const listing =
      (await store.get("listings", req.params.id)) ||
      SEED_LISTINGS.find((l) => l.id === req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.status !== "active") {
      return res.status(409).json({ error: "Listing is no longer available" });
    }

    const booking = await store.insert("bookings", {
      listingId: req.params.id,
      buyerId: req.user.sub,
      status: "pending",
      note: typeof req.body?.note === "string" ? req.body.note.trim() : "",
    });
    res.status(201).json({ booking });
  });

  return router;
}
