/**
 * Audacity-quality DSP processors for Web Audio API AudioWorklet context.
 *
 * Four processors registered here:
 *   spectral-noise-gate   — FFT spectral subtraction noise reduction (Audacity NoiseReduction.cpp)
 *   loudness-meter        — ITU-R BS.1770-4 K-weighted LUFS metering (Audacity Loudness.cpp)
 *   parametric-eq         — 5-band fully parametric biquad EQ
 *   lookahead-limiter     — True-peak lookahead limiter
 *
 * All self-contained: no imports, no external dependencies.
 */

/* ─────────────────────────────────────────────────────────────────
   Shared DSP utilities
   ───────────────────────────────────────────────────────────────── */

/** In-place Cooley-Tukey DIT radix-2 FFT (n must be power of two). */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const ang = -2 * Math.PI / len;
    const wRe0 = Math.cos(ang), wIm0 = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < halfLen; j++) {
        const uRe = re[i + j], uIm = im[i + j];
        const vRe = re[i + j + halfLen] * curRe - im[i + j + halfLen] * curIm;
        const vIm = re[i + j + halfLen] * curIm + im[i + j + halfLen] * curRe;
        re[i + j]          = uRe + vRe;
        im[i + j]          = uIm + vIm;
        re[i + j + halfLen] = uRe - vRe;
        im[i + j + halfLen] = uIm - vIm;
        const nr = curRe * wRe0 - curIm * wIm0;
        curIm   = curRe * wIm0 + curIm * wRe0;
        curRe   = nr;
      }
    }
  }
}

/** In-place IFFT via conjugate trick. */
function ifft(re, im) {
  const n = re.length;
  for (let i = 0; i < n; i++) im[i] = -im[i];
  fft(re, im);
  const inv = 1 / n;
  for (let i = 0; i < n; i++) { re[i] *= inv; im[i] = -im[i] * inv; }
}

/**
 * Compute biquad coefficients [b0,b1,b2,a1,a2] for several standard filter types.
 * Uses Audio EQ Cookbook formulas (Robert Bristow-Johnson).
 */
