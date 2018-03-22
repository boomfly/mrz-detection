'use strict';

const path = require('path');

const fs = require('fs-extra');
const { generateSymbolImage, getLinesFromImage } = require('ocr-tools');
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
const roiOptions = require('../src/roiOptions');
const { writeImages } = require('../src/util/readWrite');

if (!argv.outDir) {
  throw new Error('outDir argument is required');
}

let outDir = path.resolve(argv.outDir);

async function generate() {
  await fs.mkdirp(outDir);
  const files = await fs.readdir(outDir);
  if (files.length > 0) throw new Error('outDir must be emtpy');

  const { image, chars } = await generateSymbolImage({
    allowedRotation: 2,
    numberPerLine: 3,
    fontSize: 48,
    fontName: 'ocrb'
  });
  await image.save('data/alph.png');
  const { lines } = getLinesFromImage(image, {
    roiOptions: Object.assign({}, roiOptions, {
      minRatio: undefined,
      maxRatio: undefined
    }),
    fingerprintOptions: {
      width: 18,
      height: 18
    }
  });
  console.log(lines.length);
  let count = 0;
  for (let line of lines) {
    // eslint-disable-next-line no-await-in-loop
    for (let roi of line.rois) {
      const img = image.crop({
        x: roi.minX,
        y: roi.minY,
        width: roi.width,
        height: roi.height
      });
      await writeImages({
        filePath: path.join(outDir, `${chars[count]}-${count}.png`),
        image: img,
        generated: true,
        char: chars[count],
        code: chars[count].charCodeAt(0)
      });
      count++;
    }
  }
}

generate();
