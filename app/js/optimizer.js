// optimizer.js — the Next-Best-Trophy optimizer.
//
// Every unearned trophy is scored the way a hunter feels value: PlayStation's own points for the grade
// (bronze 15, silver 30, gold 90, platinum 300) divided by the guided minutes it takes and a difficulty
// divisor, with a counter already under way earning a momentum bonus for the progress banked so far.
// The queue the war room shows is simply this ranking, top first — finish what pays fastest, and let the
// long grinds sink until their stage arrives.

export const GRADE_POINTS = { bronze: 15, silver: 30, gold: 90, platinum: 300 };
export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function effortScore(trophy, progress) {
  const points = GRADE_POINTS[trophy.grade] ?? 15;
  const minutes = Math.max(5, trophy.minutes ?? 30);
  const difficulty = Math.max(1, trophy.difficulty ?? 2);
  let score = points / (minutes * (0.6 + 0.4 * difficulty));
  if (trophy.count) {
    const banked = (progress.counters[trophy.slug] ?? 0) / trophy.count;
    if (banked > 0) score *= 1 + banked; // sunk progress pulls a grind up the queue
  }
  if (trophy.missable) score *= 1.5; // a trophy that can be lost outranks everything near it
  return score;
}

export function nextBestQueue(trophies, progress, limit = 6) {
  const open = trophies.filter((trophy) => !progress.earned[trophy.slug]);
  // The platinum unlocks itself when the other 54 land, so it never leads the queue while anything
  // else is open — it only tops the list when it is the last trophy standing.
  const pool = open.some((trophy) => trophy.grade !== 'platinum')
    ? open.filter((trophy) => trophy.grade !== 'platinum')
    : open;
  return pool
    .map((trophy) => ({ trophy, score: effortScore(trophy, progress) }))
    .sort((a, b) => b.score - a.score || GRADE_ORDER[a.trophy.grade] - GRADE_ORDER[b.trophy.grade])
    .slice(0, limit);
}

export function remainingMinutes(trophies, progress) {
  let total = 0;
  for (const trophy of trophies) {
    if (progress.earned[trophy.slug]) continue;
    let minutes = trophy.minutes ?? 30;
    if (trophy.count) {
      const banked = (progress.counters[trophy.slug] ?? 0) / trophy.count;
      minutes = Math.round(minutes * (1 - Math.min(0.9, banked)));
    }
    total += minutes;
  }
  return total;
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
