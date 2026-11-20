// warroom.js — PLATINUM WAR ROOM, the mission-control dashboard for the GTA VI platinum hunt.
//
// One page, five views by hash: the war room (optimizer queue, progress board, missable watch, forecast
// and the live tracker), the story-beats board, the collectible radar, the staged roadmap and the full
// checklist, plus a detail page per trophy with its cited steps. All state flows through store.js; the
// audit strip in the header is recomputed from the data on every render, so what the screenshots show
// is what the data says.

import { loadProgress, saveProgress, toggleEarned, setCounter, counterOf, isEarned, exportProgress, importProgress, demoProgress } from './store.js';
import { nextBestQueue, formatDuration, GRADE_ORDER } from './optimizer.js';
import { auditStripHtml, auditGuide, forecast } from './audit.js';
import { renderBeats } from './beats.js';
import { renderRadar } from './radar.js';

export const STAGES = [
  { n: 1, name: 'Opening & Chapter 1', brief: 'Learn the city, bank the free trophies, start every counter early.' },
  { n: 2, name: 'Chapters 2–3 — Missable Watch', brief: 'The wager event lives here. Clear the missable before the Chapter 2 finale.' },
  { n: 3, name: 'Chapter 4 & the Finale', brief: 'Finish the story with every story trophy banked; VCIA stays open afterwards.' },
  { n: 4, name: 'Stranger Arcs', brief: 'Five named arcs plus the strand count — mop them up while the map is fresh.' },
  { n: 5, name: 'Collectible Sweep', brief: 'Run the radar region by region: spots, cards, locations, vehicles, garages.' },
  { n: 6, name: 'Activities & Medals', brief: 'Ranges, races, stunts and challenges — the skill grinds, done in focused sessions.' },
  { n: 7, name: 'Crime, Cash & Chaos Cleanup', brief: 'Heists, robberies, money targets and the one-off world trophies.' },
  { n: 8, name: '100% & the Platinum', brief: 'Close the completion checklist; A Long Road hands you the platinum.' },
];

export const KIND_LABELS = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', world: 'World & crime', completion: 'Completion' };

let trophies = [];
let progress = loadProgress();
const filters = { kind: 'all', grade: 'all', query: '', unearnedOnly: false };

export function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function gradeBadge(trophy) {
  return `<span class="grade grade-${trophy.grade}">${trophy.grade.toUpperCase()}</span>`;
}

function isMasked(trophy) {
  return progress.settings.spoilers && trophy.kind === 'story' && !isEarned(progress, trophy.slug);
}

function displayName(trophy) {
  return isMasked(trophy) ? '— story trophy under spoiler shield —' : trophy.name;
}

function displayDescription(trophy) {
  return isMasked(trophy) ? 'Name and description hidden until earned. Turn the shield off in the tab bar to peek.' : trophy.description;
}

export function trophyChip(trophy, prog) {
  const earned = isEarned(prog, trophy.slug);
  return `<a class="trophy-chip${earned ? ' earned' : ''}${trophy.missable ? ' missable' : ''}" href="#/trophy/${trophy.slug}">
    ${gradeBadge(trophy)}<span>${esc(displayName(trophy))}</span>${trophy.missable ? '<em>MISSABLE</em>' : ''}${earned ? '<b>✓</b>' : ''}
  </a>`;
}

const helpers = { esc, trophyChip };

function counterControl(trophy) {
  if (!trophy.count) return '<span class="counter-none">—</span>';
  const value = counterOf(progress, trophy);
  return `<span class="counter">
    <button type="button" data-counter="-1" data-slug="${trophy.slug}" aria-label="decrease">−</button>
    <span class="counter-value">${value}/${trophy.count}</span>
    <button type="button" data-counter="1" data-slug="${trophy.slug}" aria-label="increase">+</button>
  </span>`;
}

