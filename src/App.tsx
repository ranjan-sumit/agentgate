import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Gate from './pages/Gate'
import Policies from './pages/Policies'
import RedTeam from './pages/RedTeam'
import Evaluations from './pages/Evaluations'
import Observability from './pages/Observability'
import Integrations from './pages/Integrations'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/gate" element={<Gate />} />
      <Route path="/policies" element={<Policies />} />
      <Route path="/redteam" element={<RedTeam />} />
      <Route path="/evaluations" element={<Evaluations />} />
      <Route path="/observability" element={<Observability />} />
      <Route path="/integrations" element={<Integrations />} />
    </Routes>
  )
}
