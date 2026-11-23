// 진행 단계 이름 (간단 분석 흐름 / 상세 분석 흐름)
export const SIMPLE_STEPS = ['아이디어 입력', '요약 결과', '추가 질문', '상세 분석']
export const DETAIL_STEPS = ['기본 입력', '상세 질문', '결과 열기', '상세 결과·보고서']

// 지도 더미 그림의 세 구역. 백엔드에 경계 자료가 없어 모양과 점수 모두 예시다.
export const ZONES = [
  { id: 'A', name: '핵심 상권', score: 74, color: '#e9a23b', points: '120,90 250,70 290,170 200,220 110,180', label: [150, 150] },
  { id: 'B', name: '주변 상권', score: 81, color: '#1aa38a', points: '290,170 400,140 450,230 360,290 280,250', label: [320, 225] },
  { id: 'C', name: '외곽', score: 46, color: '#8aa0d8', points: '360,290 470,260 520,350 420,390 350,350', label: [400, 335] },
]
