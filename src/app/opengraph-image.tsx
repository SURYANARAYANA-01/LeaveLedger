import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LeaveLedger — Enterprise Leave Management System';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
          background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: -2,
            display: 'flex',
          }}
        >
          LeaveLedger
        </div>
        <div
          style={{
            fontSize: 30,
            color: '#c7d2fe',
            marginTop: 20,
            display: 'flex',
          }}
        >
          PTO requests, approvals, and balance tracking
        </div>
      </div>
    ),
    { ...size }
  );
}
