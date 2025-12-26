import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";

// Pages
import CustomerMenu from "./pages/CustomerMenu";
import Login from "./pages/dashboard/Login";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Orders from "./pages/dashboard/Orders";
import MenuManagement from "./pages/dashboard/MenuManagement";
import QRCodes from "./pages/dashboard/QRCodes";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Navigate to="/menu" replace />} />
            <Route path="/menu" element={<CustomerMenu />} />
            
            {/* Auth Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout><Overview /></DashboardLayout>} />
            <Route path="/dashboard/orders" element={<DashboardLayout><Orders /></DashboardLayout>} />
            <Route path="/dashboard/menu" element={<DashboardLayout><MenuManagement /></DashboardLayout>} />
            <Route path="/dashboard/qr-codes" element={<DashboardLayout><QRCodes /></DashboardLayout>} />
            <Route path="/dashboard/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
