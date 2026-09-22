/**
 * Audio upload and file-serve module.
 *
 * POST /audio/upload  — accept a single audio file (multipart/form-data field "file"),
 *                       store it under uploads/<id>.<ext>, return { id, url }.
 * GET  /audio/:id     — serve the stored file with range-request support so
 *                       mobile players can seek without downloading the whole file.
 *
 * Files are stored on the local filesystem in the `uploads/` directory relative
 * to the process working directory. In production, replace `dest` with an S3
 * presigned-upload flow or similar.
 */
import { Router } from "express";
import { createReadStream, statSync } from "fs";
import { mkdir } from "fs/promises";
import { join, extname } from "path";
import multer from "multer";
import { requireAuth } from "../lib/auth.js";

const UPLOADS_DIR = join(process.cwd(), "uploads");

// Ensure uploads directory exists at startup (non-fatal if it already exists).
mkdir(UPLOADS_DIR, { recursive: true }).catch(() => {});

const ALLOWED_MIME = new Set([
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav",
  "audio/ogg", "audio/flac", "audio/aac", "audio/m4a", "audio/mp4",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || ".audio";
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported audio type: ${file.mimetype}`));
  },
});

export function createAudioRouter({ store: _store }) {
  const router = Router();

  router.post("/audio/upload", requireAuth, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No audio file provided" });
    const { filename, mimetype, size } = req.file;
    res.status(201).json({
      id: filename,
      url: `/api/audio/${encodeURIComponent(filename)}`,
      mimetype,
      size,
    });
  });

  // Serve with range-request support for audio seeking.
  router.get("/audio/:id", (req, res) => {
    // Prevent path traversal — only bare filenames allowed.
    const id = req.params.id.replace(/[/\\]/g, "");
    const filePath = join(UPLOADS_DIR, id);

    let stat;
    try {
      stat = statSync(filePath);
    } catch {
      return res.status(404).json({ error: "Audio not found" });
    }

    const total = stat.size;
    const rangeHeader = req.headers.range;

    if (!rangeHeader) {
      res.writeHead(200, {
        "Content-Length": total,
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
      });
      createReadStream(filePath).pipe(res);
      return;
    }

    const [startStr, endStr] = rangeHeader.replace("bytes=", "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : total - 1;

    if (start >= total || end >= total) {
      res.writeHead(416, { "Content-Range": `bytes */${total}` });
      return res.end();
    }

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": "audio/mpeg",
    });
    createReadStream(filePath, { start, end }).pipe(res);
  });

  // Error handler for multer validation failures.
  // eslint-disable-next-line no-unused-vars
  router.use((err, _req, res, _next) => {
    if (err && err.message) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: "Upload error" });
  });

  return router;
}
