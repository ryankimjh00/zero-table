import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import StartPage from './pages/StartPage.jsx'
import BasicInputPage from './pages/BasicInputPage.jsx'
import AnalyzingPage from './pages/AnalyzingPage.jsx'
import SimpleResultPage from './pages/SimpleResultPage.jsx'
import QuestionsPage from './pages/QuestionsPage.jsx'
import ResultOpenPage from './pages/ResultOpenPage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import AboutPage from './pages/AboutPage.jsx'

// 주소(URL)와 화면을 짝지어 둔 표. 화면 이동은 전부 이 표를 따른다.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<StartPage />} />
        <Route path="/input" element={<BasicInputPage />} />
        <Route path="/analyzing" element={<AnalyzingPage />} />
        <Route path="/result" element={<SimpleResultPage />} />
        <Route path="/questions/:step" element={<QuestionsPage />} />
        <Route path="/open" element={<ResultOpenPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
