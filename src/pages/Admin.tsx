import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface LostItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date_lost: string;
  contact: string | null;
  image_url: string | null;
  is_anonymous: boolean;
  is_found: boolean;
  created_at: string;
}

const Admin = () => {
  const [pendingItems, setPendingItems] = useState<FoundItem[]>([]);
  const [approvedFoundItems, setApprovedFoundItems] = useState<FoundItem[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Set up realtime subscriptions
    const foundChannel = supabase
      .channel('admin_found_items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'found_items' },
        () => fetchAllItems()
      )
      .subscribe();

    const lostChannel = supabase
      .channel('admin_lost_items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lost_items' },
        () => fetchAllItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(foundChannel);
      supabase.removeChannel(lostChannel);
    };
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const isAdminSession = localStorage.getItem("isAdmin") === "true";
      
      if (!isAdminSession) {
        toast({
          title: "Access Denied",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setIsAdmin(true);
      fetchAllItems();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/auth");
    }
  };

  const fetchAllItems = async () => {
    setLoading(true);
    try {
      // Fetch pending found items
      const { data: pending, error: pendingError } = await supabase
        .from("found_items")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;
      setPendingItems(pending || []);

      // Fetch approved found items
      const { data: approved, error: approvedError } = await supabase
        .from("found_items")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (approvedError) throw approvedError;
      setApprovedFoundItems(approved || []);

      // Fetch all lost items
      const { data: lost, error: lostError } = await supabase
        .from("lost_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (lostError) throw lostError;
      setLostItems((lost || []).map(item => ({ ...item, is_found: item.is_found || false })));

    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to fetch items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFoundItemStatus = async (itemId: string, status: "approved" | "rejected") => {
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

      // Update local state
      const item = pendingItems.find(i => i.id === itemId);
      setPendingItems(pendingItems.filter(i => i.id !== itemId));
      if (status === "approved" && item) {
        setApprovedFoundItems([{ ...item, status: "approved" }, ...approvedFoundItems]);
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    }
  };

  const deleteFoundItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("found_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({ title: "Success", description: "Item deleted successfully" });
      setApprovedFoundItems(approvedFoundItems.filter(i => i.id !== itemId));
      setPendingItems(pendingItems.filter(i => i.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const deleteLostItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("lost_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({ title: "Success", description: "Item deleted successfully" });
      setLostItems(lostItems.filter(i => i.id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  if (!isAdmin) {
    return null;
  }

  const renderFoundItemCard = (item: FoundItem, showActions: "pending" | "approved") => (
    <Card key={item.id} className="overflow-hidden backdrop-blur-sm bg-card/50 border-border/50">
      {item.image_url && (
        <div className="aspect-video overflow-hidden bg-muted">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
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
            <span className="font-medium">Found on:</span> {format(new Date(item.date_found), "PPP")}
          </p>
          {item.contact && !item.is_anonymous && (
            <p className="text-foreground">
              <span className="font-medium">Contact:</span> {item.contact}
            </p>
          )}
        </div>
        
        {showActions === "pending" ? (
          <div className="flex gap-2">
            <Button
              onClick={() => updateFoundItemStatus(item.id, "approved")}
              className="flex-1"
              variant="default"
            >
              <Check className="mr-2 h-4 w-4" /> Approve
            </Button>
            <Button
              onClick={() => updateFoundItemStatus(item.id, "rejected")}
              className="flex-1"
              variant="destructive"
            >
              <X className="mr-2 h-4 w-4" /> Reject
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => deleteFoundItem(item.id)}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        )}
      </div>
    </Card>
  );

  const renderLostItemCard = (item: LostItem) => (
    <Card 
      key={item.id} 
      className={`overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 ${item.is_found ? 'border-green-500/50' : ''}`}
    >
      {item.image_url && (
        <div className="aspect-video overflow-hidden bg-muted relative">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          {item.is_found && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <span className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold">FOUND</span>
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
          {item.is_found && (
            <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded">Found</span>
          )}
        </div>
        {item.description && (
          <p className="text-muted-foreground mb-4 line-clamp-3">{item.description}</p>
        )}
        <div className="space-y-2 text-sm mb-4">
          <p className="text-foreground">
            <span className="font-medium">Location:</span> {item.location}
          </p>
          <p className="text-foreground">
            <span className="font-medium">Lost on:</span> {format(new Date(item.date_lost), "PPP")}
          </p>
          {item.contact && !item.is_anonymous && (
            <p className="text-foreground">
              <span className="font-medium">Contact:</span> {item.contact}
            </p>
          )}
        </div>
        
        <Button
          onClick={() => deleteLostItem(item.id)}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage found and lost items</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="pending" className="relative">
                Pending Requests
                {pendingItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingItems.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="found">Found Items ({approvedFoundItems.length})</TabsTrigger>
              <TabsTrigger value="lost">Lost Items ({lostItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingItems.length === 0 ? (
                <Card className="p-12 text-center backdrop-blur-sm bg-card/50">
                  <p className="text-muted-foreground">No pending items to review</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingItems.map((item) => renderFoundItemCard(item, "pending"))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="found">
              {approvedFoundItems.length === 0 ? (
                <Card className="p-12 text-center backdrop-blur-sm bg-card/50">
                  <p className="text-muted-foreground">No approved found items</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedFoundItems.map((item) => renderFoundItemCard(item, "approved"))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="lost">
              {lostItems.length === 0 ? (
                <Card className="p-12 text-center backdrop-blur-sm bg-card/50">
                  <p className="text-muted-foreground">No lost items</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lostItems.map((item) => renderLostItemCard(item))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Admin;