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
import AdminInsurers from "./pages/AdminInsurers";
import AdminClaims from "./pages/AdminClaims";
import AdminLeads from "./pages/AdminLeads";
import AdminQuotePricing from "./pages/AdminQuotePricing";
import AdminChatbot from "./pages/AdminChatbot";
import AdminSettings from "./pages/AdminSettings";
import AdminLogout from "./pages/AdminLogout";
import LandingPage from "./pages/LandingPage";
import FullQuoteCalculator from "./pages/FullQuoteCalculator";
import HospitalsPage from "./pages/HospitalsPage";
import HospitalDetailsPage from "./pages/HospitalDetailsPage";

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/quote-summary" element={<QuoteSummary />} />
        <Route path="/policy-purchase" element={<PolicyPurchase />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/blogs" element={<AdminBlogs />} />
        <Route path="/admin/hospitals" element={<AdminHospitals />} />
        <Route path="/admin/branches" element={<AdminBranches />} />
        <Route path="/admin/insurers" element={<AdminInsurers />} />
        <Route path="/admin/claims" element={<AdminClaims />} />
        <Route path="/admin/leads" element={<AdminLeads />} />
        <Route path="/admin/quote-pricing" element={<AdminQuotePricing />} />
        <Route path="/admin/chatbot" element={<AdminChatbot />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/logout" element={<AdminLogout />} />
        <Route path="/quote" element={<FullQuoteCalculator />} />
        <Route path="/hospitals" element={<HospitalsPage />} />
        <Route path="/hospitals/:id" element={<HospitalDetailsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
