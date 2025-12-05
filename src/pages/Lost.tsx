import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, Trash2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  status: string;
  created_at: string;
}

const Lost = () => {
  const [items, setItems] = useState<LostItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LostItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedItemForFound, setSelectedItemForFound] = useState<LostItem | null>(null);
  const [markingAsFound, setMarkingAsFound] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    setIsAdmin(adminStatus);
    fetchLostItems();

    // Set up realtime subscription
    const channel = supabase
      .channel('lost_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lost_items'
        },
        () => {
          fetchLostItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLostItems = async () => {
    try {
      const adminStatus = localStorage.getItem("isAdmin") === "true";
      let query = supabase
        .from("lost_items")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Only show approved items for non-admins
      if (!adminStatus) {
        query = query.eq("status", "approved");
      }

      const { data, error } = await query;

      if (error) throw error;
      const lostItems = (data || []).map(item => ({
        ...item,
        is_found: item.is_found || false,
        status: item.status || "approved"
      }));
      setItems(lostItems);
      setFilteredItems(lostItems);
    } catch (error) {
      console.error("Error fetching lost items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this lost item?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("lost_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      setFilteredItems(filteredItems.filter(item => item.id !== itemId));
      
      toast.success("Lost item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleMarkAsFoundClick = (item: LostItem) => {
    setSelectedItemForFound(item);
    setConfirmDialogOpen(true);
  };

  const handleConfirmFound = async () => {
    if (!selectedItemForFound) return;

    setMarkingAsFound(true);
    try {
      // Update the item as found
      const { error: updateError } = await supabase
        .from("lost_items")
        .update({ is_found: true })
        .eq("id", selectedItemForFound.id);

      if (updateError) throw updateError;

      // Send email notification if contact exists and is an email
      if (selectedItemForFound.contact && selectedItemForFound.contact.includes("@")) {
        try {
          const { error: emailError } = await supabase.functions.invoke("send-found-notification", {
            body: {
              email: selectedItemForFound.contact,
              itemName: selectedItemForFound.title,
              itemDescription: selectedItemForFound.description || ""
            }
          });

          if (emailError) {
            console.error("Email error:", emailError);
          } else {
            toast.success("Owner has been notified via email!");
          }
        } catch (emailErr) {
          console.error("Failed to send email:", emailErr);
        }
      }

      // Update local state
      const updatedItems = items.map(item => 
        item.id === selectedItemForFound.id ? { ...item, is_found: true } : item
      );
      setItems(updatedItems);
      setFilteredItems(updatedItems.filter(item => 
        !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
      ));

      toast.success("Item marked as found!");
    } catch (error) {
      console.error("Error marking item as found:", error);
      toast.error("Failed to mark item as found");
    } finally {
      setMarkingAsFound(false);
      setConfirmDialogOpen(false);
      setSelectedItemForFound(null);
    }
  };

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
          <h1 className="text-4xl font-bold text-primary mb-2">Lost Items</h1>
          <p className="text-muted-foreground">Items that have been lost by NUST community members</p>
          
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by item name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 backdrop-blur-sm bg-card/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center backdrop-blur-sm bg-card/50">
            <p className="text-muted-foreground">
              {searchQuery ? "No items match your search" : "No lost items yet. Be the first to report one!"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className={`overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${item.is_found ? 'opacity-70 border-green-500/50' : ''}`}
              >
                {item.image_url && (
                  <div className="aspect-video overflow-hidden bg-muted relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.is_found && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <span className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold">FOUND</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                      {item.is_found && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-3">{item.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground">
                      <span className="font-medium">Last seen:</span> {item.location}
                    </p>
                    <p className="text-foreground">
                      <span className="font-medium">Lost on:</span>{" "}
                      {format(new Date(item.date_lost), "PPP")}
                    </p>
                    {item.contact && !item.is_anonymous && (
                      <p className="text-foreground">
                        <span className="font-medium">Contact:</span> {item.contact}
                      </p>
                    )}
                    {item.is_anonymous && (
                      <p className="text-muted-foreground italic">Anonymous submission</p>
                    )}
                  </div>

                  {/* Mark as Found checkbox */}
                  {!item.is_found && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div 
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => handleMarkAsFoundClick(item)}
                      >
                        <Checkbox id={`found-${item.id}`} checked={false} />
                        <label 
                          htmlFor={`found-${item.id}`} 
                          className="text-sm font-medium leading-none cursor-pointer text-green-600 hover:text-green-700"
                        >
                          Mark as Found
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Item Found</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you found the right item "{selectedItemForFound?.title}"? 
              {selectedItemForFound?.contact && selectedItemForFound.contact.includes("@") && (
                <span className="block mt-2 text-green-600">
                  An email notification will be sent to the owner.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markingAsFound}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmFound}
              disabled={markingAsFound}
              className="bg-green-600 hover:bg-green-700"
            >
              {markingAsFound ? "Processing..." : "Yes, Item Found"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Lost;