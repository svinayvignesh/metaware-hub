import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { MDConnectionProvider } from "@/contexts/MDConnectionContext";
import StartHere from "./pages/StartHere";
import Dashboard from "./pages/Dashboard";
import PrepareFiles from "./pages/PrepareFiles";
import NameSpace from "./pages/metadata/NameSpace";
import SubjectArea from "./pages/metadata/SubjectArea";
import Entity from "./pages/metadata/Entity";
import Meta from "./pages/metadata/Meta";
import Staging from "./pages/Staging";
import Model from "./pages/Model";
import BuildModels from "./pages/BuildModels";
import Glossary from "./pages/Glossary";
import Admin from "./pages/Admin";
import DuckDBDemo from "./pages/DuckDBDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MDConnectionProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<StartHere />} />
              <Route path="/start-here" element={<StartHere />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/prepare-files" element={<PrepareFiles />} />
              <Route path="/metadata/namespace" element={<NameSpace />} />
              <Route path="/metadata/subject-area" element={<SubjectArea />} />
              <Route path="/metadata/entity" element={<Entity />} />
              <Route path="/metadata/meta" element={<Meta />} />
              <Route path="/staging" element={<Staging />} />
              <Route path="/model" element={<Model />} />
              <Route path="/build-models" element={<BuildModels />} />
              <Route path="/glossary" element={<Glossary />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/duckdb-demo" element={<DuckDBDemo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </MDConnectionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
