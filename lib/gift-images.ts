import { existsSync } from "node:fs";
import { join } from "node:path";

export type SweetImageKey = "laddu" | "kajuKatli" | "jalebi" | "barfi";
export type SweetImageMap = Partial<Record<SweetImageKey, string>>;

const sweetFiles: Array<{ key: SweetImageKey; base: string }> = [
  { key: "laddu", base: "laddu" },
  { key: "kajuKatli", base: "kaju-katli" },
  { key: "jalebi", base: "jalebi" },
  { key: "barfi", base: "barfi" },
];

const extensions = ["webp", "png", "jpg"];

export function getSweetImages(): SweetImageMap {
  const images: SweetImageMap = {};

  for (const sweet of sweetFiles) {
    for (const extension of extensions) {
      const fileName = `${sweet.base}.${extension}`;
      const filePath = join(process.cwd(), "public", "gifts", fileName);

      if (existsSync(filePath)) {
        images[sweet.key] = `/gifts/${fileName}`;
        break;
      }
    }
  }

  return images;
}
