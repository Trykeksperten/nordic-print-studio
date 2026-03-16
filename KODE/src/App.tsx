import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Index from "./pages/Index";
import Storformatprint from "./pages/Storformatprint";
import PrintDesign from "./pages/PrintDesign";
import Produkter from "./pages/Produkter";
import DesignUpload from "./pages/DesignUpload";
import TextileProductSetup from "./pages/TextileProductSetup";
import Kurv from "./pages/Kurv";
import Kontakt from "./pages/Kontakt";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tekstiltryk" element={<Navigate to="/tekstiltryk/produkter" replace />} />
            <Route path="/storformatprint" element={<Storformatprint />} />
            <Route path="/print/design" element={<PrintDesign />} />
            <Route path="/tekstiltryk/produkter" element={<Produkter />} />
            <Route path="/produkter" element={<Navigate to="/tekstiltryk/produkter" replace />} />
            <Route path="/tekstiltryk/setup/:productId" element={<TextileProductSetup />} />
            <Route path="/tekstiltryk/design" element={<DesignUpload />} />
            <Route path="/kurv" element={<Kurv />} />
            <Route path="/design" element={<Navigate to="/tekstiltryk/design" replace />} />
            <Route path="/kontakt" element={<Kontakt />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
