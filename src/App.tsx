import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, createRoutesFromChildren, matchRoutes, useNavigationType } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PatientRoute } from "@/components/auth/PatientRoute";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { DoctorRoute } from "@/components/auth/DoctorRoute";
import { PageTransition } from "@/components/layout/PageTransition";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";
import PasswordReset from "./pages/auth/PasswordReset";
import EmailVerification from "./pages/auth/EmailVerification";
import CompleteProfile from "./pages/auth/CompleteProfile";
import FeatureDiscovery from "./pages/auth/FeatureDiscovery";
import Dashboard from "./pages/Dashboard";
import ReportUpload from "./pages/ReportUpload";
import ReportAnalysis from "./pages/ReportAnalysis";
import ReportHistory from "./pages/ReportHistory";
import HealthTrends from "./pages/HealthTrends";
import HealthTools from "./pages/HealthTools";
import Recommendations from "./pages/Recommendations";
import ProfileSettings from "./pages/ProfileSettings";
import SharedReport from "./pages/SharedReport";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import FamilyDashboard from "./pages/family/FamilyDashboard";
import AddFamilyMember from "./pages/family/AddFamilyMember";
import JoinFamily from "./pages/family/JoinFamily";
import FamilyPreferences from "./pages/family/FamilyPreferences";
// Doctor pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import SendReport from "./pages/doctor/SendReport";
import DoctorReportsInbox from "./pages/doctor/DoctorReportsInbox";

// Sentry React Router integration for route-level performance tracking
Sentry.init({
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
  ],
});

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <SentryRoutes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
        <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
        <Route path="/auth/signup" element={<PageTransition><SignUp /></PageTransition>} />
        <Route path="/auth/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/auth/reset-password" element={<PageTransition><PasswordReset /></PageTransition>} />
        <Route path="/auth/email-verification" element={<PageTransition><EmailVerification /></PageTransition>} />
        <Route path="/auth/complete-profile" element={<ProtectedRoute><PageTransition><CompleteProfile /></PageTransition></ProtectedRoute>} />
        <Route path="/auth/feature-discovery" element={<ProtectedRoute><PageTransition><FeatureDiscovery /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PatientRoute><PageTransition><Dashboard /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><PatientRoute><PageTransition><ReportUpload /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/analysis/:reportId" element={<ProtectedRoute><PatientRoute><PageTransition><ReportAnalysis /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><PatientRoute><PageTransition><ReportHistory /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/trends" element={<ProtectedRoute><PatientRoute><PageTransition><HealthTrends /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/health-tools" element={<ProtectedRoute><PatientRoute><PageTransition><HealthTools /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><PatientRoute><PageTransition><Recommendations /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfileSettings /></PageTransition></ProtectedRoute>} />
        {/* Admin route */}
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><PageTransition><Admin /></PageTransition></AdminRoute></ProtectedRoute>} />
        {/* Family routes */}
        <Route path="/family" element={<ProtectedRoute><PatientRoute><PageTransition><FamilyDashboard /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/family/add" element={<ProtectedRoute><PatientRoute><PageTransition><AddFamilyMember /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/family/join" element={<ProtectedRoute><PatientRoute><PageTransition><JoinFamily /></PageTransition></PatientRoute></ProtectedRoute>} />
        <Route path="/family/preferences" element={<ProtectedRoute><PatientRoute><PageTransition><FamilyPreferences /></PageTransition></PatientRoute></ProtectedRoute>} />
        {/* Doctor routes */}
        <Route path="/doctor" element={<ProtectedRoute><PageTransition><DoctorDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/doctor/send-report" element={<ProtectedRoute><DoctorRoute requireVerified><PageTransition><SendReport /></PageTransition></DoctorRoute></ProtectedRoute>} />
        {/* Patient doctor reports inbox */}
        <Route path="/doctor-reports" element={<ProtectedRoute><PatientRoute><PageTransition><DoctorReportsInbox /></PageTransition></PatientRoute></ProtectedRoute>} />
        {/* Public shared report route */}
        <Route path="/shared/:token" element={<PageTransition><SharedReport /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </SentryRoutes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
