import sharp from 'sharp'
import * as opentypeNS from 'opentype.js'
import { WATERMARK_FONT_BASE64 } from './watermark-font.js'

// opentype.js's CJS and ESM builds expose "parse" differently depending on which
// one a given bundler/runtime resolves (package.json's "main" vs "module" field),
// and that resolution isn't even consistent between plain Node and Next's webpack
// bundle for the same import statement. Handle both shapes defensively instead of
// betting on one.
const opentype = opentypeNS.parse ? opentypeNS : opentypeNS.default

let cachedFont = null
function loadFont() {
  if (!cachedFont) {
    const buffer = Buffer.from(WATERMARK_FONT_BASE64, 'base64')
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    cachedFont = opentype.parse(arrayBuffer)
  }
  return cachedFont
}

// Diagonally tiled, semi-transparent text watermark composited over the full image.
// Kept at full resolution — the watermark is the deterrent, not a quality downgrade.
//
// Text is converted to raw SVG <path> outlines via opentype.js instead of using
// <text> + font-family/@font-face. Serverless Linux runtimes (Netlify, Lambda) have
// no system fonts and their bundled librsvg/pango doesn't reliably shape embedded
// @font-face fonts either — both silently fall back to empty "tofu" glyph boxes
// instead of throwing, so the failure isn't obvious until you look at the output.
// Pre-baked vector paths have no font dependency at rasterization time at all, so
// they render identically everywhere.
export async function applyDiagonalWatermark(imageBuffer, text) {
  const image = sharp(imageBuffer, { failOn: 'none' })
  const metadata = await image.metadata()
  let width = metadata.width || 1600
  let height = metadata.height || 1200

  // EXIF orientations 5-8 mean a 90°/270° rotation — sharp's .rotate() below
  // will swap the actual canvas dimensions, but metadata.width/height always
  // report the pre-rotation raw sensor dimensions. Without this swap, the SVG
  // overlay gets sized for the wrong orientation, and sharp's .composite()
  // rejects it outright once the two no longer match ("Image to composite
  // must have same dimensions or smaller") — this was silently failing on
  // every portrait phone photo with EXIF rotation.
  if (metadata.orientation && metadata.orientation >= 5) {
    ;[width, height] = [height, width]
  }

  const font = loadFont()
  const label = text.toUpperCase()
  const fontSize = Math.max(18, Math.round(width / 22))
  const scale = fontSize / font.unitsPerEm

  // Lay out glyphs manually (not font.getPath/stringToGlyphs) — Inter's GSUB
  // ligature tables use a substitution format opentype.js's shaper can't parse,
  // and it throws rather than skipping. Plain per-character advance is all we
  // need for uppercase watermark labels; no ligatures involved.
  let cursor = 0
  const glyphPaths = []
  for (const char of label) {
    const glyph = font.charToGlyph(char)
    glyphPaths.push(glyph.getPath(cursor, 0, fontSize).toPathData(2))
    cursor += glyph.advanceWidth * scale
  }
  const pathData = glyphPaths.join(' ')
  const textWidth = cursor

  const tileWidth = textWidth + 140
  const tileHeight = fontSize * 5
  // getPath's y=0 sits on the baseline; shift down so ascenders aren't clipped by the tile.
  const baselineY = fontSize * 0.8

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm" patternUnits="userSpaceOnUse"
          width="${tileWidth}" height="${tileHeight}"
          patternTransform="rotate(-30)">
          <g transform="translate(0, ${baselineY})">
            <path d="${pathData}"
              fill="#ffffff" fill-opacity="0.22"
              stroke="#000000" stroke-opacity="0.16" stroke-width="1"
              paint-order="stroke" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>
  `

  const buffer = await sharp(imageBuffer, { failOn: 'none' })
    .rotate() // respect EXIF orientation before compositing
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 90 })
    .toBuffer()

  // Re-measure the final buffer rather than trusting the pre-rotate metadata —
  // EXIF orientations 5-8 swap width/height on rotation, and this needs to be
  // the actual displayed aspect ratio for the gallery grid to reserve correctly.
  const finalMeta = await sharp(buffer).metadata()

  return { buffer, width: finalMeta.width || width, height: finalMeta.height || height }
}
