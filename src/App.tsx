import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthorityAuth from "./pages/AuthorityAuth";
import MapPage from "./pages/MapPage";
import Issues from "./pages/Issues";
import ReportIssue from "./pages/ReportIssue";
import IssueDetails from "./pages/IssueDetails";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotificationCenter from "./pages/NotificationCenter";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Navbar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/authority" element={<AuthorityAuth />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/issues" element={<Issues />} />
                <Route path="/report" element={<ReportIssue />} />
                <Route path="/issues/:id" element={<IssueDetails />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
