// PLATINUM WAR ROOM — hand-in program for the gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// The guide itself is the static app in app/ beside this file: index.html plus its ES modules, one stylesheet
// and data/trophies.json, all loading from app/ alone so it works with the network off. This program's only
// job is the hand-in: copy app/ and screenshots/ into the output directory and write dossier.json there with
// buildDossier from the vendored library, exactly as the scorer will rebuild it — vendor/makefun-frontend.ts
// stays byte for byte the kit's copy, or the dossier will not match.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR pointing at a scratch folder:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the two payload trees. Screenshots are copied only when the folder exists, so a build mid-way through
// the screenshot step still produces a dossier the author can inspect.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own (reference/gate.json). Passing them to buildDossier makes it refuse
// here, with the same words, anything the sealed gate would refuse there: over 4 screenshots or one over
// 256 KiB, over 993 files and directories or 48 MiB under app/, a dossier text over 163,840 bytes.
const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);

console.log(`war room handed in: app/ + screenshots/ -> ${outputDir}, dossier.json ${dossierBytes.length} bytes`);
