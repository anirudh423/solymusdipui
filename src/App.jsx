import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import "./styles/QuoteSummary.css";
import QuoteSummary from "./pages/QuoteSummary";
import PolicyPurchase from "./pages/PolicyPurchase";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBlogs from "./pages/AdminBlogs";
import AdminHospitals from "./pages/AdminHospitals";
import AdminBranches from "./pages/AdminBranches";

function Home() {
  return (
    <main className="home-root">
      <div className="home-card">
        <h1 className="brand">Solymus</h1>
        <p className="lead">
          Insurance elevated — experience the craft of a perfectly tailored policy.
        </p>
        <div className="actions">
          <Link to="/quote-summary" className="btn-primary">
            View Quote Summary
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote-summary" element={<QuoteSummary />} />
        <Route path="/policy-purchase" element={<PolicyPurchase />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/blogs" element={<AdminBlogs />} />
        <Route path="/admin/hospitals" element={<AdminHospitals />} />
        <Route path="/admin/branches" element={<AdminBranches />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
