/**
 * Copyright (c) 2020 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const { promisify } = require("util");
const exists = promisify(require("fs").exists);
const sharp = require("sharp");

/**
 * Generates sensible sizes for each image for use in a srcset.
 */

const widths = [1920, 1280, 840, 320];

const extension = {
  jpeg: "jpg",
  webp: "webp",
  avif: "avif",
  png: "png",
};

const quality = {
  avif: 40,
  default: 80,
};

module.exports = async function srcset(filename, format) {
  const names = await Promise.all(
    widths.map((w) => resize(filename, w, format))
  );
  return {
    srcset: names.map((n, i) => `${n} ${widths[i]}w`).join(", "),
    fallback: names[0],
  };
};

async function resize(filename, width, format) {
  const out = sizedName(filename, width, format);
  if (await exists("_site" + out)) {
    return out;
  }
  await sharp("_site" + filename)
    .rotate() // Manifest rotation from metadata
    .resize(width)
    [format]({
      quality: quality[format] || quality.default,
      reductionEffort: 6,
    })
    .toFile("_site" + out);

  return out;
}

function sizedName(filename, width, format) {
  const ext = extension[format];
  if (!ext) {
    throw new Error(`Unknown format ${format}`);
  }
  return filename.replace(/\.\w+$/, (_) => "-" + width + "w" + "." + ext);
}
