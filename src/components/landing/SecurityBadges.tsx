import { Shield, Lock, FileCheck, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const SecurityBadges = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Your Health Data is Safe with Us
            </h2>
            <p className="text-lg text-muted-foreground">
              We prioritize your privacy and security with industry-leading standards
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">HIPAA Compliant</h3>
              <p className="text-sm text-muted-foreground">
                Full compliance with healthcare privacy regulations
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Encrypted Storage</h3>
              <p className="text-sm text-muted-foreground">
                End-to-end encryption for all your medical data
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <FileCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Access</h3>
              <p className="text-sm text-muted-foreground">
                Multi-factor authentication and access controls
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-border bg-card">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Server className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Servers</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade infrastructure with regular audits
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 sm:p-12 text-center border border-primary/20">
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to Take Control of Your Health?
            </h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of users who trust CareKaro to help them understand and manage their health better.
            </p>
            <Button size="lg" className="text-base gap-2">
              <Link to="/auth/signup">Get Started Free</Link>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityBadges;
