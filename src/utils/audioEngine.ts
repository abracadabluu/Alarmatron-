let currentAudioElement: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a clean, pleasant default chime note when no custom file is selected
 */
export function playDefaultChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 Westminster progression
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.35 / (idx + 1), now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 1.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 1.2);
    });
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
}

/**
 * Preview an audio tone or custom local music file once
 */
export function previewTone(toneData?: string): () => void {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }

  if (toneData) {
    try {
      const audio = new Audio(toneData);
      currentAudioElement = audio;
      audio.play().catch((e) => console.warn('Could not preview custom audio:', e));
      return () => {
        audio.pause();
        currentAudioElement = null;
      };
    } catch (e) {
      console.warn('Audio preview error:', e);
    }
  }

  playDefaultChime();
  return () => {};
}

/**
 * Continuous alarm ringing loop (for modal). Plays either custom audio looped or default chime loop.
 * Returns a cleanup/stop function.
 */
export function startAlarmLoop(
  toneData?: string,
  vibrate: boolean = true
): () => void {
  // Trigger vibration if supported
  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([400, 200, 400, 200, 800]);
    } catch {
      // Ignore
    }
  }

  let vibrationInterval: number | null = null;
  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    vibrationInterval = window.setInterval(() => {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {
        // Ignore
      }
    }, 2000);
  }

  // If user selected custom local music
  if (toneData) {
    try {
      const audio = new Audio(toneData);
      audio.loop = true;
      audio.currentTime = 0;
      audio.play().catch((e) => {
        console.warn('Custom audio playback failed, falling back to synthesizer:', e);
        playDefaultChime();
      });

      return () => {
        audio.pause();
        audio.currentTime = 0;
        if (vibrationInterval) clearInterval(vibrationInterval);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(0);
          } catch {
            // Ignore
          }
        }
      };
    } catch (err) {
      console.warn('Failed to initialize custom audio element:', err);
    }
  }

  // Synthesized fallback loop
  playDefaultChime();
  const soundInterval = window.setInterval(() => {
    playDefaultChime();
  }, 2200);

  return () => {
    clearInterval(soundInterval);
    if (vibrationInterval) clearInterval(vibrationInterval);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore
      }
    }
  };
}
