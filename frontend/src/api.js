// 백엔드와 주고받는 함수 모음. 화면 파일은 여기 함수만 부른다.

// 서버 주소: frontend/.env에 VITE_API_BASE_URL을 적으면 그 주소(예: 로컬 백엔드), 없으면 운영 서버
const PRODUCTION_API_BASE_URL = 'https://webframework.monithub.org/api/v1'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || PRODUCTION_API_BASE_URL

// 시안 기준 분기. 사용자에게 묻지 않고 고정한다.
export const QUARTER = '20262'

const CONNECTION_ERROR = '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'

async function request(path, options) {
  // 연결 실패나 JSON이 아닌 응답은 브라우저 영어 메시지 대신 같은 안내 문구로 바꾼다
  let response
  let data
  try {
    response = await fetch(BASE_URL + path, options)
    data = await response.json()
  } catch {
    throw new Error(CONNECTION_ERROR)
  }
  if (!response.ok) throw new Error(data.message || '서버 요청에 실패했어요.')
  return data
}

// 저장된 데이터 조회. 결과가 없으면 null을 돌려준다.
async function firstRecord(dataset, params) {
  const query = new URLSearchParams({ size: '1', quarter: QUARTER, ...params })
  const page = await request(`/datasets/${dataset}/records?${query}`)
  return page.items[0] ?? null
}

// 상권 1,650개는 자주 바뀌지 않으니 한 번만 받아 두고 재사용한다.
let districtsPromise = null
export function loadDistricts() {
  if (!districtsPromise) {
    districtsPromise = Promise.all([1, 2].map((page) =>
      request(`/datasets/seoul_commercial_districts/records?size=1000&page=${page}`),
    ))
      .then((pages) => pages.flatMap((p) => p.items).map((d) => ({
        code: d.TRDAR_CD,
        name: d.TRDAR_CD_NM,
        type: d.TRDAR_SE_CD_NM,
        gu: d.SIGNGU_CD_NM,
        dong: d.ADSTRD_CD_NM,
        x: Number(d.XCNTS_VALUE) || 0,
        y: Number(d.YDNTS_VALUE) || 0,
      })))
      .catch((error) => {
        districtsPromise = null // 실패하면 다음에 다시 시도할 수 있게 비운다
        throw error
      })
  }
  return districtsPromise
}

