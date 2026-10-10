import { SoundType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes a one-shot preview or periodic chime based on soundType
 */
export function playChimeNote(soundType: SoundType): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (soundType) {
      case 'bell': {
        // Multi-harmonic bell chime (Westminster tone)
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.35 / (idx + 1), now + idx * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 1.3);
        });
        break;
      }

      case 'digital': {
        // Classic dual-tone digital alarm beep
        [0, 0.12, 0.24, 0.36].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1046.5, now + offset); // C6

          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.setValueAtTime(0.0001, now + offset + 0.08);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.09);
        });
        break;
      }

      case 'marimba': {
        // Warm organic marimba strikes
        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.12 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.6);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.7);
        });
        break;
      }

      case 'harp': {
        // Ascending harp arpeggio
        const arp = [392, 493.88, 587.33, 739.99, 880]; // G4, B4, D5, F#5, A5
        arp.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.1 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.9);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 1.0);
        });
        break;
      }

      case 'radar': {
        // High ping radar pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.4);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
        break;
      }
    }
  } catch (err) {
    console.error('Audio synthesis failed:', err);
  }
}

/**
 * Loops sound continually for the active ringing modal until returned stop callback is invoked
 */
export function startAlarmAudioLoop(soundType: SoundType, vibrate: boolean): () => void {
  // Trigger initial sound immediately
  playChimeNote(soundType);

  // Vibration on supported mobile devices
  if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([400, 200, 400, 200, 800]);
    } catch {
      // Ignore vibration error
    }
  }

  // Set up periodic repetition every 2.0 seconds
  const intervalId = window.setInterval(() => {
    playChimeNote(soundType);

    if (vibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {
        // Ignore
      }
    }
  }, 2000);

  return () => {
    window.clearInterval(intervalId);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Ignore
      }
    }
  };
}
