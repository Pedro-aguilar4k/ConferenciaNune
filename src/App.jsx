import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";

// Code splitting: cada pagina vira um chunk carregado sob demanda,
// reduzindo o tamanho do bundle inicial e acelerando o primeiro load.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const NfeImport = lazy(() => import("@/pages/NfeImport"));
const Conference = lazy(() => import("@/pages/Conference"));
const Products = lazy(() => import("@/pages/Products"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Equivalences = lazy(() => import("@/pages/Equivalences"));
const RecognitionCenter = lazy(() => import("@/pages/RecognitionCenter"));
const ProductBinding = lazy(() => import("@/pages/ProductBinding"));
const ConferenceReport = lazy(() => import("@/pages/ConferenceReport"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-[#71717A] text-sm">
      Carregando...
    </div>
  );
}

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/notas" element={<NfeImport />} />
              <Route path="/conferencia" element={<Conference />} />
              <Route path="/conferencia/:notaId" element={<Conference />} />
              <Route path="/vinculacao/:notaId" element={<ProductBinding />} />
              <Route path="/relatorio/:notaId" element={<ConferenceReport />} />
              <Route path="/reconhecimento" element={<RecognitionCenter />} />
              <Route path="/produtos" element={<Products />} />
              <Route path="/fornecedores" element={<Suppliers />} />
              <Route path="/equivalencias" element={<Equivalences />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}

export default App;
