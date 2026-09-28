import sharp from 'sharp'

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Diagonally tiled, semi-transparent text watermark composited over the full image.
// Kept at full resolution — the watermark is the deterrent, not a quality downgrade.
export async function applyDiagonalWatermark(imageBuffer, text) {
  const image = sharp(imageBuffer, { failOn: 'none' })
  const metadata = await image.metadata()
  const width = metadata.width || 1600
  const height = metadata.height || 1200

  const label = escapeXml(text.toUpperCase())
  const fontSize = Math.max(18, Math.round(width / 22))
  const tileWidth = fontSize * (label.length * 0.62) + 140
  const tileHeight = fontSize * 5

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="wm" patternUnits="userSpaceOnUse"
          width="${tileWidth}" height="${tileHeight}"
          patternTransform="rotate(-30)">
          <text x="0" y="${fontSize}" font-family="Helvetica, Arial, sans-serif"
            font-size="${fontSize}" font-weight="600" letter-spacing="2"
            fill="#ffffff" fill-opacity="0.22"
            stroke="#000000" stroke-opacity="0.16" stroke-width="1"
            paint-order="stroke">${label}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)" />
    </svg>
  `

  return sharp(imageBuffer, { failOn: 'none' })
    .rotate() // respect EXIF orientation before compositing
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 90 })
    .toBuffer()
}
