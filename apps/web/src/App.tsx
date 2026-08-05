import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tracks from "./pages/Tracks";
import Marketplace from "./pages/Marketplace";
import Podcast from "./pages/Podcast";
import Rights from "./pages/Rights";
import Plans from "./pages/Plans";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
          LOADING
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tracks" element={<Tracks />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="podcast" element={<Podcast />} />
        <Route path="rights" element={<Rights />} />
        <Route path="plans" element={<Plans />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
