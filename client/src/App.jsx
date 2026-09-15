import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { ToastViewport } from "./components/ui";
import { ADMIN_STORAGE_KEY, STORAGE_KEY } from "./config/appConfig";
import AdminAuthPage from "./pages/AdminAuthPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import PublicMenuPage from "./pages/PublicMenuPage";
import { clearSession, persistSession, readStoredSession } from "./utils/session";

function App() {
  const [session, setSession] = useState(() => ({
    token: "",
    owner: null,
    ...readStoredSession(STORAGE_KEY),
  }));
  const [adminSession, setAdminSession] = useState(() => ({
    token: "",
    admin: null,
    ...readStoredSession(ADMIN_STORAGE_KEY),
  }));
  const [toasts, setToasts] = useState([]);
  const location = useLocation();
  const isPublicMenuRoute = location.pathname.startsWith("/menu/");
  const isAdminRoute = location.pathname.startsWith("/admin");

  function showToast(message, tone = "success") {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  function handleAuthSuccess(payload) {
    const nextSession = {
      token: payload.token,
      owner: payload.owner,
    };

    setSession(nextSession);
    persistSession(STORAGE_KEY, nextSession);
  }

  function handleLogout() {
    clearSession(STORAGE_KEY);
    setSession({ token: "", owner: null });
  }

  function handleAdminAuthSuccess(payload) {
    const nextSession = {
      token: payload.token,
      admin: payload.admin,
    };

    setAdminSession(nextSession);
    persistSession(ADMIN_STORAGE_KEY, nextSession);
  }

  function handleAdminLogout() {
    clearSession(ADMIN_STORAGE_KEY);
    setAdminSession({ token: "", admin: null });
  }

  return (
    <>
      {!isPublicMenuRoute ? (
        <Navbar
          owner={session.owner}
          admin={adminSession.admin}
          isAuthenticated={Boolean(session.token)}
          isAdminRoute={isAdminRoute}
        />
      ) : null}
      <ToastViewport toasts={toasts} />
      <Routes>
        <Route
          path="/"
          element={
            session.token ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} onToast={showToast} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            session.token ? (
              <DashboardPage
                session={session}
                onAuthRefresh={handleAuthSuccess}
                onLogout={handleLogout}
                onToast={showToast}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            adminSession.token ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminAuthPage
                onAuthSuccess={handleAdminAuthSuccess}
                onToast={showToast}
              />
            )
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            adminSession.token ? (
              <AdminDashboardPage
                session={adminSession}
                onLogout={handleAdminLogout}
                onToast={showToast}
              />
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />
        <Route path="/menu/:slug" element={<PublicMenuPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
