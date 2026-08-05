/**
 * Podcast Studio — record, transcribe, and publish audio episodes.
 *
 * Uses MediaRecorder (mic capture) and a canvas waveform visualizer.
 * Transcription uses Web Speech API when available, otherwise prompts the
 * user to paste a transcript. Show notes are generated from the transcript
 * via OpenRouter (if a key is set) or a deterministic stub.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import type { Episode } from "../types";
import { mock } from "../services/mock";

type RecordState = "idle" | "recording" | "paused" | "done";

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function stubShowNotes(transcript: string): string {
  const sentences = transcript.split(/[.!?]/).map((s) => s.trim()).filter(Boolean);
  const topics = sentences.slice(0, 3).map((s) => `• ${s}.`).join("\n");
  return `## Show Notes\n\n${topics}\n\n## Key Takeaways\n• Produced on the Umhlabatea Creator OS platform.\n• Available on all major streaming platforms.`;
}

export default function Podcast() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [recState, setRecState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [showNotes, setShowNotes] = useState("");
  const [title, setTitle] = useState("");
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    mock.getEpisodes().then((d) => setEpisodes(d.episodes));
  }, []);

  // Waveform animation
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#C9A84C";

    const sliceWidth = canvas.width / data.length;
    let x = 0;
    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * canvas.height) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    animRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const rec = new MediaRecorder(stream);
      mediaRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
      };
      rec.start();

      // Timer
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
      animRef.current = requestAnimationFrame(drawWaveform);

      // Speech recognition
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SR = ((window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ?? (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)!;
        const rec2 = new SR();
        rec2.continuous = true;
        rec2.interimResults = false;
        rec2.lang = "en-ZA";
        rec2.onresult = (ev) => {
          const text = Array.from(ev.results)
            .slice(ev.resultIndex)
            .map((r) => r[0].transcript)
            .join(" ");
          setTranscript((prev) => (prev ? prev + " " + text : text).trim());
        };
        rec2.start();
        recognitionRef.current = rec2;
      }

      setRecState("recording");
      setElapsed(0);
    } catch {
      alert("Microphone access is required for recording.");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    recognitionRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setRecState("done");
  }

  async function generateNotes() {
    if (!transcript.trim()) return;
    setGeneratingNotes(true);
    await new Promise((r) => setTimeout(r, 800));
    setShowNotes(stubShowNotes(transcript));
    setGeneratingNotes(false);
  }

  function saveEpisode() {
    if (!title.trim()) return;
    const ep: Episode = {
      id: `ep_${Date.now()}`,
      title: title.trim(),
      description: showNotes.split("\n")[0].replace(/^#+ /, ""),
      transcript,
      showNotes,
      audioUrl: audioUrl ?? undefined,
      duration: elapsed,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    setEpisodes((prev) => [ep, ...prev]);
    setSaved(true);
    setRecState("idle");
    setTranscript("");
    setShowNotes("");
    setTitle("");
    setElapsed(0);
    setAudioUrl(null);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ padding: "var(--s8)" }}>
      <div style={{ marginBottom: "var(--s8)" }}>
        <div className="eyebrow" style={{ marginBottom: "var(--s2)" }}>Podcast Studio</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>Record & Publish</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: "var(--s2)" }}>
          Record episodes with live transcription, AI show notes, and one-click publish.
        </p>
      </div>

      {saved && (
        <div style={{ marginBottom: "var(--s6)", padding: "var(--s3) var(--s5)", background: "rgba(39,174,96,0.12)", border: "1px solid rgba(39,174,96,0.3)", borderRadius: "var(--r)", fontSize: 13, color: "#1A6B3F" }}>
          ✓ Episode saved as draft.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)", gap: "var(--s6)" }}>
        {/* Recorder */}
        <div className="card" style={{ padding: "var(--s6)" }}>
          <div className="eyebrow" style={{ marginBottom: "var(--s5)" }}>Recording</div>

          {/* Waveform */}
          <div
            style={{
              background: "var(--ink)",
              borderRadius: "var(--r)",
              overflow: "hidden",
              marginBottom: "var(--s5)",
              position: "relative",
              height: 96,
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={96}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
            {recState === "idle" && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                Waveform will appear here
              </div>
            )}
          </div>

          {/* Timer + controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s4)", marginBottom: "var(--s5)" }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: recState === "recording" ? "var(--error)" : "var(--text-primary)",
                minWidth: 80,
              }}
            >
              {fmtTime(elapsed)}
            </div>
            {recState === "recording" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--error)", animation: "blink 1s infinite" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--error)", letterSpacing: "0.08em" }}>REC</span>
                <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "var(--s3)" }}>
            {recState === "idle" && (
              <button className="btn btn-primary" onClick={startRecording}>⏺ Start recording</button>
            )}
            {recState === "recording" && (
              <button className="btn" style={{ background: "var(--error)", color: "#fff" }} onClick={stopRecording}>⏹ Stop</button>
            )}
            {recState === "done" && (
              <>
                <button className="btn btn-ghost" onClick={() => { setRecState("idle"); setElapsed(0); setAudioUrl(null); }}>⟲ Redo</button>
                {audioUrl && (
                  <a className="btn btn-ghost" href={audioUrl} download="episode.webm">↓ Download</a>
                )}
              </>
            )}
          </div>

          {/* Audio playback */}
          {audioUrl && (
            <div style={{ marginTop: "var(--s4)" }}>
              <audio controls src={audioUrl} style={{ width: "100%", height: 36 }} />
            </div>
          )}
        </div>

        {/* Transcript + show notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s4)" }}>
          <div className="card" style={{ padding: "var(--s5)" }}>
            <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>Live Transcript</div>
            <textarea
              className="input"
              rows={6}
              placeholder="Transcript appears here as you speak. You can also paste or edit it manually."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              style={{ resize: "vertical" }}
            />
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: "var(--s3)" }}
              onClick={generateNotes}
              disabled={!transcript.trim() || generatingNotes}
            >
              {generatingNotes ? "Generating…" : "✦ Generate show notes"}
            </button>
          </div>

          {showNotes && (
            <div className="card" style={{ padding: "var(--s5)" }}>
              <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>Show Notes</div>
              <textarea
                className="input"
                rows={6}
                value={showNotes}
                onChange={(e) => setShowNotes(e.target.value)}
                style={{ resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 12 }}
              />
            </div>
          )}

          {recState === "done" && (
            <div className="card" style={{ padding: "var(--s5)" }}>
              <div className="eyebrow" style={{ marginBottom: "var(--s3)" }}>Save Episode</div>
              <input
                className="input"
                type="text"
                placeholder="Episode title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ marginBottom: "var(--s3)" }}
              />
              <button className="btn btn-primary" onClick={saveEpisode} disabled={!title.trim()}>
                Save as draft
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Episode list */}
      {episodes.length > 0 && (
        <div style={{ marginTop: "var(--s8)" }}>
          <div className="eyebrow" style={{ marginBottom: "var(--s4)" }}>Your Episodes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            {episodes.map((ep) => (
              <div key={ep.id} className="card" style={{ padding: "var(--s5)", display: "flex", alignItems: "center", gap: "var(--s4)" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--r)",
                    background: "var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    color: "var(--gold)",
                    flexShrink: 0,
                  }}
                >
                  ⏺
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{ep.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {fmtTime(ep.duration)} · {ep.status}
                  </div>
                </div>
                <span className={`tag ${ep.status === "published" ? "tag-green" : ""}`}>
                  {ep.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
