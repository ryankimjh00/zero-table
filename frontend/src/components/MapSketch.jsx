import { ZONES } from '../constants/flow.js'

// 지도 자리의 더미 그림. 백엔드가 상권 경계 도형을 주지 않아 실제 지도 대신 단순한 그림으로 그린다.

export default function MapSketch({ highlight = 'B', placeName }) {
  return (
    <svg className="map-sketch" viewBox="0 0 600 420" role="img" aria-label="예시 상권 지도">
      <rect width="600" height="420" fill="#1d2433" />
      {/* 강과 큰길 */}
      <path d="M0 380 C150 340 300 420 600 360 L600 420 L0 420 Z" fill="#26344d" />
      <path d="M0 120 C200 110 300 60 600 80" stroke="#35c4a5" strokeWidth="4" fill="none" opacity="0.7" />
      <path d="M60 0 L140 420 M330 0 L300 420 M520 0 L470 420" stroke="#2c3547" strokeWidth="10" />
      {ZONES.map((z) => (
        <g key={z.id}>
          <polygon points={z.points} fill={z.color} fillOpacity={z.id === highlight ? 0.45 : 0.2}
            stroke={z.color} strokeWidth={z.id === highlight ? 3 : 1.5} />
          <text x={z.label[0]} y={z.label[1]} fill="#ffffff" fontSize="15" fontWeight="600">{z.name} · {z.score}</text>
        </g>
      ))}
      <text x="20" y="30" fill="#ffffff" fontSize="15" fontWeight="700">예시 상권 지도</text>
      <text x="20" y="50" fill="#b9c2d4" fontSize="12">{placeName} 주변 · 실제 위치·경계가 아니에요</text>
    </svg>
  )
}