function biquadCoeffs(type, freq, gainDb, Q, fs) {
  const w0 = 2 * Math.PI * freq / fs;
  const cos0 = Math.cos(w0), sin0 = Math.sin(w0);
  const alpha = sin0 / (2 * Q);
  const A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  switch (type) {
    case 'lowpass':
      b0 = (1 - cos0) / 2; b1 = 1 - cos0; b2 = b0;
      a0 = 1 + alpha; a1 = -2 * cos0; a2 = 1 - alpha; break;
    case 'highpass':
      b0 = (1 + cos0) / 2; b1 = -(1 + cos0); b2 = b0;
      a0 = 1 + alpha; a1 = -2 * cos0; a2 = 1 - alpha; break;
    case 'bandpass':
      b0 = sin0 / 2; b1 = 0; b2 = -b0;
      a0 = 1 + alpha; a1 = -2 * cos0; a2 = 1 - alpha; break;
    case 'notch':
      b0 = 1; b1 = -2 * cos0; b2 = 1;
      a0 = 1 + alpha; a1 = -2 * cos0; a2 = 1 - alpha; break;
    case 'peak':
      b0 = 1 + alpha * A; b1 = -2 * cos0; b2 = 1 - alpha * A;
      a0 = 1 + alpha / A; a1 = -2 * cos0; a2 = 1 - alpha / A; break;
    case 'lowshelf': {
      const sqA = Math.sqrt(A);
      b0 = A * ((A + 1) - (A - 1) * cos0 + 2 * sqA * alpha);
      b1 = 2 * A * ((A - 1) - (A + 1) * cos0);
      b2 = A * ((A + 1) - (A - 1) * cos0 - 2 * sqA * alpha);
      a0 = (A + 1) + (A - 1) * cos0 + 2 * sqA * alpha;
      a1 = -2 * ((A - 1) + (A + 1) * cos0);
      a2 = (A + 1) + (A - 1) * cos0 - 2 * sqA * alpha; break;
    }
    case 'highshelf': {
      const sqA = Math.sqrt(A);
      b0 = A * ((A + 1) + (A - 1) * cos0 + 2 * sqA * alpha);
      b1 = -2 * A * ((A - 1) + (A + 1) * cos0);
      b2 = A * ((A + 1) + (A - 1) * cos0 - 2 * sqA * alpha);
      a0 = (A + 1) - (A - 1) * cos0 + 2 * sqA * alpha;
      a1 = 2 * ((A - 1) - (A + 1) * cos0);
      a2 = (A + 1) - (A - 1) * cos0 - 2 * sqA * alpha; break;
    }
    default:
      return [1, 0, 0, 0, 0];
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}

/** Apply a biquad filter in-place using direct-form II transposed. Returns updated state [z1, z2]. */
function applyBiquad(x, b0, b1, b2, a1, a2, z1, z2) {
  const y = b0 * x + z1;
  z1 = b1 * x - a1 * y + z2;
  z2 = b2 * x - a2 * y;
  return [y, z1, z2];
}

/* ─────────────────────────────────────────────────────────────────
   1. Spectral Noise Gate (Audacity NoiseReduction.cpp algorithm)
   ─────────────────────────────────────────────────────────────────
   Processor name: 'spectral-noise-gate'
   Messages to worklet:
     { type: 'learnStart' }   — begin capturing noise profile
     { type: 'learnStop'  }   — freeze profile, switch to gate mode
     { type: 'params', sensitivity: 0..3, smoothing: 0..100 }
   Messages from worklet:
     { type: 'profileReady' } — profile is captured
   ───────────────────────────────────────────────────────────────── */
class SpectralNoiseGateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'sensitivity', defaultValue: 1.5, minValue: 0.1, maxValue: 5.0, automationRate: 'k-rate' },
      { name: 'smoothing',   defaultValue: 0.7, minValue: 0.0, maxValue: 1.0, automationRate: 'k-rate' }
    ];
  }

  constructor(options) {
    super(options);
    this._N     = 1024;
    this._hop   = 256;    // 75% overlap
    this._inBuf = new Float32Array(this._N);
    this._outBuf = new Float32Array(this._N);
    this._inPos  = 0;
    this._outPos = 0;
    this._outFill = new Float32Array(this._N * 2);

    this._window = new Float32Array(this._N);
    for (let i = 0; i < this._N; i++)
      this._window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / this._N));

    this._noise  = new Float32Array(this._N / 2 + 1); // mean noise magnitude per bin
    this._smooth = new Float32Array(this._N / 2 + 1); // smoothed gain per bin
    this._learnFrames = 0;
    this._learnAcc    = new Float32Array(this._N / 2 + 1);
    this._mode = 'passthrough'; // 'passthrough' | 'learn' | 'gate'

    this.port.onmessage = ({ data }) => {
      if (data.type === 'learnStart') {
        this._mode = 'learn';
        this._learnFrames = 0;
        this._learnAcc.fill(0);
      } else if (data.type === 'learnStop') {
        if (this._learnFrames > 0) {
          const inv = 1 / this._learnFrames;
          for (let k = 0; k < this._noise.length; k++)
            this._noise[k] = this._learnAcc[k] * inv;
        }
        this._mode = 'gate';
        this.port.postMessage({ type: 'profileReady' });
      } else if (data.type === 'params') {
        if (data.sensitivity !== undefined) this._sensitivity = data.sensitivity;
        if (data.smoothing   !== undefined) this._smoothingCoef = data.smoothing;
      } else if (data.type === 'bypass') {
        this._mode = 'passthrough';
      }
    };
  }

  process(inputs, outputs, parameters) {
    const inp = inputs[0]?.[0];
    const out = outputs[0]?.[0];
    if (!inp || !out) return true;

    const sensitivity = parameters.sensitivity[0];
    const smoothing   = parameters.smoothing[0];
    const n128 = inp.length;

    for (let si = 0; si < n128; si++) {
      this._inBuf[this._inPos++] = inp[si];
      if (this._inPos === this._hop) {
        this._processFrame(sensitivity, smoothing);
        this._inBuf.copyWithin(0, this._hop);
        this._inPos = 0;
      }
      out[si] = this._outFill[this._outPos++];
      if (this._outPos >= this._N) this._outPos = 0;
    }
    return true;
  }

  _processFrame(sensitivity, smoothing) {
    const N = this._N, half = N / 2 + 1;
    const re = new Float32Array(N), im = new Float32Array(N);

    // Apply Hann window and copy to FFT buffer
    for (let i = 0; i < N; i++) re[i] = this._inBuf[i] * this._window[i];

    if (this._mode === 'passthrough') {
      // Pass through windowed signal via overlap-add
      this._overlapAdd(re);
      return;
    }

    fft(re, im);

    if (this._mode === 'learn') {
      for (let k = 0; k < half; k++)
        this._learnAcc[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      this._learnFrames++;
      this._overlapAdd(re);
      return;
    }

    // Gate mode: spectral subtraction
    for (let k = 0; k < half; k++) {
      const mag  = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      const phase = Math.atan2(im[k], re[k]);
      const floor = this._noise[k] * sensitivity;
      // Soft-knee: gain ramps from 0 at mag=floor*0.5 to 1 at mag=floor*1.5
      let gain;
      if (mag >= floor * 1.5) {
        gain = 1.0;
      } else if (mag <= floor * 0.5) {
        gain = 0.0;
      } else {
        const t = (mag - floor * 0.5) / floor;
        gain = t * t * (3 - 2 * t); // smoothstep
      }
      // Temporal smoothing per bin
      this._smooth[k] = smoothing * this._smooth[k] + (1 - smoothing) * gain;
      const newMag = mag * this._smooth[k];
      re[k] = newMag * Math.cos(phase);
      im[k] = newMag * Math.sin(phase);
      if (k > 0 && k < half - 1) {
        re[N - k] = re[k]; im[N - k] = -im[k]; // conjugate symmetry
      }
    }

    ifft(re, im);
    // Un-window and overlap-add
    for (let i = 0; i < N; i++) re[i] *= this._window[i];
    this._overlapAdd(re);
  }

  _overlapAdd(frame) {
    const N = this._N, hop = this._hop;
    const half = N / 2;
    for (let i = 0; i < N; i++) {
      const pos = (this._outPos + i) % (N * 2);
      this._outFill[pos] = (this._outFill[pos] || 0) + frame[i] / (N / hop / 2);
    }
  }
}

