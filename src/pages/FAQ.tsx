import Layout from "@/components/layout/Layout";
import { SEOHead } from "@/components/SEOHead";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does CareKaro analyze my medical reports?",
    answer: "CareKaro uses advanced AI technology powered by GPT-4o to analyze your medical reports. Our system can read various types of medical documents including blood tests, ECGs, X-rays, and MRI scans. It extracts key information, identifies important health indicators, and presents them in easy-to-understand language."
  },
  {
    question: "Is my health data secure and private?",
    answer: "Yes, absolutely. We take your privacy very seriously. All data is encrypted end-to-end, and we maintain HIPAA compliance. Your medical reports are stored securely and are only accessible to you. We never share your health data with third parties without your explicit consent."
  },
  {
    question: "What types of medical reports can I upload?",
    answer: "You can upload various types of medical reports including blood test results, ECG readings, X-ray images, MRI scans, CT scans, pathology reports, and other diagnostic documents. We support multiple file formats including PDF, JPEG, PNG, and DICOM."
  },
  {
    question: "How accurate is the AI analysis?",
    answer: "Our AI is trained on extensive medical data and provides highly accurate interpretations. However, it's important to note that CareKaro is designed to help you understand your reports better, not to replace professional medical advice. Always consult with your healthcare provider for diagnosis and treatment decisions."
  },
  {
    question: "Can I share my reports with my doctor?",
    answer: "Yes! CareKaro makes it easy to share your reports and AI-generated summaries with your healthcare providers. You can export reports as PDFs or share them directly through secure links."
  },
  {
    question: "How does the health trend tracking work?",
    answer: "As you upload more reports over time, CareKaro automatically tracks changes in your health metrics and creates visual charts showing trends. This helps you and your doctor see how your health parameters are changing over weeks, months, or years."
  },
  {
    question: "What are 'red flags' and how are they detected?",
    answer: "Red flags are health indicators that fall outside normal ranges or suggest potential health concerns requiring medical attention. Our AI automatically identifies these and highlights them in your report analysis, helping you know when to follow up with a healthcare professional."
  },
  {
    question: "How do specialist recommendations work?",
    answer: "Based on your report findings, our AI suggests appropriate medical specialists you might want to consult. For example, if your blood work shows thyroid irregularities, we might recommend seeing an endocrinologist. These are suggestions to help guide your healthcare journey."
  },
  {
    question: "Can I use CareKaro for my family members?",
    answer: "Yes! With our Family plan, you can manage health reports for up to 5 family members, making it easier to track everyone's health in one place."
  },
  {
    question: "What if I need help using the platform?",
    answer: "We offer comprehensive support through email, phone, and live chat. Our support team is available to help you with any questions about using CareKaro or understanding your reports."
  }
];

const FAQ = () => {
  return (
    <Layout showSidebar={false}>
      <SEOHead title="FAQ" description="Frequently asked questions about CareKaro's AI health report analysis, privacy, and features." path="/faq" />
      <div className="py-20">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-muted-foreground">
                Find answers to common questions about CareKaro
              </p>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border rounded-lg px-6 bg-card"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="mt-16 text-center p-8 bg-secondary/20 rounded-lg border border-border">
              <h3 className="font-heading text-2xl font-semibold text-foreground mb-4">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-6">
                Can't find the answer you're looking for? Please reach out to our support team.
              </p>
              <a href="/contact" className="text-primary hover:underline font-semibold">
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
