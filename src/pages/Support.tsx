import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, MessageCircle, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const faqs = [
  {
    question: "How long does account delivery take?",
    answer: "Account details are delivered instantly after payment confirmation. You'll receive an email with login credentials and instructions within minutes.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and cryptocurrency payments. All transactions are secured with bank-level encryption.",
  },
  {
    question: "What if the account doesn't match the description?",
    answer: "We offer a 100% money-back guarantee. If the account doesn't match the listing description, contact support within 24 hours for a full refund.",
  },
  {
    question: "Can I sell multiple accounts?",
    answer: "Yes! You can list as many accounts as you want. There are no listing limits or monthly fees for sellers.",
  },
  {
    question: "How are sellers verified?",
    answer: "All sellers go through a verification process including ID verification and transaction history review. We only work with trusted sellers.",
  },
  {
    question: "What happens if I get banned?",
    answer: "We cannot be held responsible for bans after account transfer. However, we recommend changing passwords and email immediately to secure the account.",
  },
  {
    question: "How do I change account details after purchase?",
    answer: "You'll receive instructions on how to change the email and password after purchase. We recommend doing this immediately to secure your new account.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Refunds are available within 24 hours if the account doesn't match the description. After that, all sales are final due to the digital nature of the product.",
  },
];

const Support = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent!", {
      description: "Our support team will get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Support Center</h1>
          <p className="text-muted-foreground text-lg">
            We're here to help you 24/7
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-card border-border hover:border-primary transition-all">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary/10 rounded-full p-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                support@codaccounts.com
              </p>
              <p className="text-xs text-muted-foreground">
                Response within 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary transition-all">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary/10 rounded-full p-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Chat with our team
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.info("Live chat opening soon...")}
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-primary transition-all">
            <CardContent className="pt-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-primary/10 rounded-full p-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">24/7 Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Always available
              </p>
              <p className="text-xs text-muted-foreground">
                Every day, all year
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FAQ Section */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-lg px-6"
                >
                  <AccordionTrigger className="hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe your issue or question..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
