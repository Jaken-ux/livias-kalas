import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("assets", { recursive: true });

const images = [
  { src: "assets/livia-hero.png", base: "assets/livia-hero" },
  { src: "assets/livia-pizza.png", base: "assets/livia-pizza" },
];

for (const img of images) {
  const pipeline = sharp(img.src).resize(1200, 1200, {
    fit: "inside",
    withoutEnlargement: true,
  });

  await pipeline.clone().webp({ quality: 80 }).toFile(`${img.base}.webp`);
  await pipeline.clone().jpeg({ quality: 82 }).toFile(`${img.base}.jpg`);
  console.log(`Converted ${img.src} -> .webp + .jpg`);
}
