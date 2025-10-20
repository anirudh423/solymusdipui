import { Link, BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import './styles/QuoteSummary.css'
import QuoteSummary from './pages/QuoteSummary'

function Home() {
  return (
    <main className="home-root">
      <div className="home-card">
        <h1 className="brand">Solymus</h1>
        <p className="lead">Insurance elevated — experience the craft of a perfectly tailored policy.</p>
        <div className="actions">
          <Link to="/quote-summary" className="btn-primary">View Quote Summary</Link>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote-summary" element={<QuoteSummary />} />
      </Routes>
    </BrowserRouter>
  )
}
