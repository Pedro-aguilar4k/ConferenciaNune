import "@/App.css";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import { useQueryClient } from "@tanstack/react-query";
import { AuthProvider, PERM, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useTheme } from "@/contexts/ThemeContext";
import { prefetchCoreData } from "@/lib/queries";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NfeImport = lazy(() => import("@/pages/NfeImport"));
const Conference = lazy(() => import("@/pages/Conference"));
const Products = lazy(() => import("@/pages/Products"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Equivalences = lazy(() => import("@/pages/Equivalences"));
const RecognitionCenter = lazy(() => import("@/pages/RecognitionCenter"));
const ProductBinding = lazy(() => import("@/pages/ProductBinding"));
const ConferenceReport = lazy(() => import("@/pages/ConferenceReport"));
const Users = lazy(() => import("@/pages/Users"));

function RoutePreloader() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthenticated) return;
    // Aquece os dados do dashboard imediatamente após o login.
    prefetchCoreData(queryClient);
    const timer = setTimeout(() => {
      import("@/pages/NfeImport");
      import("@/pages/Conference");
      import("@/pages/Products");
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, queryClient]);
  return null;
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-[#71717A] text-sm">
      Carregando...
    </div>
  );
}

function Protected({ children, permission }) {
  return (
    <ProtectedRoute permission={permission}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  const { resolvedTheme } = useTheme();
  return (
    <div className="App">
      <AuthProvider>
        <RoutePreloader />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/notas" element={<Protected><NfeImport /></Protected>} />
              <Route path="/conferencia" element={<Protected permission={PERM.CONFERIR}><Conference /></Protected>} />
              <Route path="/conferencia/:notaId" element={<Protected permission={PERM.CONFERIR}><Conference /></Protected>} />
              <Route path="/vinculacao/:notaId" element={<Protected permission={PERM.CADASTROS}><ProductBinding /></Protected>} />
              <Route path="/relatorio/:notaId" element={<Protected permission={PERM.RELATORIOS}><ConferenceReport /></Protected>} />
              <Route path="/reconhecimento" element={<Protected permission={PERM.CADASTROS}><RecognitionCenter /></Protected>} />
              <Route path="/produtos" element={<Protected><Products /></Protected>} />
              <Route path="/fornecedores" element={<Protected><Suppliers /></Protected>} />
              <Route path="/equivalencias" element={<Protected><Equivalences /></Protected>} />
              <Route path="/usuarios" element={<Protected permission={PERM.USUARIOS}><Users /></Protected>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
      <Toaster theme={resolvedTheme} position="top-right" richColors />
    </div>
  );
}

export default App;
