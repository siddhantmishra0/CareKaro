import Layout from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Target, Users, Shield } from "lucide-react";

const About = () => {
  return (
    <Layout showSidebar={false}>
      <SEOHead title="About Us" description="Learn about CareKaro's mission to make health reports easy to understand with AI-powered analysis." path="/about" />
      <div className="py-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-6">
              About CareKaro
            </h1>
            <p className="text-xl text-muted-foreground mb-12">
              We're on a mission to make healthcare information accessible and understandable for everyone.
            </p>
            
            <div className="prose prose-lg max-w-none mb-16">
              <p className="text-muted-foreground">
                CareKaro was founded on the belief that everyone should be able to understand their own health data. 
                Too often, medical reports are filled with complex terminology and confusing numbers, leaving patients 
                uncertain about their health status and next steps.
              </p>
              <p className="text-muted-foreground">
                Using advanced AI technology, we transform complex medical reports into clear, actionable insights. 
                Our platform helps you track your health trends over time, identify potential concerns early, and 
                connect with the right healthcare specialists when needed.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Our Mission</h3>
                  <p className="text-muted-foreground">
                    To empower individuals with clear, actionable health insights by making medical information 
                    accessible and understandable through AI technology.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Our Vision</h3>
                  <p className="text-muted-foreground">
                    A world where everyone has the knowledge and tools to take control of their health journey, 
                    supported by intelligent technology that bridges the gap between medical complexity and patient understanding.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Our Team</h3>
                  <p className="text-muted-foreground">
                    We're a dedicated team of healthcare professionals, AI engineers, and patient advocates 
                    working together to revolutionize health data accessibility.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-border">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Our Commitment</h3>
                  <p className="text-muted-foreground">
                    Your privacy and data security are our top priorities. We maintain HIPAA compliance and 
                    use industry-leading encryption to protect your sensitive health information.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
