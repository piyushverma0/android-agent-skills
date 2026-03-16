import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: '#07090f', color: '#eef4ff', padding: 40, justifyContent: 'center'
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800 }}>ANDROID-SKILL</div>
        <div style={{ marginTop: 16, fontSize: 32 }}>Android skills for AI coding agents</div>
        <div style={{ marginTop: 30, fontSize: 26, fontFamily: 'monospace' }}>
          npx skills add piyushverma0/android-agent-skills
        </div>
      </div>
    ),
    size
  );
}
