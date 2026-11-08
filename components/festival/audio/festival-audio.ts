export const FESTIVAL_SOUND_STORAGE_KEY = "festival-sound";

export interface FestivalSoundStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
const chimeTimes: number[] = [];

export function soundPreferenceFromValue(value: string | null): boolean {
  return value !== "off";
}

export function soundPreferenceValue(enabled: boolean): "on" | "off" {
  return enabled ? "on" : "off";
}

export function readFestivalSoundPreference(
  storage: FestivalSoundStorage | null,
): boolean {
  if (!storage) {
    return true;
  }

  try {
    return soundPreferenceFromValue(
      storage.getItem(FESTIVAL_SOUND_STORAGE_KEY),
    );
  } catch {
    return true;
  }
}

export function writeFestivalSoundPreference(
  storage: FestivalSoundStorage | null,
  enabled: boolean,
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(FESTIVAL_SOUND_STORAGE_KEY, soundPreferenceValue(enabled));
  } catch {
    return;
  }
}

function browserStorage(): FestivalSoundStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isFestivalSoundEnabled(): boolean {
  return readFestivalSoundPreference(browserStorage());
}

export function subscribeFestivalSound(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleChange(): void {
    callback();
  }

  window.addEventListener("storage", handleChange);
  window.addEventListener("festival-sound-change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("festival-sound-change", handleChange);
  };
}

export function getFestivalSoundSnapshot(): boolean {
  return isFestivalSoundEnabled();
}

export function getServerFestivalSoundSnapshot(): boolean {
  return true;
}

export function setFestivalSoundEnabled(enabled: boolean): void {
  writeFestivalSoundPreference(browserStorage(), enabled);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("festival-sound-change"));
  }
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
