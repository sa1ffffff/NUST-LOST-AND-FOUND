import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface FoundItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date_found: string;
  contact: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  status: string;
  created_at: string;
}

const Admin = () => {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Access Denied",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchPendingItems();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    }
  };

  const fetchPendingItems = async () => {
    try {
      const { data, error } = await supabase
        .from("found_items")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching pending items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItemStatus = async (itemId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("found_items")
        .update({ status })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Item ${status} successfully`,
      });

      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Error updating item status:", error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  const notifyMatches = async (itemId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("notify-match", {
        body: { foundItemId: itemId },
      });

      if (error) throw error;

      toast({
        title: "Notifications Sent",
        description: `Successfully notified ${data?.notified || 0} potential matches`,
      });
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Review and approve found items</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center backdrop-blur-sm bg-card/50">
            <p className="text-muted-foreground">No pending items to review</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden backdrop-blur-sm bg-card/50 border-border/50">
                {item.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-3">{item.description}</p>
                  )}
                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-foreground">
                      <span className="font-medium">Location:</span> {item.location}
                    </p>
                    <p className="text-foreground">
                      <span className="font-medium">Found on:</span>{" "}
                      {format(new Date(item.date_found), "PPP")}
                    </p>
                    {item.contact && !item.is_anonymous && (
                      <p className="text-foreground">
                        <span className="font-medium">Contact:</span> {item.contact}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateItemStatus(item.id, "approved")}
                        className="flex-1"
                        variant="default"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => updateItemStatus(item.id, "rejected")}
                        className="flex-1"
                        variant="destructive"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                    <Button
                      onClick={async () => {
                        await updateItemStatus(item.id, "approved");
                        await notifyMatches(item.id);
                      }}
                      variant="outline"
                      className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      <Mail className="mr-2 h-4 w-4" />
                      Approve & Notify Matches
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
