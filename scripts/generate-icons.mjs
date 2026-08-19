// Renders the DiveFinder mark (scripts/logo.svg, scripts/logo-maskable.svg)
// into every PNG the app/manifest reference. Requires `sharp` — install it
// ad hoc (`npm install --no-save sharp`) before running; it is NOT a
// runtime dependency of the app, only a build-time tool for regenerating
// icons when the logo changes.
//
// Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";

const logo = readFileSync(new URL("./logo.svg", import.meta.url));
const logoMaskable = readFileSync(new URL("./logo-maskable.svg", import.meta.url));

async function render(svgBuffer, size, outPath) {
  await sharp(svgBuffer, { density: 384 }).resize(size, size).png().toFile(outPath);
  console.log(`Wrote ${outPath} (${size}x${size})`);
}

for (const size of [192, 512]) {
  await render(logo, size, `public/icons/icon-${size}.png`);
}
await render(logoMaskable, 512, "public/icons/maskable-512.png");
await render(logo, 180, "public/icons/apple-touch-icon.png");
await render(logo, 512, "src/app/icon.png");
await render(logo, 32, "public/favicon-32.png");
