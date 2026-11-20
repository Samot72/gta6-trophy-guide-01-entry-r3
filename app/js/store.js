// store.js — the war room's progress store.
//
// Progress lives in one object: { earned: {slug: true}, counters: {slug: n}, settings: {spoilers: bool} }.
// It persists to localStorage under one key, exports to a JSON file the hunter can keep, and imports back
// from that file. Nothing leaves the browser: no fetch, no beacon, the app works with the network off.

const STORAGE_KEY = 'platinum-war-room/v1';

export function blankProgress() {
  return { earned: {}, counters: {}, settings: { spoilers: false } };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankProgress();
    const parsed = JSON.parse(raw);
    const base = blankProgress();
    return {
      earned: parsed.earned ?? base.earned,
      counters: parsed.counters ?? base.counters,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return blankProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or blocked: the in-memory copy still drives the session.
  }
}

export function isEarned(progress, slug) {
  return progress.earned[slug] === true;
}

export function toggleEarned(progress, slug) {
  if (progress.earned[slug]) delete progress.earned[slug];
  else progress.earned[slug] = true;
  saveProgress(progress);
  return isEarned(progress, slug);
}

export function counterOf(progress, trophy) {
  return progress.counters[trophy.slug] ?? 0;
}

export function setCounter(progress, trophy, value) {
  const clamped = Math.max(0, Math.min(trophy.count ?? 0, Math.floor(value) || 0));
  progress.counters[trophy.slug] = clamped;
  // A counter that reaches its PlayStation target earns the trophy on its own.
  if (trophy.count && clamped >= trophy.count) progress.earned[trophy.slug] = true;
  saveProgress(progress);
  return clamped;
}

export function exportProgress(progress) {
  const payload = JSON.stringify({ app: 'platinum-war-room', version: 1, progress }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'platinum-war-room-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

export function importProgress(file) {
  return file.text().then((text) => {
    const parsed = JSON.parse(text);
    const candidate = parsed.progress ?? parsed;
    if (typeof candidate !== 'object' || candidate === null || typeof candidate.earned !== 'object') {
      throw new Error('not a war room progress file');
    }
    const base = blankProgress();
    const progress = {
      earned: candidate.earned ?? base.earned,
      counters: candidate.counters ?? base.counters,
      settings: { ...base.settings, ...(candidate.settings ?? {}) },
    };
    saveProgress(progress);
    return progress;
  });
}

// Demo seed, used to take the entry's screenshots with a hunt under way: ?demo=1 marks the opening
// trophies earned and walks the big counters part way, exactly as a mid-hunt save would look.
export function demoProgress(trophies) {
  const progress = blankProgress();
  const earnedSlugs = [
    'just-like-paradise', 'paradise-lost', 'in-the-beginning', 'trust',
    'master-of-none', 'stick-fiddler', 'baited-my-tackle', 'top-fun',
    'earn-cash-not-kudos', 'ts-ass-drug-money', 'family-matters', 'hot-together', 'gunslinger',
  ];
  for (const slug of earnedSlugs) progress.earned[slug] = true;
  const partial = {
    'the-shootist': 17, 'cunning-stunts': 96, 'top-fun': 14, 'whip-it-good': 41,
    'positive-mental-attitude': 7, 'you-wainker': 23, 'the-goodtime-state': 19,
    'actions-speak-louder': 132, 'one-last-thing': 21, 'earn-cash-not-kudos': 20,
  };
  for (const trophy of trophies) {
    if (partial[trophy.slug] !== undefined) progress.counters[trophy.slug] = partial[trophy.slug];
  }
  progress.settings.spoilers = false;
  return progress;
}