registerProcessor('spectral-noise-gate', SpectralNoiseGateProcessor);

/* ─────────────────────────────────────────────────────────────────
   2. Loudness Meter — ITU-R BS.1770-4 (Audacity Loudness.cpp)
   ─────────────────────────────────────────────────────────────────
   Processor name: 'loudness-meter'
   Posts every ~100 ms:
     { momentary, shortTerm, integrated }  (all in LUFS, negative floats)
   ───────────────────────────────────────────────────────────────── */
class LoudnessMeterProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const fs = sampleRate;

    // Stage 1: high-shelf pre-filter (BS.1770 Table 1)
    const c1 = biquadCoeffs('highshelf', 1500, 3.999843853, 0.7071752369, fs);
    this._s1 = c1;
    this._s1z = [0, 0, 0, 0]; // z1L, z2L, z1R, z2R

    // Stage 2: high-pass RLB filter
    const c2 = biquadCoeffs('highpass', 38.1339637947, 0, 0.5, fs);
    this._s2 = c2;
    this._s2z = [0, 0, 0, 0];

    // Momentary: 400ms window
    this._momLen  = Math.round(0.400 * fs);
    this._momBuf  = new Float64Array(this._momLen);
    this._momPos  = 0;
    this._momSum  = 0;

    // Short-term: 3s window
    this._stLen   = Math.round(3.0 * fs);
    this._stBuf   = new Float64Array(this._stLen);
    this._stPos   = 0;
    this._stSum   = 0;

    // Integrated (gated)
    this._intMomBuf = []; // array of 400ms block means
    this._intSum    = 0;
    this._intCount  = 0;
    this._blockCur  = 0;
    this._blockLen  = this._momLen;

    // Report interval ~100ms
    this._reportInterval = Math.round(0.1 * fs);
    this._reportCounter  = 0;
  }

  process(inputs, outputs, parameters) {
    const inp = inputs[0];
    const out = outputs[0];
    // Pass audio through untouched
    for (let ch = 0; ch < inp.length; ch++) {
      if (out[ch]) out[ch].set(inp[ch]);
    }

    const chL = inp[0], chR = inp[1] || inp[0];
    if (!chL) return true;

    const [b0s1, b1s1, b2s1, a1s1, a2s1] = this._s1;
    const [b0s2, b1s2, b2s2, a1s2, a2s2] = this._s2;

    for (let i = 0; i < chL.length; i++) {
      // Apply K-weighting to L and R
      let [yL, z1L, z2L] = applyBiquad(chL[i], b0s1, b1s1, b2s1, a1s1, a2s1, this._s1z[0], this._s1z[1]);
      this._s1z[0] = z1L; this._s1z[1] = z2L;
      let [yR, z1R, z2R] = applyBiquad(chR[i], b0s1, b1s1, b2s1, a1s1, a2s1, this._s1z[2], this._s1z[3]);
      this._s1z[2] = z1R; this._s1z[3] = z2R;

      [yL, z1L, z2L] = applyBiquad(yL, b0s2, b1s2, b2s2, a1s2, a2s2, this._s2z[0], this._s2z[1]);
      this._s2z[0] = z1L; this._s2z[1] = z2L;
      [yR, z1R, z2R] = applyBiquad(yR, b0s2, b1s2, b2s2, a1s2, a2s2, this._s2z[2], this._s2z[3]);
      this._s2z[2] = z1R; this._s2z[3] = z2R;

      const ms = 0.5 * (yL * yL + yR * yR); // mean square (mono downmix)

      // Momentary ring buffer
      this._momSum -= this._momBuf[this._momPos];
      this._momBuf[this._momPos] = ms;
      this._momSum += ms;
      this._momPos = (this._momPos + 1) % this._momLen;

      // Short-term ring buffer
      this._stSum -= this._stBuf[this._stPos];
      this._stBuf[this._stPos] = ms;
      this._stSum += ms;
      this._stPos = (this._stPos + 1) % this._stLen;

      // Integrated: accumulate block
      this._blockCur++;
      if (this._blockCur >= this._blockLen) {
        const blockMean = this._momSum / this._momLen;
        const lufsBlock = 10 * Math.log10(blockMean) - 0.691;
        // Absolute gate: -70 LUFS
        if (lufsBlock > -70) {
          this._intMomBuf.push(blockMean);
          this._intSum   += blockMean;
          this._intCount++;
        }
        this._blockCur = 0;
      }

      this._reportCounter++;
      if (this._reportCounter >= this._reportInterval) {
        this._reportCounter = 0;
        const mom = 10 * Math.log10(Math.max(1e-10, this._momSum / this._momLen)) - 0.691;
        const st  = 10 * Math.log10(Math.max(1e-10, this._stSum  / this._stLen))  - 0.691;

        // Relative gate pass for integrated
        let integrated = -Infinity;
        if (this._intCount > 0) {
          const prelim = 10 * Math.log10(this._intSum / this._intCount) - 0.691;
          const relThresh = prelim - 10;
          let gatedSum = 0, gatedCount = 0;
          for (const b of this._intMomBuf) {
            const bLufs = 10 * Math.log10(Math.max(1e-10, b)) - 0.691;
            if (bLufs > relThresh && bLufs > -70) { gatedSum += b; gatedCount++; }
          }
          if (gatedCount > 0)
            integrated = 10 * Math.log10(gatedSum / gatedCount) - 0.691;
        }

        this.port.postMessage({
          type: 'lufs',
          momentary:  isFinite(mom)        ? mom        : -70,
          shortTerm:  isFinite(st)         ? st         : -70,
          integrated: isFinite(integrated) ? integrated : -70
        });
      }
    }
    return true;
  }
}

