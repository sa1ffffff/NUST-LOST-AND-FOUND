import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import ItemFormModal from "@/components/ItemFormModal";

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

const Found = () => {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoundItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    fetchFoundItems();

    // Set up realtime subscription
    const channel = supabase
      .channel('found_items_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'found_items'
        },
        () => {
          fetchFoundItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFoundItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("found_items")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
      setFilteredItems(data || []);
    } catch (error) {
      console.error("Error fetching found items:", error);
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
    setFilteredItems(
      items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, items]);

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
          <h1 className="text-4xl font-bold text-primary mb-2">Found Items</h1>
          <p className="text-muted-foreground">Items found by the NUST community</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 backdrop-blur-sm bg-card/50"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <Plus className="h-4 w-4" /> Report Found Item
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center backdrop-blur-sm bg-card/50">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No items match your search"
                : "No found items yet. Be the first to report one!"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden backdrop-blur-sm bg-card/50 border-border/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              >
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
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {item.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm">
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
                    {item.is_anonymous && (
                      <p className="text-muted-foreground italic">Anonymous submission</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ItemFormModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        type="found"
      />
    </div>
  );
};

export default Found;