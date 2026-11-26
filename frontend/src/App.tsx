import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import PublicLayout from "@/components/PublicLayout";
import Home from "@/pages/Home";
import ApplyForm from "@/pages/apply/ApplyForm";
import { useAuth } from "@/hooks/useAuth";

const isInternal = import.meta.env.VITE_APP_MODE === "internal";

const Login = isInternal ? lazy(() => import("@/pages/auth/Login")) : null;
const Dashboard = isInternal ? lazy(() => import("@/pages/hr/Dashboard")) : null;
const Jobs = isInternal ? lazy(() => import("@/pages/hr/Jobs")) : null;
const Review = isInternal ? lazy(() => import("@/pages/hr/Review")) : null;
const CvViewer = isInternal ? lazy(() => import("@/pages/hr/CvViewer")) : null;

function withSuspense(node: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center text-sm text-slate-400">
          Loading…
        </div>
      }
    >
      {node}
    </Suspense>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<ApplyForm />} />
        <Route path="/apply/:jobId" element={<ApplyForm />} />
      </Route>

      {isInternal && Login && (
        <Route element={<Layout />}>
          <Route path="/login" element={withSuspense(<Login />)} />
          {Dashboard && (
            <Route
              path="/hr"
              element={
                <ProtectedRoute>
                  {withSuspense(<Dashboard />)}
                </ProtectedRoute>
              }
            />
          )}
          {Jobs && (
            <Route
              path="/hr/jobs"
              element={
                <ProtectedRoute>
                  {withSuspense(<Jobs />)}
                </ProtectedRoute>
              }
            />
          )}
          {Review && (
            <Route
              path="/hr/review/:id"
              element={
                <ProtectedRoute>
                  {withSuspense(<Review />)}
                </ProtectedRoute>
              }
            />
          )}
          {CvViewer && (
            <Route
              path="/hr/review/:id/cv"
              element={
                <ProtectedRoute>
                  {withSuspense(<CvViewer />)}
                </ProtectedRoute>
              }
            />
          )}
        </Route>
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