registerProcessor('loudness-meter', LoudnessMeterProcessor);

/* ─────────────────────────────────────────────────────────────────
   3. Parametric EQ — 5-band fully parametric biquad
   ─────────────────────────────────────────────────────────────────
   Processor name: 'parametric-eq'
   AudioParams (per band 0..4, k-rate):
     eq-{n}-gain  dB gain (-24..+24)
     eq-{n}-freq  Hz (20..20000)
     eq-{n}-q     Q (0.1..16)
   Band types are fixed: lowshelf, peak, peak, peak, highshelf
   ───────────────────────────────────────────────────────────────── */
const EQ_TYPES = ['lowshelf', 'peak', 'peak', 'peak', 'highshelf'];
const EQ_DEFAULTS = [
  { freq: 80,   gain: 0, Q: 0.707 },
  { freq: 240,  gain: 0, Q: 1.0   },
  { freq: 1000, gain: 0, Q: 1.0   },
  { freq: 4000, gain: 0, Q: 1.0   },
  { freq: 12000, gain: 0, Q: 0.707 }
];

class ParametricEQProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return EQ_DEFAULTS.flatMap((d, n) => [
      { name: `eq-${n}-gain`, defaultValue: 0,      minValue: -24, maxValue: 24,    automationRate: 'k-rate' },
      { name: `eq-${n}-freq`, defaultValue: d.freq,  minValue: 20,  maxValue: 20000, automationRate: 'k-rate' },
      { name: `eq-${n}-q`,    defaultValue: d.Q,     minValue: 0.1, maxValue: 16,    automationRate: 'k-rate' }
    ]);
  }

  constructor(options) {
    super(options);
    this._channels = 2;
    // z-state per band per channel: [z1, z2]
    this._z = Array.from({ length: 5 }, () =>
      Array.from({ length: this._channels }, () => [0, 0])
    );
    this._bypass = false;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'bypass') this._bypass = data.value;
      if (data.type === 'channels') this._channels = data.value;
    };
  }

  process(inputs, outputs, parameters) {
    const inp = inputs[0];
    const out = outputs[0];
    if (!inp?.length) return true;

    const numCh = Math.min(inp.length, out.length, this._channels);

    // Pre-compute coefficients for all 5 bands (k-rate, so once per block is fine)
    const coeffs = EQ_TYPES.map((type, n) => {
      const gain = parameters[`eq-${n}-gain`][0];
      const freq = parameters[`eq-${n}-freq`][0];
      const q    = parameters[`eq-${n}-q`][0];
      if (gain === 0 && type === 'peak') return null; // identity passthrough
      return biquadCoeffs(type, freq, gain, q, sampleRate);
    });

    for (let ch = 0; ch < numCh; ch++) {
      const x = inp[ch], y = out[ch];
      for (let i = 0; i < x.length; i++) {
        let s = x[i];
        if (!this._bypass) {
          for (let n = 0; n < 5; n++) {
            const c = coeffs[n];
            if (!c) continue;
            const [b0, b1, b2, a1, a2] = c;
            const z = this._z[n][ch];
            const result = applyBiquad(s, b0, b1, b2, a1, a2, z[0], z[1]);
            s = result[0]; z[0] = result[1]; z[1] = result[2];
          }
        }
        y[i] = s;
      }
    }
    return true;
  }
}

