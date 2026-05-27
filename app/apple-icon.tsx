import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #003087 0%, #1a4fa0 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          borderRadius: '36px',
        }}
      >
        <span style={{ fontSize: 80, lineHeight: 1 }}>⚽</span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-0.5px',
          }}
        >
          WC26
        </span>
      </div>
    ),
    { ...size }
  )
}
