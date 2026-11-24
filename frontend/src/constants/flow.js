// 진행 단계 이름 (간단 분석 흐름 / 상세 분석 흐름)
export const SIMPLE_STEPS = ['아이디어 입력', '요약 결과', '추가 질문', '상세 분석']
export const DETAIL_STEPS = ['기본 입력', '상세 질문', '결과 열기', '상세 결과·보고서']

// 상세 보고서 입지 비교 표의 예시 후보. 후보 상권 기준이 정해지기 전이라 점수는 예시다.
export const ZONES = [
  { id: 'A', name: '핵심 상권', score: 74 },
  { id: 'B', name: '주변 상권', score: 81 },
  { id: 'C', name: '외곽', score: 46 },
]
