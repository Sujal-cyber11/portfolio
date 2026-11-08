const MAX_RECIPIENT_LENGTH = 60;

export function sanitizeRecipientName(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return null;
  }

  const cleaned = raw
    .normalize("NFKC")
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>&"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_RECIPIENT_LENGTH);

  return cleaned.length > 0 ? cleaned : null;
}
