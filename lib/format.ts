const monthYearFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function formatMonthYear(isoDate: string): string {
  return monthYearFormatter.format(toUtcDate(isoDate));
}

export function formatReadableDate(isoDate: string): string {
  return fullDateFormatter.format(toUtcDate(isoDate));
}
