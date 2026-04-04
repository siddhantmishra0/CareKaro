import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TrendingUp, Bell, UserCheck, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "Multi-Format Report Upload",
    description: "Upload blood tests, ECGs, X-rays, MRI scans, and more. Our AI understands various medical document formats."
  },
  {
    icon: TrendingUp,
    title: "Health Trend Tracking",
    description: "Visualize your health metrics over time with interactive charts and AI-powered trend analysis."
  },
  {
    icon: Bell,
    title: "Red Flag Detection",
    description: "Get immediate alerts for critical health concerns that require attention from medical professionals."
  },
  {
    icon: UserCheck,
    title: "Specialist Recommendations",
    description: "Receive AI-driven suggestions for appropriate medical specialists based on your report findings."
  },
  {
    icon: Shield,
    title: "HIPAA Compliant Security",
    description: "Your medical data is protected with end-to-end encryption and secure, compliant storage."
  },
  {
    icon: Clock,
    title: "Instant Analysis",
    description: "Get comprehensive health summaries and insights within minutes of uploading your reports."
  }
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const FeatureGrid = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Manage Your Health
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you understand and track your health data effectively
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={item}>
              <Card className="h-full border-border transition-all duration-300 hover:shadow-medical hover:scale-[1.02]">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGrid;