export function assess(body) {
  return request('/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// 간단 결과와 보고서에 쓰는 상권 자료 4종.
// dataset: 서버 자료 이름, withIndustry: 업종으로도 거르는지, toFacts: 화면에서 쓰는 값으로 바꾸는 방법
const FACT_SOURCES = {
  sales: {
    dataset: 'seoul_estimated_sales',
    withIndustry: true,
    toFacts: (record) => ({
      timeSlots: record ? hourlySalesIndex(record) : null,
      ageSlots: record ? ageSalesIndex(record) : null,
      daySlots: record ? daySalesIndex(record) : null,
      quarterSales: record?.THSMON_SELNG_AMT ?? null,
    }),
  },
  pedestrians: {
    dataset: 'seoul_pedestrian_population',
    withIndustry: false,
    toFacts: (record) => ({ pedestrians: record?.TOT_FLPOP_CO ?? null }),
  },
  residents: {
    dataset: 'seoul_resident_population',
    withIndustry: false,
    toFacts: (record) => ({ residents: record?.TOT_REPOP_CO ?? null }),
  },
  stores: {
    dataset: 'seoul_stores',
    withIndustry: true,
    toFacts: (record) => ({
      sameIndustryStores: record?.SIMILR_INDUTY_STOR_CO ?? null,
      franchiseStores: record?.FRC_STOR_CO ?? null,
      openRate: record?.OPBIZ_RT ?? null,
      closeRate: record?.CLSBIZ_RT ?? null,
    }),
  },
}

// 안내 문구에 쓰는 자료 이름
export const FACT_SOURCE_LABELS = { sales: '매출', pedestrians: '유동인구', residents: '상주인구', stores: '점포' }

// 자료 4종을 따로 받는다. 하나가 실패해도 나머지는 쓰고, 실패한 자료 이름은 failedSources에 남긴다.
// "자료가 원래 없음"(값 null)과 "불러오다 실패"(failedSources)를 화면에서 구분하기 위해서다.
export async function loadDistrictFacts(districtCode, industryCode, sourceNames = Object.keys(FACT_SOURCES)) {
  const outcomes = await Promise.allSettled(sourceNames.map((name) => {
    const { dataset, withIndustry } = FACT_SOURCES[name]
    return firstRecord(dataset, withIndustry ? { districtCode, industryCode } : { districtCode })
  }))

  const facts = { failedSources: [] }
  outcomes.forEach((outcome, i) => {
    const name = sourceNames[i]
    const succeeded = outcome.status === 'fulfilled'
    Object.assign(facts, FACT_SOURCES[name].toFacts(succeeded ? outcome.value : null))
    if (!succeeded) facts.failedSources.push(name)
  })
  return facts
}

// 실패했던 자료만 다시 받아 기존 값에 덮어쓴다. 또 실패한 자료는 failedSources에 그대로 남는다.
export async function retryFailedFacts(facts, districtCode, industryCode) {
  const retried = await loadDistrictFacts(districtCode, industryCode, facts.failedSources ?? [])
  return { ...facts, ...retried }
}

// 화면에서 "이 자료를 불러오다 실패했는지" 물을 때 쓴다. 예전에 저장된 결과에는 failedSources가 없다.
export function isFactFailed(facts, sourceName) {
  return facts?.failedSources?.includes(sourceName) ?? false
}

// 기준 상권 주변의 가까운 비교 상권 목록과 데이터 조회 (반경 2km 내외, 최대 3곳)
export async function loadNearbyDistrictsComparison(targetDistrictCode, industryCode) {
  const allDistricts = await loadDistricts()
  const target = allDistricts.find((d) => d.code === targetDistrictCode)
  if (!target || !target.x || !target.y) return []

  // 거리(미터) 계산 후 가까운 순으로 정렬 (기준 상권 본인 제외)
  const nearbyCandidates = allDistricts
    .filter((d) => d.code !== targetDistrictCode && d.x && d.y)
    .map((d) => {
      const distance = Math.round(Math.hypot(d.x - target.x, d.y - target.y))
      return { ...d, distance }
    })
    .sort((a, b) => a.distance - b.distance)

  // 반경 2000m 이내 우선 선택, 부족하면 가장 가까운 3곳 선택
  const within2km = nearbyCandidates.filter((d) => d.distance <= 2000)
  const selected = (within2km.length >= 3 ? within2km : nearbyCandidates).slice(0, 3)

  // 선택된 상권들의 공공데이터 병렬 조회
  const comparisonResults = await Promise.all(
    selected.map(async (district) => {
      const facts = await loadDistrictFacts(district.code, industryCode)
      return {
        district,
        facts,
      }
    })
  )

  return comparisonResults
}

// 시간대마다 길이가 달라(오전 5시간, 점심 3시간 …) 시간당 매출로 바꾼 뒤
// 가장 높은 시간대를 100으로 맞춘다. 백엔드 점수 계산과 같은 기준이다.
function hourlySalesIndex(sales) {
  const slots = [
    { label: '오전', value: sales.TMZON_06_11_SELNG_AMT / 5 },
    { label: '점심', value: sales.TMZON_11_14_SELNG_AMT / 3 },
    { label: '오후', value: sales.TMZON_14_17_SELNG_AMT / 3 },
    { label: '저녁', value: sales.TMZON_17_21_SELNG_AMT / 4 },
    { label: '심야', value: (sales.TMZON_21_24_SELNG_AMT + sales.TMZON_00_06_SELNG_AMT) / 9 },
  ]
  const max = Math.max(...slots.map((s) => s.value))
  if (!max) return null
  return slots.map((s) => ({ label: s.label, index: Math.round((s.value / max) * 100) }))
}

// 연령대별 매출 지수 (50대와 60대 이상은 합산). 가장 높은 연령대를 100으로 맞춘다.
function ageSalesIndex(sales) {
  const slots = [
    { key: 'TEENS', label: '10대', value: sales.AGRDE_10_SELNG_AMT ?? 0 },
    { key: 'TWENTIES', label: '20대', value: sales.AGRDE_20_SELNG_AMT ?? 0 },
    { key: 'THIRTIES', label: '30대', value: sales.AGRDE_30_SELNG_AMT ?? 0 },
    { key: 'FORTIES', label: '40대', value: sales.AGRDE_40_SELNG_AMT ?? 0 },
    { key: 'FIFTY_PLUS', label: '50대 이상', value: (sales.AGRDE_50_SELNG_AMT ?? 0) + (sales.AGRDE_60_ABOVE_SELNG_AMT ?? 0) },
  ]
  const max = Math.max(...slots.map((s) => s.value))
  if (!max) return null
  return slots.map((s) => ({ key: s.key, label: s.label, index: Math.round((s.value / max) * 100) }))
}

// 요일별 매출 지수 (월~일). 가장 높은 요일을 100으로 맞춘다.
function daySalesIndex(sales) {
  const slots = [
    { key: 'MON', label: '월', isWeekend: false, value: sales.MON_SELNG_AMT ?? 0 },
    { key: 'TUE', label: '화', isWeekend: false, value: sales.TUES_SELNG_AMT ?? 0 },
    { key: 'WED', label: '수', isWeekend: false, value: sales.WED_SELNG_AMT ?? 0 },
    { key: 'THU', label: '목', isWeekend: false, value: sales.THUR_SELNG_AMT ?? 0 },
    { key: 'FRI', label: '금', isWeekend: false, value: sales.FRI_SELNG_AMT ?? 0 },
    { key: 'SAT', label: '토', isWeekend: true, value: sales.SAT_SELNG_AMT ?? 0 },
    { key: 'SUN', label: '일', isWeekend: true, value: sales.SUN_SELNG_AMT ?? 0 },
  ]
  const max = Math.max(...slots.map((s) => s.value))
  if (!max) return null
  return slots.map((s) => ({ key: s.key, label: s.label, isWeekend: s.isWeekend, index: Math.round((s.value / max) * 100) }))
}
