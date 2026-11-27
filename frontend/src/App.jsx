import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import StartPage from './pages/StartPage.jsx'
import BasicInputPage from './pages/BasicInputPage.jsx'
import AnalyzingPage from './pages/AnalyzingPage.jsx'
import SimpleResultPage from './pages/SimpleResultPage.jsx'
import QuestionsPage from './pages/QuestionsPage.jsx'
import ResultOpenPage from './pages/ResultOpenPage.jsx'
import ReportPage from './pages/report/ReportPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import {
  ABOUT_PATH, ANALYZING_PATH, INPUT_PATH, QUESTIONS_PATH, REPORT_PATH, RESULT_OPEN_PATH,
  SIMPLE_RESULT_PATH, START_PATH,
} from './constants/routes.js'

// 주소(URL)와 화면을 짝지어 둔 표. 화면 이동은 전부 이 표를 따른다.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={START_PATH} element={<StartPage />} />
        <Route path={INPUT_PATH} element={<BasicInputPage />} />
        <Route path={ANALYZING_PATH} element={<AnalyzingPage />} />
        <Route path={SIMPLE_RESULT_PATH} element={<SimpleResultPage />} />
        <Route path={QUESTIONS_PATH} element={<QuestionsPage />} />
        <Route path={RESULT_OPEN_PATH} element={<ResultOpenPage />} />
        <Route path={REPORT_PATH} element={<ReportPage />} />
        <Route path={ABOUT_PATH} element={<AboutPage />} />
        <Route path="*" element={<Navigate to={START_PATH} replace />} />
      </Route>
    </Routes>
  )
}
