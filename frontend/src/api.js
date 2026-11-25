// 백엔드(운영 서버)와 주고받는 함수 모음. 화면 파일은 여기 함수만 부른다.
const BASE_URL = 'https://webframework.monithub.org/api/v1'

// 시안 기준 분기. 사용자에게 묻지 않고 고정한다.
export const QUARTER = '20262'

async function request(path, options) {
  const response = await fetch(BASE_URL + path, options)
  const data = await response.json()
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

// 간단 결과와 보고서에 쓰는 상권 자료 묶음
export async function loadDistrictFacts(districtCode, industryCode) {
  const [sales, pedestrians, residents, stores] = await Promise.all([
    firstRecord('seoul_estimated_sales', { districtCode, industryCode }),
    firstRecord('seoul_pedestrian_population', { districtCode }),
    firstRecord('seoul_resident_population', { districtCode }),
    firstRecord('seoul_stores', { districtCode, industryCode }),
  ])
  return {
    timeSlots: sales ? hourlySalesIndex(sales) : null,
    ageSlots: sales ? ageSalesIndex(sales) : null,
    daySlots: sales ? daySalesIndex(sales) : null,
    quarterSales: sales?.THSMON_SELNG_AMT ?? null,
    pedestrians: pedestrians?.TOT_FLPOP_CO ?? null,
    residents: residents?.TOT_REPOP_CO ?? null,
    sameIndustryStores: stores?.SIMILR_INDUTY_STOR_CO ?? null,
  }
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
