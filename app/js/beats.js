// beats.js — the Story Beats board.
//
// The campaign laid out as an operations board: one column a story beat, its mission trophies pinned to
// the beat that awards them, and the hunt's one missable trophy carrying a red alert pinned to the exact
// beat where it can be lost. Beats and the missable window are built from the official descriptions: the
// chapter trophies name the chapters, the mission trophies name the missions, and "Bad Luck, I Guess"
// ("Second time's the charm") is the one description that only works inside a single-pass story event.

export const STORY_BEATS = [
  { id: 'opening', title: 'Opening', missions: ['Gone Fishing'], note: 'The prologue. One trophy, no branches, nothing missable.' },
  { id: 'chapter-1', title: 'Chapter 1', missions: ['Chapter 1 complete'], note: 'Vice City opens up. Ocean Beach and the first free-roam trophies come online.' },
  { id: 'chapter-2', title: 'Chapter 2', missions: ['Breakfast Run', "Child's Play", 'Chapter 2 finale'], note: 'The wager event runs inside this chapter — see the missable alert before the finale.' },
  { id: 'chapter-3', title: 'Chapter 3', missions: ['The Cartel Heist', 'Headliners', 'Chapter 3 complete'], note: 'The heist arc. Partner trophies are easiest with the heat mechanics fresh.' },
  { id: 'chapter-4', title: 'Chapter 4', missions: ['VCIA Takedown', 'Operation Savage Glory', 'Chapter 4 complete'], note: 'The airport arc. VCIA stays open after the story for its departure trophy.' },
  { id: 'finale', title: 'Finale', missions: ['The final mission'], note: 'Point of no return is announced in game; clear the missable first, then finish.' },
];

export function beatsForTrophies(trophies) {
  const byBeat = new Map(STORY_BEATS.map((beat) => [beat.id, []]));
  for (const trophy of trophies) {
    if (trophy.beat && byBeat.has(trophy.beat)) byBeat.get(trophy.beat).push(trophy);
  }
  return byBeat;
}

export function renderBeats(trophies, progress, helpers) {
  const byBeat = beatsForTrophies(trophies);
  const missable = trophies.find((trophy) => trophy.missable);
  const columns = STORY_BEATS.map((beat) => {
    const pinned = (byBeat.get(beat.id) ?? [])
      .map((trophy) => helpers.trophyChip(trophy, progress))
      .join('');
    const alert = missable && missable.beat === beat.id
      ? `<div class="missable-alert">
           <strong>MISSABLE — ${helpers.esc(missable.name)}</strong>
           <p>${helpers.esc(missable.missableNote)}</p>
           <a href="#/trophy/${missable.slug}">Open the cited guide</a>
         </div>`
      : '';
    return `<section class="beat-column">
      <h3>${beat.title}</h3>
      <p class="beat-missions">${beat.missions.join(' · ')}</p>
      <p class="beat-note">${beat.note}</p>
      ${alert}
      <div class="beat-trophies">${pinned || '<p class="beat-empty">No trophy pinned to this beat.</p>'}</div>
    </section>`;
  }).join('');
  return `<div class="page-head">
      <h2>Story Beats — the campaign as an operations board</h2>
      <p>Every story trophy pinned to the beat that awards it. One trophy on this board can be lost for the
      whole run; its alert sits on the beat where the window closes, not in a footnote.</p>
    </div>
    <div class="beats-board">${columns}</div>`;
}