registerProcessor('parametric-eq', ParametricEQProcessor);

/* ─────────────────────────────────────────────────────────────────
   4. Lookahead Limiter — true-peak, soft-knee
   ─────────────────────────────────────────────────────────────────
   Processor name: 'lookahead-limiter'
   AudioParams (k-rate):
     ceiling   dBFS limit ceiling   (default -1 dBFS)
     release   release time in ms   (default 100 ms)
   ───────────────────────────────────────────────────────────────── */
class LookaheadLimiterProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'ceiling', defaultValue: -1.0,   minValue: -24, maxValue: 0,    automationRate: 'k-rate' },
      { name: 'release', defaultValue: 100.0,  minValue: 10,  maxValue: 2000, automationRate: 'k-rate' }
    ];
  }

  constructor(options) {
    super(options);
    this._lookaheadMs = 5;
    this._fs = sampleRate;
    this._lookaheadSamples = Math.round(this._lookaheadMs / 1000 * this._fs);
    const maxChannels = 2;
    this._ring = Array.from({ length: maxChannels }, () =>
      new Float32Array(this._lookaheadSamples + 128)
    );
    this._ringPos = 0;
    this._attackSamples = Math.round(0.0005 * this._fs); // 0.5ms attack
    this._gain = 1.0;
    this._gainSmooth = 1.0;
    this._channels = maxChannels;
  }

  process(inputs, outputs, parameters) {
    const inp = inputs[0];
    const out = outputs[0];
    if (!inp?.length) return true;

    const ceiling = Math.pow(10, parameters.ceiling[0] / 20);
    const releaseMs = parameters.release[0];
    const relCoef = Math.exp(-1 / (releaseMs / 1000 * this._fs));
    const attackCoef = Math.exp(-1 / this._attackSamples);

    const numCh = Math.min(inp.length, out.length);
    const n = inp[0].length;

    for (let i = 0; i < n; i++) {
      // Find peak across channels at lookahead position
      let peak = 0;
      for (let ch = 0; ch < numCh; ch++) {
        const sample = inp[ch][i];
        const ridx = (this._ringPos + i) % this._ring[ch].length;
        this._ring[ch][ridx] = sample;
        // True-peak approximation: 4x oversampled via linear interpolation
        const prevSample = this._ring[ch][(ridx - 1 + this._ring[ch].length) % this._ring[ch].length] || 0;
        for (let sub = 0; sub < 4; sub++) {
          const t = sub / 4;
          const interpolated = Math.abs((1 - t) * prevSample + t * sample);
          if (interpolated > peak) peak = interpolated;
        }
      }

      // Gain computation
      let desiredGain = peak > ceiling ? ceiling / (peak + 1e-30) : 1.0;

      // Attack (instantaneous on overshoot) or release (exponential)
      if (desiredGain < this._gainSmooth) {
        this._gainSmooth = desiredGain; // instant attack
      } else {
        this._gainSmooth = relCoef * this._gainSmooth + (1 - relCoef) * desiredGain;
      }

      // Output delayed signal (lookahead) multiplied by gain
      for (let ch = 0; ch < numCh; ch++) {
        const delayedIdx = (this._ringPos + i - this._lookaheadSamples + this._ring[ch].length) % this._ring[ch].length;
        out[ch][i] = this._ring[ch][delayedIdx] * this._gainSmooth;
      }
    }

    this._ringPos = (this._ringPos + n) % this._ring[0].length;
    return true;
  }
}

registerProcessor('lookahead-limiter', LookaheadLimiterProcessor);
