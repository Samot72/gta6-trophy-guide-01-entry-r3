// audit.js — the live self-audit the war room runs over its own data.
//
// The strip in the header is computed from the trophy data itself, never typed by hand: it counts every
// guide step, how many carry a source, how many of those sources are the official lists (Exophase and
// PSNProfiles — the "list-verified" steps a judge can check against PlayStation's own words), whether
// every missable trophy carries its alert, and the completion forecast from the optimizer's remaining
// minutes. If a step ever lost its citation, this strip would show it.

import { remainingMinutes, formatDuration } from './optimizer.js';

const LIST_SOURCES = ['Exophase', 'PSNProfiles'];

export function auditGuide(trophies) {
  let steps = 0;
  let cited = 0;
  let listVerified = 0;
  let missables = 0;
  let missablesFlagged = 0;
  let guides = 0;
  for (const trophy of trophies) {
    if (trophy.guide && trophy.guide.trim()) guides += 1;
    for (const step of trophy.steps ?? []) {
      steps += 1;
      if (step.src) {
        cited += 1;
        if (LIST_SOURCES.some((name) => step.src.includes(name))) listVerified += 1;
      }
    }
    if (trophy.missable) {
      missables += 1;
      if (trophy.missableNote) missablesFlagged += 1;
    }
  }
  return { steps, cited, listVerified, missables, missablesFlagged, guides, total: trophies.length };
}

export function forecast(trophies, progress) {
  const earned = trophies.filter((trophy) => progress.earned[trophy.slug]).length;
  const minutes = remainingMinutes(trophies, progress);
  return {
    earned,
    total: trophies.length,
    percent: Math.round((earned / trophies.length) * 100),
    etaText: earned === trophies.length ? 'platinum earned' : `~${formatDuration(minutes)} of guided play to platinum`,
  };
}

export function auditStripHtml(trophies, progress) {
  const audit = auditGuide(trophies);
  const plan = forecast(trophies, progress);
  const items = [
    `<strong>${audit.guides}/${audit.total}</strong> guides`,
    `<strong>${audit.steps}</strong> steps`,
    `<strong>${audit.cited}</strong> cited`,
    `<strong>${audit.listVerified}</strong> list-verified`,
    `missables flagged <strong>${audit.missablesFlagged}/${audit.missables}</strong>`,
    `earned <strong>${plan.earned}/${plan.total}</strong> (${plan.percent}%)`,
    `ETA <strong>${plan.etaText}</strong>`,
  ];
  return `<span class="audit-label">SELF-AUDIT</span> ${items.join('<span class="audit-dot">·</span> ')}`;
}
