// 시작 화면: 간단 분석과 상세 분석 중 하나를 고른다.
import { Link } from 'react-router-dom'
import { DETAIL_MODE, inputPath, SIMPLE_MODE } from '../constants/routes.js'

const MODES = [
  {
    mode: SIMPLE_MODE,
    eyebrow: '간단 상권 분석',
    title: '가볍게 아이디어 점검하기',
    description: ['생각한 음식과 동네가 잘 맞을지 궁금한가요?', '기본 정보부터 넣고 상권을 살펴보세요.'],
    inputs: ['음식 · 지역 · 판매 방식'],
    result: '기본 정보를 바탕으로 한 간단 상권 결과',
    noticeTitle: '무료 · 광고 없음',
    notice: '광고 시청 없이 무료로 간단 결과를 확인해요.',
    button: '간단 분석 시작하기',
  },
  {
    mode: DETAIL_MODE,
    eyebrow: '개인 조건별 상세 분석',
    title: '내 조건으로 창업 가능성 살펴보기',
    description: ['구체적으로 창업을 준비하고 있나요?', '고객부터 운영 준비까지, 내 상황에 맞춰 살펴보세요.'],
    inputs: ['기본 정보 + 5개 영역', '목표 고객 · 판매 시간 · 업종 수요 · 점포 조건 · 운영 준비도'],
    result: '내 조건을 반영한 종합 적합도와 영역별 상세 결과',
    noticeTitle: '광고 크레딧으로 상세 결과 확인',
    notice: '질문 완료 후 광고로 크레딧을 받아 이번 상세 결과와 보고서를 함께 열 수 있어요.',
    button: '상세 분석 시작하기',
  },
]

export default function StartPage() {
  return (
    <div className="page">
      <p className="eyebrow">아이디어에서 창업의 첫걸음까지</p>
      <h1 className="display">어디서부터 시작해볼까요?</h1>
      <p className="lead">가볍게 아이디어를 점검하거나, 내 조건에 맞는 창업 가능성을 살펴보세요.</p>

      <div className="mode-cards">
        {MODES.map((m) => (
          <section key={m.mode} className="mode-card">
            <p className="mode-eyebrow">{m.eyebrow}</p>
            <h2>{m.title}</h2>
            <p className="muted">{m.description[0]}<br />{m.description[1]}</p>
            <hr />
            <dl>
              <dt>입력할 내용</dt>
              {m.inputs.map((text) => <dd key={text}>{text}</dd>)}
              <dt>받을 결과</dt>
              <dd>{m.result}</dd>
            </dl>
            <div className="mode-notice">
              <strong>{m.noticeTitle}</strong>
              <p>{m.notice}</p>
            </div>
            <Link className="btn primary block" to={inputPath(m.mode)}>{m.button} →</Link>
          </section>
        ))}
      </div>

      <p className="info-strip">→ 간단 결과를 본 뒤에도 입력한 기본 정보를 그대로 이어서 상세 분석을 시작할 수 있어요.</p>
    </div>
  )
}
