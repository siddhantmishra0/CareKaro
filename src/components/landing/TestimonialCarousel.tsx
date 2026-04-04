import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Managing Chronic Condition",
    avatar: "/placeholder.svg",
    initials: "SJ",
    rating: 5,
    content: "CareKaro has been a game-changer for managing my diabetes. The trend tracking helps me see patterns I never noticed before, and the AI explanations make my lab results actually understandable."
  },
  {
    name: "Michael Chen",
    role: "Health-Conscious Professional",
    avatar: "/placeholder.svg",
    initials: "MC",
    rating: 5,
    content: "I love how quickly I can upload my annual health checkup reports and get a comprehensive analysis. The specialist recommendations are spot-on and have saved me time finding the right doctors."
  },
  {
    name: "Emily Rodriguez",
    role: "Caring for Elderly Parent",
    avatar: "/placeholder.svg",
    initials: "ER",
    rating: 5,
    content: "As a caregiver for my elderly mother, CareKaro helps me stay on top of her multiple health reports. The red flag alerts have caught important issues early, and the clear summaries help me communicate better with her doctors."
  }
];

const TestimonialCarousel = () => {
  return (
    <section className="py-20 bg-secondary/20">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted by Thousands of Users
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how CareKaro is helping people take control of their health
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-muted-foreground">{testimonial.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
