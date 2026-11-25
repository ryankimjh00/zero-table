// 보류 항목(id 또는 name) → 우선순위(1~10) 및 확정 행동 문구
const PRIORITY_ACTIONS = {
  'startup-capital': {
    priority: 1,
    text: '후보 점포의 보증금·권리금·인테리어·설비 실제 견적을 받아 비교해 보세요.',
  },
  '초기 자본': {
    priority: 1,
    text: '후보 점포의 보증금·권리금·인테리어·설비 실제 견적을 받아 비교해 보세요.',
  },

  'monthly-capital': {
    priority: 2,
    text: '후보 점포의 월 임대료·관리비·인건비·식자재 원가 예산을 구체화해 보세요.',
  },
  '월 운영자금': {
    priority: 2,
    text: '후보 점포의 월 임대료·관리비·인건비·식자재 원가 예산을 구체화해 보세요.',
  },
  '월 가용자금': {
    priority: 2,
    text: '후보 점포의 월 임대료·관리비·인건비·식자재 원가 예산을 구체화해 보세요.',
  },

  'menu-price': {
    priority: 3,
    text: '주변 경쟁 매장의 대표 메뉴 가격대와 용량·구성 시세를 조사해 보세요.',
  },
  '대표 메뉴 가격': {
    priority: 3,
    text: '주변 경쟁 매장의 대표 메뉴 가격대와 용량·구성 시세를 조사해 보세요.',
  },

  capacity: {
    priority: 4,
    text: '테이블 수와 예상 회전수를 기준으로 목표 주문량을 처리할 수 있는지 확인해 보세요.',
  },
  '매장 수용 계획': {
    priority: 4,
    text: '테이블 수와 예상 회전수를 기준으로 목표 주문량을 처리할 수 있는지 확인해 보세요.',
  },

  'customer-type': {
    priority: 5,
    text: '목표 고객이 직장인·학생·주민 중 누구인지, 해당 고객의 방문이 많은 장소와 시간대를 확인해 보세요.',
  },
  '주 고객 유형': {
    priority: 5,
    text: '목표 고객이 직장인·학생·주민 중 누구인지, 해당 고객의 방문이 많은 장소와 시간대를 확인해 보세요.',
  },
  '고객 유형': {
    priority: 5,
    text: '목표 고객이 직장인·학생·주민 중 누구인지, 해당 고객의 방문이 많은 장소와 시간대를 확인해 보세요.',
  },

  'age-group': {
    priority: 6,
    text: '목표 연령대의 고객이 실제로 방문하는지 후보 상권에서 확인해 보세요.',
  },
  '주요 고객 연령': {
    priority: 6,
    text: '목표 연령대의 고객이 실제로 방문하는지 후보 상권에서 확인해 보세요.',
  },
  연령대: {
    priority: 6,
    text: '목표 연령대의 고객이 실제로 방문하는지 후보 상권에서 확인해 보세요.',
  },

  'business-days': {
    priority: 7,
    text: '영업 예정 요일에 주변 점포의 방문과 상권 분위기를 확인해 보세요.',
  },
  '영업 요일': {
    priority: 7,
    text: '영업 예정 요일에 주변 점포의 방문과 상권 분위기를 확인해 보세요.',
  },

  'main-time': {
    priority: 8,
    text: '영업 예정 시간에 고객 이동과 주변 매장의 이용 상황을 확인해 보세요.',
  },
  '판매 시간대': {
    priority: 8,
    text: '영업 예정 시간에 고객 이동과 주변 매장의 이용 상황을 확인해 보세요.',
  },

  experience: {
    priority: 9,
    text: '부족한 운영 경험을 교육, 실무 경험 또는 협업으로 보완할 수 있는지 확인해 보세요.',
  },
  '근무·운영 경험': {
    priority: 9,
    text: '부족한 운영 경험을 교육, 실무 경험 또는 협업으로 보완할 수 있는지 확인해 보세요.',
  },
  '운영 경험': {
    priority: 9,
    text: '부족한 운영 경험을 교육, 실무 경험 또는 협업으로 보완할 수 있는지 확인해 보세요.',
  },

  participation: {
    priority: 10,
    text: '직접 운영할 수 있는 시간과 필요한 인력의 역할을 구체적으로 정해 보세요.',
  },
  '직접 운영 참여': {
    priority: 10,
    text: '직접 운영할 수 있는 시간과 필요한 인력의 역할을 구체적으로 정해 보세요.',
  },

  'visit-purpose': {
    priority: 99,
    text: '주변 유사 매장의 테이크아웃·매장 이용 비중과 주요 방문 목적을 파악해 보세요.',
  },
  '이용 상황': {
    priority: 99,
    text: '주변 유사 매장의 테이크아웃·매장 이용 비중과 주요 방문 목적을 파악해 보세요.',
  },

  'industry-sales': {
    priority: 99,
    text: '인근 동종 업종 매장의 실제 회전율과 일평균 결제 건수를 가늠해 보세요.',
  },
  추정매출: {
    priority: 99,
    text: '인근 동종 업종 매장의 실제 회전율과 일평균 결제 건수를 가늠해 보세요.',
  },

  'potential-demand': {
    priority: 99,
    text: '역세권·오피스·주거지 동선에서 매장 앞 실제 보행량을 시간대별로 확인해 보세요.',
  },
  '잠재 수요': {
    priority: 99,
    text: '역세권·오피스·주거지 동선에서 매장 앞 실제 보행량을 시간대별로 확인해 보세요.',
  },

  competition: {
    priority: 99,
    text: '반경 300m 내 경쟁 점포 수와 각 매장의 주력 메뉴·차별점을 조사해 보세요.',
  },
  '동종업종 경쟁': {
    priority: 99,
    text: '반경 300m 내 경쟁 점포 수와 각 매장의 주력 메뉴·차별점을 조사해 보세요.',
  },
}

// 우선 확인할 행동 목록과 보고서를 읽기 전 안내
export default function ReportNotice({ assessment }) {
  const allCriteria = assessment?.categories?.flatMap((c) => c.criteria ?? []) ?? []
  const unconfirmedCriteria = allCriteria.filter((item) => item.score === null)

  const mappedActions = unconfirmedCriteria.map((item) => {
    const entry = PRIORITY_ACTIONS[item.id] ?? PRIORITY_ACTIONS[item.name]
    return (
      entry ?? {
        priority: 99,
        text: `${item.name} 관련 현장 자료와 기준을 추가로 확인해 보세요.`,
      }
    )
  })

  const sortedUniqueActions = []
  const seen = new Set()
  for (const action of mappedActions.sort((a, b) => a.priority - b.priority)) {
    if (!seen.has(action.text)) {
      seen.add(action.text)
      sortedUniqueActions.push(action.text)
    }
  }

  const actions = sortedUniqueActions.slice(0, 3)

  return (
    <section className="report-section">
      <div className="panel">
        <h3>우선 확인할 행동</h3>
        <p className="muted small">점수 산출에서 보류된 항목을 중심으로 현장에서 먼저 확인하면 좋은 과제예요.</p>
        {actions.length === 0 ? (
          <p className="muted small">모든 항목이 평가에 반영되어 추가로 확인할 보류 과제가 없어요.</p>
        ) : (
          <ul className="plain-list">
            {actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="notice-box">
        <h3>이 보고서를 읽기 전에 기억하세요</h3>
        <p className="small">서울시 상권 공공데이터를 바탕으로 한 참고 자료예요. 사업 성공이나 수익을 보장하지 않아요. 후보 지역 점수·가격·비용 배분은 예시입니다.</p>
      </div>
    </section>
  )
}