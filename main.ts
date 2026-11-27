// Turkey Trouble — entry program (Node 22, standard library only).
// Hands the game in: copies game/ and screenshots/ from beside this file
// to /output and writes /output/dossier.json with the vendored make.fun
// library. Fully deterministic: no clock, no randomness, no network, no
// deletion of the output directory — only mkdirSync + cpSync + writeFileSync.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Dotfiles (e.g. .gitkeep) must never reach /output: the grade run rejects
// any output path that is not a plain relative name, so both copies skip
// every file whose name starts with a dot.
const skipDotfiles = (src: string) => !basename(src).startsWith('.');

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), {
  recursive: true,
  filter: skipDotfiles,
});
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), {
    recursive: true,
    filter: skipDotfiles,
  });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);