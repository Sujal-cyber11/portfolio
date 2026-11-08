import { describe, expect, it } from "vitest";
import {
  FESTIVAL_SOUND_STORAGE_KEY,
  readFestivalSoundPreference,
  soundPreferenceFromValue,
  soundPreferenceValue,
  writeFestivalSoundPreference,
  type FestivalSoundStorage,
} from "@/components/festival/audio/festival-audio";

function memoryStorage(): FestivalSoundStorage {
  const values = new Map<string, string>();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("festival sound preference", () => {
  it("defaults to on and persists both states", () => {
    const storage = memoryStorage();

    expect(readFestivalSoundPreference(storage)).toBe(true);

    writeFestivalSoundPreference(storage, false);
    expect(storage.getItem(FESTIVAL_SOUND_STORAGE_KEY)).toBe("off");
    expect(readFestivalSoundPreference(storage)).toBe(false);

    writeFestivalSoundPreference(storage, true);
    expect(storage.getItem(FESTIVAL_SOUND_STORAGE_KEY)).toBe("on");
    expect(readFestivalSoundPreference(storage)).toBe(true);
  });

  it("uses the same values as the splash sound choices", () => {
    expect(soundPreferenceValue(true)).toBe("on");
    expect(soundPreferenceValue(false)).toBe("off");
    expect(soundPreferenceFromValue("on")).toBe(true);
    expect(soundPreferenceFromValue("off")).toBe(false);
    expect(soundPreferenceFromValue(null)).toBe(true);
  });
});
