import Layout from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";

const Terms = () => {
  return (
    <Layout showSidebar={false}>
      <SEOHead title="Terms of Service" description="Read CareKaro's terms of service covering usage, data handling, and medical disclaimer." path="/terms" />
      <div className="py-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: November 12, 2025</p>
            
            <div className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground">
                  By accessing and using CareKaro, you accept and agree to be bound by the terms and provisions 
                  of this agreement. If you do not agree to these terms, please do not use our service.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  2. Description of Service
                </h2>
                <p className="text-muted-foreground">
                  CareKaro provides AI-powered medical report analysis and health tracking services. Our platform 
                  helps users understand their medical reports through automated analysis and insights. CareKaro 
                  is not a substitute for professional medical advice, diagnosis, or treatment.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  3. Medical Disclaimer
                </h2>
                <p className="text-muted-foreground mb-4">
                  IMPORTANT: CareKaro provides information and insights based on AI analysis of medical reports. 
                  However:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Our service does not provide medical advice, diagnosis, or treatment</li>
                  <li>AI-generated insights should not replace consultation with healthcare professionals</li>
                  <li>Always seek the advice of your physician or qualified health provider</li>
                  <li>Never disregard professional medical advice based on information from CareKaro</li>
                  <li>In case of emergency, call emergency services immediately</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  4. User Responsibilities
                </h2>
                <p className="text-muted-foreground mb-4">As a user, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Use the service only for lawful purposes</li>
                  <li>Not share your account with others</li>
                  <li>Upload only your own medical reports or those you're authorized to access</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  5. Privacy and Data Protection
                </h2>
                <p className="text-muted-foreground">
                  Your use of CareKaro is subject to our Privacy Policy, which describes how we collect, use, 
                  and protect your personal health information. We maintain HIPAA compliance and use industry-standard 
                  security measures to protect your data.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-muted-foreground">
                  All content, features, and functionality of CareKaro are owned by us and are protected by 
                  international copyright, trademark, and other intellectual property laws. You retain ownership 
                  of your medical reports and health data.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  7. Limitation of Liability
                </h2>
                <p className="text-muted-foreground">
                  CareKaro and its affiliates shall not be liable for any indirect, incidental, special, consequential, 
                  or punitive damages resulting from your use of or inability to use the service. We do not guarantee 
                  the accuracy, completeness, or reliability of AI-generated insights.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  8. Subscription and Payment
                </h2>
                <p className="text-muted-foreground">
                  Some features require a paid subscription. By subscribing, you agree to pay all applicable fees. 
                  Subscriptions automatically renew unless cancelled before the renewal date. Refunds are provided 
                  according to our refund policy.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  9. Termination
                </h2>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your access to CareKaro at any time for violation 
                  of these terms or for any other reason. You may terminate your account at any time through your 
                  account settings.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  10. Changes to Terms
                </h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. We will notify users of any material 
                  changes. Your continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  11. Contact Information
                </h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us at{" "}
                  <a href="mailto:legal@carekaro.com" className="text-primary hover:underline">
                    legal@carekaro.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
