// 앱 시작점: 화면 전체를 주소 이동과 공용 답변 보관함으로 감싸 그린다.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AnswersProvider from './state/AnswersProvider.jsx'

// BrowserRouter: 주소에 따라 화면을 바꿔 준다.
// AnswersProvider: 모든 화면이 같은 답변을 공유하게 감싼다.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AnswersProvider>
        <App />
      </AnswersProvider>
    </BrowserRouter>
  </StrictMode>,
)
