import { Link } from 'react-router-dom'
import { DummyBadge } from '../components/Badges.jsx'

// 서비스 소개 (더미). 시안에 화면이 없어 프로토타입 안내로 대신한다.
export default function AboutPage() {
  return (
    <div className="page narrow">
      <h1 className="title">서비스 소개 <DummyBadge /></h1>
      <p className="lead">이 화면은 시안에 없어 프로토타입 안내로 대신해요.</p>
      <div className="panel">
        <h3>이 프로토타입에서 진짜인 것</h3>
        <ul className="plain-list">
          <li>동네 검색: 서울시 상권 목록 API</li>
          <li>상세 점수: 창업 설문 평가 API (POST /api/v1/assessments)</li>
          <li>유동인구·상주인구·점포 수·시간대 매출: 상권 데이터 조회 API</li>
        </ul>
        <h3>더미인 것</h3>
        <ul className="plain-list">
          <li>로그인, 아이디어 저장, 광고 크레딧, 보고서 다운로드</li>
          <li>추천 동네, 지도, 가격 비교, 자본 배분</li>
        </ul>
      </div>
      <Link className="btn primary" to="/">분석 시작하기</Link>
    </div>
  )
}
