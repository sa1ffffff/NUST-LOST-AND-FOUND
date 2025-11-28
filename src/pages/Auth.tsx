import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Hardcoded admin credentials
      const ADMIN_EMAIL = "admin@nustlostfound.com";
      const ADMIN_PASSWORD = "123456788";

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Set admin session in localStorage
        localStorage.setItem("isAdmin", "true");
        
        toast({
          title: "Success",
          description: "Logged in successfully",
        });

        navigate("/admin");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        
        <Card className="p-8 backdrop-blur-sm bg-card/50 border-border/50">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Admin Login
          </h1>
          <p className="text-muted-foreground mb-6">
            Sign in to access the admin panel
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nust.com"
                required
                className="backdrop-blur-sm bg-background/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="backdrop-blur-sm bg-background/50"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Login"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
