// radar.js — the Collectible Radar.
//
// Every counted trophy on the official list becomes a sweep grid: one cell a unit PlayStation counts
// (a shooting range challenge, a meditation spot, a discovered vehicle...), grouped by the Leonida
// region the sweep runs in. Cells fill from the same counters the checklist steppers drive, so the
// radar, the checklist and the audit strip can never disagree. Region splits are the guide's own
// working split of each official total, and each grid names the trophy and total it comes from.

export const RADAR_SWEEPS = [
  { slug: 'the-shootist', label: 'Shooting Range challenges', regions: [['Vice Beach ranges', 9], ['Downtown ranges', 11], ['Port Keys ranges', 8], ['Leonida Keys ranges', 6], ['Backcountry ranges', 8]] },
  { slug: 'cunning-stunts', label: 'Stunts', regions: [['Vice City jumps', 70], ['Coastal ramps', 60], ['Keys jumps', 45], ['Backcountry jumps', 75]] },
  { slug: 'top-fun', label: 'Top Fun drone race locations', regions: [['Vice Beach', 4], ['Downtown', 4], ['The Keys', 3], ['Backcountry', 3]] },
  { slug: 'positive-mental-attitude', label: 'Meditation spots', regions: [['Ocean Beach', 4], ['Mount Kalaga trails', 5], ['The Keys', 4], ['Wetlands', 5]] },
  { slug: 'you-wainker', label: 'WAiNK It locations', regions: [['Vice Beach', 25], ['Downtown', 30], ['Port Keys', 20], ['Backcountry', 25]] },
  { slug: 'the-goodtime-state', label: 'Leonida areas explored', regions: [['Vice City', 18], ['Leonida Keys', 10], ['Port Keys', 8], ['Grassrivers & wetlands', 9], ['Mount Kalaga region', 7]] },
  { slug: 'whip-it-good', label: 'Vehicles discovered', regions: [['Everyday traffic', 40], ['Sports & super', 25], ['Boats & aircraft', 15], ['Rare spawns', 20]] },
  { slug: 'actions-speak-louder', label: 'Story choices made', regions: [['Chapter choices', 200], ['Stranger choices', 150], ['Free-roam choices', 150]] },
  { slug: 'one-last-thing', label: 'Challenges completed', regions: [['Combat challenges', 15], ['Driving challenges', 15], ['World challenges', 20]] },
  { slug: 'little-boxes', label: 'Garage properties', regions: [['Vice Beach', 2], ['Downtown', 3], ['Port Keys', 2], ['Backcountry', 1]] },
  { slug: 'pest-control', label: 'Gangs hit', regions: [['Vice City gangs', 4], ['Keys gangs', 2], ['Backcountry gangs', 3]] },
  { slug: 'on-the-spot', label: 'Scooter Bros registrations', regions: [['Vice Beach', 4], ['Downtown', 3], ['The Keys', 3]] },
];

export function renderRadar(trophies, progress, helpers) {
  const bySlug = new Map(trophies.map((trophy) => [trophy.slug, trophy]));
  const cards = RADAR_SWEEPS.map((sweep) => {
    const trophy = bySlug.get(sweep.slug);
    if (!trophy) return '';
    const total = progress.counters[trophy.slug] ?? 0;
    let cursor = 0;
    const regionHtml = sweep.regions.map(([region, size]) => {
      const filled = Math.max(0, Math.min(size, total - cursor));
      cursor += size;
      const cells = Array.from({ length: size }, (_, i) =>
        `<span class="radar-cell${i < filled ? ' filled' : ''}"></span>`).join('');
      return `<div class="radar-region">
          <div class="radar-region-head"><span>${region}</span><span>${filled}/${size}</span></div>
          <div class="radar-cells">${cells}</div>
        </div>`;
    }).join('');
    const earned = progress.earned[trophy.slug] ? ' · EARNED' : '';
    return `<section class="radar-card">
      <h3><a href="#/trophy/${trophy.slug}">${helpers.esc(trophy.name)}</a>
        <span class="radar-total">${total}/${trophy.count} ${sweep.label}${earned}</span></h3>
      ${regionHtml}
    </section>`;
  }).join('');
  return `<div class="page-head">
      <h2>Collectible Radar — every counted trophy as a sweep grid</h2>
      <p>One cell per unit PlayStation counts, grouped by region. Totals are the official PSN targets
      (PSNProfiles); the region split is this guide's working split for planning a sweep.</p>
    </div>
    <div class="radar-grid">${cards}</div>`;
}