function trophyRow(trophy) {
  const earned = isEarned(progress, trophy.slug);
  const stage = STAGES.find((s) => s.n === trophy.stage);
  return `<tr class="trophy-row${earned ? ' earned' : ''}" data-slug="${trophy.slug}">
    <td><input type="checkbox" data-earn="${trophy.slug}" ${earned ? 'checked' : ''} aria-label="mark earned"></td>
    <td>${gradeBadge(trophy)}</td>
    <td class="cell-name"><a href="#/trophy/${trophy.slug}">${esc(displayName(trophy))}</a>
      ${trophy.hidden ? '<span class="tag tag-hidden">HIDDEN</span>' : ''}
      ${trophy.missable ? '<span class="tag tag-missable">MISSABLE</span>' : ''}
      <span class="cell-desc">${esc(displayDescription(trophy))}</span></td>
    <td>${KIND_LABELS[trophy.kind] ?? trophy.kind}</td>
    <td>${counterControl(trophy)}</td>
    <td title="${esc(stage?.name ?? '')}">S${trophy.stage}</td>
    <td>${formatDuration(trophy.minutes)}</td>
    <td><span class="pips" title="difficulty ${trophy.difficulty}/5">${'●'.repeat(trophy.difficulty)}${'○'.repeat(5 - trophy.difficulty)}</span></td>
  </tr>`;
}

