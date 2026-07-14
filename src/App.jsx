import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import { AuthProvider, PERM } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Code splitting: cada pagina vira um chunk carregado sob demanda,
// reduzindo o tamanho do bundle inicial e acelerando o primeiro load.
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

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-[#71717A] text-sm">
      Carregando...
    </div>
  );
}

// Envolve uma pagina protegida no Layout, exigindo login (e permissao opcional).
function Protected({ children, permission }) {
  return (
    <ProtectedRoute permission={permission}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <div className="App dark">
      <AuthProvider>
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
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}

export default App;
