import Layout from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";

const Privacy = () => {
  return (
    <Layout showSidebar={false}>
      <SEOHead title="Privacy Policy" description="Learn how CareKaro protects your medical data with HIPAA-compliant security and encryption." path="/privacy" />
      <div className="py-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: November 12, 2025</p>
            
            <div className="prose prose-lg max-w-none space-y-8">
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-muted-foreground mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Personal information such as name, email address, and contact details</li>
                  <li>Medical reports and health-related documents you upload</li>
                  <li>Health data extracted from your reports</li>
                  <li>Account preferences and settings</li>
                  <li>Communication history with our support team</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Analyze your medical reports using AI technology</li>
                  <li>Generate health insights and recommendations</li>
                  <li>Send you notifications about your health data</li>
                  <li>Respond to your comments, questions, and support requests</li>
                  <li>Protect against fraudulent or illegal activity</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  3. Data Security
                </h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>End-to-end encryption for all data transmission</li>
                  <li>Encrypted storage for medical reports and health data</li>
                  <li>HIPAA-compliant data handling procedures</li>
                  <li>Regular security audits and updates</li>
                  <li>Restricted access to personal information on a need-to-know basis</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  4. Information Sharing
                </h2>
                <p className="text-muted-foreground">
                  We do not sell, rent, or share your personal health information with third parties except:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With service providers under strict confidentiality agreements</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  5. Your Rights
                </h2>
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your health reports and data</li>
                  <li>Opt-out of certain data processing activities</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  6. Data Retention
                </h2>
                <p className="text-muted-foreground">
                  We retain your information for as long as your account is active or as needed to provide services. 
                  You can request deletion of your data at any time through your account settings or by contacting us.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  7. Changes to This Policy
                </h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting 
                  the new policy on this page and updating the "Last updated" date.
                </p>
              </section>
              
              <section>
                <h2 className="font-heading text-2xl font-semibold text-foreground mb-4">
                  8. Contact Us
                </h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at{" "}
                  <a href="mailto:privacy@carekaro.com" className="text-primary hover:underline">
                    privacy@carekaro.com
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

export default Privacy;
