import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: "" });
  const [signUpData, setSignUpData] = useState({ 
    name: "", 
    email: ""
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInData.email })
      });

      const json = await res.json();
      setLoading(false);

      if (json.error) {
        toast({
          title: "Sign in failed",
          description: json.error,
          variant: "destructive",
        });
        return;
      }

      if (json.token) {
        localStorage.setItem('auth_token', json.token);
        toast({
          title: "Welcome back!",
          description: "Redirecting to dashboard...",
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Sign in failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signUpData.email, name: signUpData.name })
      });

      const json = await res.json();
      setLoading(false);

      if (json.error) {
        toast({
          title: "Sign up failed",
          description: json.error,
          variant: "destructive",
        });
        return;
      }

      if (json.token) {
        localStorage.setItem('auth_token', json.token);
        toast({
          title: "Account created!",
          description: "Redirecting to complete your profile...",
        });
        navigate('/onboarding');
      }
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Sign up failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleVerificationComplete = () => {
    toast({
      title: "Email verified!",
      description: "Redirecting to complete your profile...",
    });
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="max-w-md mx-auto">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={signInData.email}
                        onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={loading}
                      >
                        <img 
                          src="https://www.google.com/favicon.ico" 
                          alt="Google" 
                          className="w-5 h-5 mr-2"
                        />
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOAuthSignIn('apple')}
                        disabled={loading}
                      >
                        <img 
                          src="https://www.apple.com/favicon.ico" 
                          alt="Apple" 
                          className="w-5 h-5 mr-2"
                        />
                        Apple
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join thousands of gamers on our platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        placeholder="John Doe"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({...signUpData, name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                        required
                      />
                    </div>

                    <div className="text-xs text-muted-foreground">
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
