import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 110,
            fontWeight: 600,
            color: 'white',
            letterSpacing: -2,
          }}
        >
          Arty
          <span style={{ color: '#7AB8CB' }}>Drop</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 32,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Premium photo gallery delivery for photographers
        </div>
      </div>
    ),
    { ...size }
  )
}
