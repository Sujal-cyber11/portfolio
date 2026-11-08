import type { Festival } from "@/lib/schema";

const INDIA_TIME_ZONE = "Asia/Kolkata";

const istDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: INDIA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function getIstDate(date: Date): CalendarDate {
  const parts = istDateFormatter.formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.get("year")),
    month: Number(values.get("month")),
    day: Number(values.get("day")),
  };
}

function toDayNumber(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));

  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function matchesWindow(
  today: number,
  start: CalendarDate,
  end: CalendarDate,
  recurringYearly: boolean,
  referenceYear: number,
): boolean {
  if (!recurringYearly) {
    const startDay = toDayNumber(start.year, start.month, start.day);
    let endDay = toDayNumber(end.year, end.month, end.day);

    if (endDay < startDay) {
      endDay = toDayNumber(end.year + 1, end.month, end.day);
    }

    return today >= startDay && today <= endDay;
  }

  for (const yearOffset of [-1, 0, 1]) {
    const startYear = referenceYear + yearOffset;
    const startDay = toDayNumber(startYear, start.month, start.day);
    let endYear = startYear;

    if (
      toDayNumber(startYear, end.month, end.day) <
      toDayNumber(startYear, start.month, start.day)
    ) {
      endYear += 1;
    }

    const endDay = toDayNumber(endYear, end.month, end.day);

    if (today >= startDay && today <= endDay) {
      return true;
    }
  }

  return false;
}

export function getActiveFestival(
  date: Date,
  festivals: Festival[],
): Festival | null {
  const { year, month, day } = getIstDate(date);
  const today = toDayNumber(year, month, day);
  const active = new Map<string, Festival>();

  for (const festival of festivals) {
    if (!festival.enabled) {
      continue;
    }

    for (const window of festival.windows) {
      const start = parseIsoDate(window.start);
      const end = parseIsoDate(window.end);

      if (
        start &&
        end &&
        matchesWindow(today, start, end, festival.recurringYearly, year)
      ) {
        const existing = active.get(festival.id);

        if (!existing || festival.priority > existing.priority) {
          active.set(festival.id, festival);
        }

        break;
      }
    }
  }

  return (
    [...active.values()].sort(
      (a, b) =>
        b.priority - a.priority || a.name.localeCompare(b.name, "en-IN"),
    )[0] ?? null
  );
}
