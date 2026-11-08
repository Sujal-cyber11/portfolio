const SOUND_STORAGE_KEY = "festival-sound";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
const chimeTimes: number[] = [];

export function isFestivalSoundEnabled(): boolean {
  try {
    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setFestivalSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    return;
  }

  window.dispatchEvent(new Event("festival-sound-change"));
}

function getMasterGain(): GainNode | null {
  if (!isFestivalSoundEnabled()) {
    return null;
  }

  try {
    const AudioConstructor =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioConstructor) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioConstructor();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.14;
      masterGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => undefined);
    }

    return masterGain;
  } catch {
    return null;
  }
}

export function playFestivalChime(): void {
  const targetGain = getMasterGain();

  if (!targetGain || !audioContext) {
    return;
  }

  const now = performance.now();
  const recent = chimeTimes.filter((time) => now - time < 1000);
  chimeTimes.length = 0;
  chimeTimes.push(...recent);

  if (chimeTimes.length >= 4) {
    return;
  }

  chimeTimes.push(now);

  const oscillator = audioContext.createOscillator();
  const chimeGain = audioContext.createGain();
  const start = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(720 + Math.random() * 180, start);
  oscillator.frequency.exponentialRampToValueAtTime(
    1180 + Math.random() * 220,
    start + 0.12,
  );
  chimeGain.gain.setValueAtTime(0.0001, start);
  chimeGain.gain.exponentialRampToValueAtTime(0.26, start + 0.02);
  chimeGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
  oscillator.connect(chimeGain).connect(targetGain);
  oscillator.start(start);
  oscillator.stop(start + 0.6);
}