function matchesFilters(trophy) {
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.unearnedOnly && isEarned(progress, trophy.slug)) return false;
  if (filters.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.kind}`.toLowerCase();
    if (!hay.includes(filters.query.toLowerCase())) return false;
  }
  return true;
}

function filterBar() {
  const kindOptions = [['all', 'All kinds'], ['story', 'Story'], ['missable', 'Missable'], ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['world', 'World & crime'], ['completion', 'Completion']];
  const chips = kindOptions.map(([value, label]) =>
    `<button type="button" class="chip${filters.kind === value ? ' active' : ''}" data-kind="${value}">${label}</button>`).join('');
  const grades = ['all', 'platinum', 'gold', 'silver', 'bronze'].map((grade) =>
    `<option value="${grade}"${filters.grade === grade ? ' selected' : ''}>${grade === 'all' ? 'All grades' : grade}</option>`).join('');
  return `<div class="filter-bar">
    <div class="chips">${chips}</div>
    <select id="grade-filter" aria-label="grade filter">${grades}</select>
    <input type="search" id="query" placeholder="Search the 55…" value="${esc(filters.query)}" aria-label="search trophies">
    <label class="unearned-toggle"><input type="checkbox" id="unearned-only" ${filters.unearnedOnly ? 'checked' : ''}> unearned only</label>
  </div>`;
}

function checklistTable(list) {
  const rows = list.filter(matchesFilters).map(trophyRow).join('');
  return `${filterBar()}
  <table class="tracker">
    <thead><tr><th></th><th>Grade</th><th>Trophy — official name &amp; description</th><th>Kind</th><th>PSN count</th><th>Stage</th><th>Effort</th><th>Difficulty</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="8" class="empty">No trophy matches these filters.</td></tr>'}</tbody>
  </table>`;
}

function progressBoard() {
  const plan = forecast(trophies, progress);
  const gradeRows = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const all = trophies.filter((t) => t.grade === grade);
    const done = all.filter((t) => isEarned(progress, t.slug)).length;
    const pct = Math.round((done / all.length) * 100);
    return `<div class="bar-row"><span class="grade grade-${grade}">${grade.toUpperCase()}</span>
      <span class="bar"><span class="bar-fill" style="width:${pct}%"></span></span>
      <span class="bar-count">${done}/${all.length}</span></div>`;
  }).join('');
  const stageRows = STAGES.map((stage) => {
    const all = trophies.filter((t) => t.stage === stage.n);
    const done = all.filter((t) => isEarned(progress, t.slug)).length;
    return `<div class="stage-row"><span>S${stage.n} ${esc(stage.name)}</span><b>${done}/${all.length}</b></div>`;
  }).join('');
  return `<section class="panel progress-panel">
    <h2>Progress board — ${plan.earned}/${plan.total} earned (${plan.percent}%)</h2>
    ${gradeRows}
    <div class="stage-rows">${stageRows}</div>
  </section>`;
}

function optimizerPanel() {
  const queue = nextBestQueue(trophies, progress, 6);
  const queueMinutes = queue.reduce((sum, { trophy }) => sum + trophy.minutes, 0);
  const items = queue.map(({ trophy }, index) => `<li>
      <span class="queue-rank">${index + 1}</span>
      <a href="#/trophy/${trophy.slug}">${esc(displayName(trophy))}</a>
      ${gradeBadge(trophy)}
      <span class="queue-meta">${KIND_LABELS[trophy.kind]} · ${formatDuration(trophy.minutes)} · diff ${trophy.difficulty}/5${trophy.count ? ` · ${counterOf(progress, trophy)}/${trophy.count}` : ''}${trophy.missable ? ' · MISSABLE' : ''}</span>
    </li>`).join('');
  return `<section class="panel queue-panel">
    <h2>Next best — the optimizer queue</h2>
    <p class="panel-note">Ranked by PSN points per guided hour, banked counter progress and missable risk.
    Clearing this queue takes ~${formatDuration(queueMinutes)} of guided play.</p>
    <ol class="queue">${items}</ol>
  </section>`;
}

function missablePanel() {
  const missable = trophies.find((t) => t.missable);
  if (!missable) return '';
  const earned = isEarned(progress, missable.slug);
  return `<section class="panel missable-panel">
    <h2>Missable watch — 1 of 1 flagged</h2>
    <p class="missable-name">${esc(missable.name)} ${gradeBadge(missable)}</p>
    <p>${esc(missable.missableNote)}</p>
    <p class="missable-status">${earned ? 'Status: BANKED — this run is safe.' : 'Status: OPEN — window closes at the Chapter 2 finale.'}</p>
    <a href="#/beats">See it pinned on the Story Beats board</a>
  </section>`;
}

function forecastPanel() {
  const plan = forecast(trophies, progress);
  const audit = auditGuide(trophies);
  return `<section class="panel forecast-panel">
    <h2>Completion forecast</h2>
    <p class="forecast-big">${esc(plan.etaText)}</p>
    <p>${audit.steps} cited steps across ${audit.guides} guides · ${audit.listVerified} steps verified against the
    official lists (Exophase, PSNProfiles) · every step names its source beside it.</p>
  </section>`;
}

function renderWarRoom(view) {
  view.innerHTML = `<div class="warroom-grid">
      ${optimizerPanel()}
      ${progressBoard()}
      <div class="side-stack">${missablePanel()}${forecastPanel()}</div>
    </div>
    <section class="panel tracker-panel">
      <h2>The tracker — all 55, official names, descriptions and grades</h2>
      ${checklistTable(trophies)}
    </section>`;
}

function renderChecklist(view) {
  view.innerHTML = `<div class="page-head"><h2>Checklist — the full tracker</h2>
    <p>Progress saves in this browser automatically. Export it before you switch machines; import restores it whole.</p></div>
    ${checklistTable(trophies)}`;
}

function renderRoadmap(view) {
  const sections = STAGES.map((stage) => {
    const list = trophies.filter((t) => t.stage === stage.n);
    const minutes = list.reduce((sum, t) => sum + t.minutes, 0);
    const done = list.filter((t) => isEarned(progress, t.slug)).length;
    return `<section class="roadmap-stage">
      <h3>Stage ${stage.n} — ${esc(stage.name)} <span class="roadmap-meta">${done}/${list.length} earned · ~${formatDuration(minutes)}</span></h3>
      <p>${esc(stage.brief)}</p>
      <div class="chip-row">${list.map((t) => trophyChip(t, progress)).join('')}</div>
    </section>`;
  }).join('');
  view.innerHTML = `<div class="page-head"><h2>Roadmap to the platinum — 8 stages, in the order to earn them</h2>
    <p>Built from the official descriptions: story first with the missable cleared in its window, then arcs,
    sweeps and medals, and the 100% checklist last — it hands you A Long Road and the platinum together.</p></div>
    ${sections}`;
}

function renderDetail(view, slug) {
  const trophy = trophies.find((t) => t.slug === slug);
  if (!trophy) { view.innerHTML = '<p class="empty">Trophy not found.</p>'; return; }
  const earned = isEarned(progress, trophy.slug);
  const stage = STAGES.find((s) => s.n === trophy.stage);
  const steps = (trophy.steps ?? []).map((step, i) =>
    `<li><span class="step-n">${i + 1}</span><span class="step-do">${esc(step.do)}</span><span class="cite">Source: ${esc(step.src)}</span></li>`).join('');
  const sources = (trophy.sources ?? []).map((s) => `<li>${esc(s)}</li>`).join('');
  view.innerHTML = `<article class="detail">
    <p class="crumb"><a href="#/checklist">← back to the tracker</a></p>
    <h2>${esc(displayName(trophy))} ${gradeBadge(trophy)} ${trophy.hidden ? '<span class="tag tag-hidden">HIDDEN</span>' : ''}</h2>
    <p class="detail-desc">“${esc(displayDescription(trophy))}” — official description</p>
    ${trophy.missable ? `<div class="missable-alert"><strong>MISSABLE</strong><p>${esc(trophy.missableNote)}</p></div>` : ''}
    <div class="detail-meta">
      <span>Kind: <b>${KIND_LABELS[trophy.kind]}</b></span>
      <span>Stage: <b>S${trophy.stage} ${esc(stage?.name ?? '')}</b></span>
      <span>Effort: <b>${formatDuration(trophy.minutes)}</b></span>
      <span>Difficulty: <b>${trophy.difficulty}/5</b></span>
      ${trophy.count ? `<span>PSN target: <b>${counterOf(progress, trophy)}/${trophy.count} ${esc(trophy.unit ?? '')}</b></span>` : ''}
      <span>Status: <b>${earned ? 'EARNED' : 'not yet'}</b></span>
      <button type="button" data-earn="${trophy.slug}">${earned ? 'Mark not earned' : 'Mark earned'}</button>
      ${trophy.count ? counterControl(trophy) : ''}
    </div>
    <h3>The guide — our words, every step cited</h3>
    <p class="guide-text">${esc(trophy.guide)}</p>
    <ol class="steps">${steps}</ol>
    <h3>Sources for this trophy</h3>
    <ul class="sources">${sources}</ul>
  </article>`;
}

function render() {
  const view = document.getElementById('view');
  const hash = location.hash || '#/warroom';
  const [_, route, param] = hash.split('/');
  document.getElementById('audit-strip').innerHTML = auditStripHtml(trophies, progress);
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === (route || 'warroom'));
  });
  const spoilerToggle = document.getElementById('spoiler-toggle');
  if (spoilerToggle) spoilerToggle.checked = progress.settings.spoilers;
  if (route === 'beats') view.innerHTML = renderBeats(trophies, progress, helpers);
  else if (route === 'radar') view.innerHTML = renderRadar(trophies, progress, helpers);
  else if (route === 'roadmap') renderRoadmap(view);
  else if (route === 'checklist') renderChecklist(view);
  else if (route === 'trophy') renderDetail(view, param);
  else renderWarRoom(view);
}

function bindChrome() {
  document.getElementById('export-btn').addEventListener('click', () => exportProgress(progress));
  document.getElementById('import-file').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    importProgress(file).then((next) => { progress = next; render(); }).catch(() => { /* bad file: keep current progress */ });
  });
  document.getElementById('spoiler-toggle').addEventListener('change', (event) => {
    progress.settings.spoilers = event.target.checked;
    saveProgress(progress);
    render();
  });
  const view = document.getElementById('view');
  view.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-kind]');
    if (chip) { filters.kind = chip.dataset.kind; render(); return; }
    const counterBtn = event.target.closest('[data-counter]');
    if (counterBtn) {
      const trophy = trophies.find((t) => t.slug === counterBtn.dataset.slug);
      if (trophy) { setCounter(progress, trophy, counterOf(progress, trophy) + Number(counterBtn.dataset.counter)); render(); }
      return;
    }
    const earnBtn = event.target.closest('button[data-earn]');
    if (earnBtn) { toggleEarned(progress, earnBtn.dataset.earn); render(); }
  });
  view.addEventListener('change', (event) => {
    if (event.target.id === 'grade-filter') { filters.grade = event.target.value; render(); }
    if (event.target.id === 'unearned-only') { filters.unearnedOnly = event.target.checked; render(); }
    const box = event.target.closest('input[data-earn]');
    if (box) { toggleEarned(progress, box.dataset.earn); render(); }
  });
  view.addEventListener('input', (event) => {
    if (event.target.id === 'query') {
      filters.query = event.target.value;
      const table = view.querySelector('.tracker');
      if (table) {
        const fresh = document.createElement('div');
        fresh.innerHTML = checklistTable(trophies);
        table.replaceWith(fresh.querySelector('.tracker'));
        const bar = view.querySelector('.filter-bar');
        const freshBar = fresh.querySelector('.filter-bar');
        if (bar && freshBar) bar.replaceWith(freshBar);
        const input = view.querySelector('#query');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  });
  window.addEventListener('hashchange', render);
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const data = await response.json();
  trophies = (data.trophies ?? []).slice().sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id);
  if (new URLSearchParams(location.search).has('demo')) {
    progress = demoProgress(trophies);
    saveProgress(progress);
  }
  bindChrome();
  render();
}

boot();
