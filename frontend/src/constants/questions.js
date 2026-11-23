// 추가 질문 14개를 3단계로 나눈 데이터.
// 화면은 이 데이터를 읽어서 그리기만 하므로, 질문을 바꿀 때는 이 파일만 고치면 된다.
// choice: 버튼 선택형, number: 숫자 입력형(fields가 2개면 한 줄에 칸 2개)
// multiplier: 화면 단위를 서버 단위로 바꾸는 값 (만 원 → 원은 10000)

const UNDECIDED = { value: 'UNDECIDED', label: '미정' }

export const QUESTION_STEPS = [
  {
    title: '어떤 고객에게, 언제 팔까요?',
    description: '고객과 판매 시간을 먼저 정리해요. 아직 정하지 않은 항목은 ‘미정’을 선택해도 괜찮아요.',
    section: '고객과 판매 시간',
    questions: [
      {
        type: 'choice', key: 'customerType', title: '주요 고객은 누구인가요?',
        options: [
          { value: 'WORKER', label: '직장인' }, { value: 'STUDENT', label: '학생' },
          { value: 'RESIDENT', label: '지역 주민' }, { value: 'TOURIST', label: '관광객' }, UNDECIDED,
        ],
      },
      {
        type: 'choice', key: 'ageGroup', title: '주요 고객의 연령대는 어떻게 되나요?',
        options: [
          { value: 'TEENS', label: '10대' }, { value: 'TWENTIES', label: '20대' },
          { value: 'THIRTIES', label: '30대' }, { value: 'FORTIES', label: '40대' },
          { value: 'FIFTY_PLUS', label: '50대 이상' }, UNDECIDED,
        ],
      },
      {
        type: 'choice', key: 'visitPurpose', title: '손님이 어떤 상황에서 매장을 이용할 것으로 생각하나요?',
        options: [
          { value: 'PASSING_BY', label: '지나가다 구매' }, { value: 'WORK_SCHOOL', label: '직장·학교 근처 이용' },
          { value: 'REGULAR_LOCAL', label: '동네 단골' }, { value: 'DESTINATION', label: '목적 방문' }, UNDECIDED,
        ],
      },
      {
        type: 'choice', key: 'businessDays', title: '주로 어느 요일에 영업할 계획인가요?',
        options: [
          { value: 'WEEKDAYS', label: '평일' }, { value: 'WEEKENDS', label: '주말' },
          { value: 'ALL', label: '모두' }, UNDECIDED,
        ],
      },
      {
        type: 'choice', key: 'mainTime', title: '가장 중요한 판매 시간대는 언제인가요?',
        options: [
          { value: 'MORNING', label: '오전' }, { value: 'LUNCH', label: '점심' },
          { value: 'AFTERNOON', label: '오후' }, { value: 'DINNER', label: '저녁' },
          { value: 'LATE_NIGHT', label: '심야' }, UNDECIDED,
        ],
      },
    ],
  },
  {
    title: '매출과 매장은 어떻게 계획하나요?',
    description: '목표 매출과 매장 조건을 알려주세요. 금액과 규모는 예상한 값으로 입력해도 괜찮아요.',
    section: '매출 목표와 매장 조건',
    questions: [
      {
        type: 'number', title: '목표로 하는 월 매출은 얼마인가요?',
        fields: [{ key: 'targetMonthlySales', unit: '만 원 / 월', multiplier: 10000, integer: true }],
      },
      {
        type: 'number', title: '대표 메뉴의 예상 판매 가격은 얼마인가요?',
        fields: [{ key: 'menuPrice', unit: '원', integer: true }],
      },
      {
        type: 'number', title: '예상하는 매장 규모는 어느 정도인가요?',
        fields: [{ key: 'areaPyeong', unit: '평' }, { key: 'seatCount', unit: '좌석', integer: true }],
      },
      {
        type: 'number', title: '한 번에 몇 팀을 받을 수 있나요?',
        fields: [{ key: 'tableCount', unit: '테이블', integer: true }],
      },
      {
        type: 'number', title: '하루에 테이블이 몇 번 정도 회전할 것으로 예상하나요?',
        fields: [{ key: 'dailyTurns', unit: '회전 / 일' }],
      },
    ],
  },
  {
    title: '자금과 운영 준비는 되어 있나요?',
    description: '마지막 4개 질문이에요. 준비한 자금과 운영 계획을 확인하면 상세 분석을 볼 수 있어요.',
    section: '자금과 운영 준비',
    questions: [
      {
        type: 'number', title: '초기 창업에 사용할 수 있는 자본금은 얼마인가요?',
        fields: [{ key: 'startupCapital', unit: '만 원', multiplier: 10000, integer: true }],
      },
      {
        type: 'number', title: '매월 매장 운영에 사용할 수 있는 자금은 얼마인가요?',
        hint: '월 운영 자금은 임대료만이 아니라 인건비·재료비 등 운영에 쓸 수 있는 전체 자금이에요.',
        fields: [{ key: 'monthlyCapital', unit: '만 원 / 월', multiplier: 10000, integer: true }],
      },
      {
        type: 'choice', key: 'experience', title: '외식업에서 일하거나 매장을 운영한 경험이 있나요?',
        options: [
          { value: 'NONE', label: '경험 없음' }, { value: 'EMPLOYEE', label: '직원 경험' },
          { value: 'MANAGER', label: '관리 경험' }, { value: 'OWNER', label: '운영 경험' },
        ],
      },
      {
        type: 'choice', key: 'participation', title: '직접 매장 운영에 어느 정도 참여할 계획인가요?',
        options: [
          { value: 'FULL_TIME', label: '전업' }, { value: 'THREE_FOUR_DAYS', label: '주 3~4일' },
          { value: 'WEEKENDS', label: '주말' }, UNDECIDED,
        ],
      },
    ],
  },
]

// 모든 숫자 입력칸 정보 (서버 형식으로 바꿀 때 쓴다)
export const NUMBER_FIELDS = QUESTION_STEPS
  .flatMap((step) => step.questions)
  .filter((q) => q.type === 'number')
  .flatMap((q) => q.fields)

// 처음 화면에 채워 둘 값. 시안 예시와 같게 해서 바로 흐름을 시험할 수 있게 한다.
// 숫자는 화면 단위(만 원 등) 그대로이고, null은 '미정'이다.
export const DEFAULT_ANSWERS = {
  customerType: 'WORKER',
  ageGroup: 'THIRTIES',
  visitPurpose: 'WORK_SCHOOL',
  businessDays: 'WEEKDAYS',
  mainTime: 'LUNCH',
  targetMonthlySales: '2000',
  menuPrice: '12000',
  areaPyeong: '10',
  seatCount: '15',
  tableCount: '5',
  dailyTurns: '3',
  startupCapital: '5000',
  monthlyCapital: '300',
  experience: 'EMPLOYEE',
  participation: 'FULL_TIME',
}
