export function initials(name: string): string {
  const base = name.includes("@") ? name.split("@")[0].replace(/[._-]+/g, " ") : name;
  const parts = base.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

export function firstName(name: string): string {
  const base = name.includes("@") ? name.split("@")[0].replace(/[._-]+/g, " ") : name;
  const first = base.trim().split(/\s+/)[0] ?? "";
  return first ? first[0].toUpperCase() + first.slice(1) : "";
}

const TZ = "Europe/Berlin";

export function greeting(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("de-DE", { hour: "numeric", hourCycle: "h23", timeZone: TZ })
      .formatToParts(now)
      .find((p) => p.type === "hour")?.value ?? 12,
  );
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export function longDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(now);
}
