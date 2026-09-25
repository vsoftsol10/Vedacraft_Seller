import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const imagesDirectory = path.resolve(scriptDirectory, "../src/assets/images");
const input = path.join(imagesDirectory, "logo.png");
const output = path.join(imagesDirectory, "logo-transparent.png");
const transparentRadius = 32;
const featherRadius = 48;

const source = sharp(input).ensureAlpha();
const { data, info } = await source.raw().toBuffer({ resolveWithObject: true });

for (let offset = 0; offset < data.length; offset += 4) {
  const distance = Math.hypot(255 - data[offset], 255 - data[offset + 1], 255 - data[offset + 2]);
  if (distance < featherRadius) {
    const opacity = Math.max(0, Math.min(1, (distance - transparentRadius) / (featherRadius - transparentRadius)));
    data[offset + 3] = Math.round(data[offset + 3] * opacity);
  }
}

// The source includes a light-gray rectangular frame. Remove only light neutral
// pixels connected to an outer edge so similar light pixels inside the artwork
// are not treated as background.
const isEdgeBackground = (pixelIndex) => {
  const offset = pixelIndex * 4;
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  return Math.min(red, green, blue) >= 180 && Math.max(red, green, blue) - Math.min(red, green, blue) <= 20;
};
const visited = new Uint8Array(info.width * info.height);
const queue = [];
const visit = (pixelIndex) => {
  if (!visited[pixelIndex] && isEdgeBackground(pixelIndex)) {
    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  }
};

for (let x = 0; x < info.width; x += 1) {
  visit(x);
  visit((info.height - 1) * info.width + x);
}
for (let y = 1; y < info.height - 1; y += 1) {
  visit(y * info.width);
  visit(y * info.width + info.width - 1);
}

for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const pixelIndex = queue[cursor];
  data[pixelIndex * 4 + 3] = 0;
  const x = pixelIndex % info.width;
  const y = Math.floor(pixelIndex / info.width);
  if (x > 0) visit(pixelIndex - 1);
  if (x < info.width - 1) visit(pixelIndex + 1);
  if (y > 0) visit(pixelIndex - info.width);
  if (y < info.height - 1) visit(pixelIndex + info.width);
}

await sharp(data, { raw: info })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
  .png()
  .toFile(output);

const metadata = await sharp(output).metadata();
console.log(`${output}: ${metadata.width}x${metadata.height}, alpha=${metadata.hasAlpha}`);
