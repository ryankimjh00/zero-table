import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { ABOUT_PATH, START_PATH } from '../constants/routes.js'

// 모든 화면에 공통으로 들어가는 머리말과 꼬리말.
// <Outlet />자리에 주소에 맞는 화면이 들어간다.
export default function Layout() {
  const [loginNotice, setLoginNotice] = useState(false)

  return (
    <div className="app">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to={START_PATH} className="brand">
            <span className="brand-mark">Z</span>
            <strong>제로테이블</strong>
            <span className="brand-sub">ZERO TABLE</span>
          </Link>
          <nav className="site-nav">
            <NavLink to={START_PATH} end>아이디어 분석</NavLink>
            <NavLink to={ABOUT_PATH}>서비스 소개</NavLink>
            {/* 로그인은 더미: 누르면 안내만 보여 준다 */}
            <button type="button" className="link-button" onClick={() => setLoginNotice(true)}>로그인</button>
          </nav>
        </div>
        {loginNotice && (
          <div className="dummy-banner">
            프로토타입에서는 로그인이 더미예요. 로그인 없이 모든 흐름을 볼 수 있어요.
            <button type="button" className="link-button" onClick={() => setLoginNotice(false)}>닫기</button>
          </div>
        )}
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div>
          <strong>제로테이블</strong>
          <p>아이디어의 가능성부터, 나에게 맞는 자리까지.</p>
        </div>
        <p className="footer-links">서비스 이용약관 · 개인정보처리방침 · © ZERO TABLE</p>
      </footer>
    </div>
  )
}
