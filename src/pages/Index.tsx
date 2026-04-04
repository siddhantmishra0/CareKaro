import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/landing/HeroSection";
import FeatureGrid from "@/components/landing/FeatureGrid";
import TestimonialCarousel from "@/components/landing/TestimonialCarousel";
import SecurityBadges from "@/components/landing/SecurityBadges";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <Layout showSidebar={false}>
      <SEOHead title="AI-Powered Health Report Analysis" description="Upload medical reports and get instant AI-powered analysis, health insights, trend tracking, and specialist recommendations." path="/" />
      <HeroSection />
      <FeatureGrid />
      <TestimonialCarousel />
      <SecurityBadges />
    </Layout>
  );
};

export default Index;
