// 이 화면 조각이 실제 데이터인지 더미인지 표시하는 작은 딱지.
// 아직 서버와 연결되지 않은 기능이 섞여 있어, 무엇이 실제 자료인지 헷갈리지 않게 한다.
export function RealBadge() {
  return <span className="src-badge real">실제 API</span>
}

export function DummyBadge({ children = '더미' }) {
  return <span className="src-badge dummy">{children}</span>
}

export function TempBadge() {
  return <span className="src-badge temp">임시</span>
}
