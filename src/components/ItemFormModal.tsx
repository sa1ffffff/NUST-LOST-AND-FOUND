import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MatchResults from "@/components/MatchResults";

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "found" | "lost";
}

const ItemFormModal = ({ isOpen, onClose, type }: ItemFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    date: "",
    contact: "",
    description: "",
    isAnonymous: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [matches, setMatches] = useState<any[] | null>(null);
  const [showMatches, setShowMatches] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("item-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("item-images")
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Insert into appropriate table
      let itemId = null;
      if (type === "found") {
        const { data, error } = await supabase.from("found_items").insert({
          title: formData.title,
          location: formData.location,
          date_found: formData.date,
          contact: formData.isAnonymous ? null : formData.contact,
          description: formData.description,
          image_url: imageUrl,
          is_anonymous: formData.isAnonymous,
        }).select().single();
        if (error) throw error;
        itemId = data.id;
      } else {
        const { data, error } = await supabase.from("lost_items").insert({
          title: formData.title,
          location: formData.location,
          date_lost: formData.date,
          contact: formData.isAnonymous ? null : formData.contact,
          description: formData.description,
          image_url: imageUrl,
          is_anonymous: formData.isAnonymous,
        }).select().single();
        if (error) throw error;
        itemId = data.id;
      }

      toast.success(`${type === "found" ? "Found" : "Lost"} item reported successfully!`);
      
      // For lost items, trigger AI matching
      if (type === "lost" && itemId) {
        try {
          toast.info("🔍 Finding potential matches...");
          
          const { data: matchData, error: matchError } = await supabase.functions.invoke(
            "match-items",
            {
              body: { lostItemId: itemId },
            }
          );

          if (matchError) {
            console.error("Error finding matches:", matchError);
          } else if (matchData?.matches) {
            setMatches(matchData.matches);
            setShowMatches(true);
          }
        } catch (error) {
          console.error("Error calling match function:", error);
        }
      } else {
        // Reset and close for found items
        setFormData({
          title: "",
          location: "",
          date: "",
          contact: "",
          description: "",
          isAnonymous: false,
        });
        setImageFile(null);
        onClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMatches = () => {
    setShowMatches(false);
    setMatches(null);
    // Reset form
    setFormData({
      title: "",
      location: "",
      date: "",
      contact: "",
      description: "",
      isAnonymous: false,
    });
    setImageFile(null);
    onClose();
  };

  return (
    <>
      {showMatches && matches && (
        <MatchResults matches={matches} onClose={handleCloseMatches} />
      )}
      
      <Dialog open={isOpen && !showMatches} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-card/95 border border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Report: I {type === "found" ? "Found" : "Lost"} Something
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Item Name *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Blue backpack, iPhone 13"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location {type === "found" ? "Found" : "Last Seen"} *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              placeholder="e.g., Library, Cafeteria, H-12 Campus"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date {type === "found" ? "Found" : "Lost"} *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact {formData.isAnonymous ? "(Optional)" : "*"}</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              required={!formData.isAnonymous}
              disabled={formData.isAnonymous}
              placeholder="Email or phone number"
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Upload Image (Optional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Any additional details..."
              className="bg-background/50 min-h-24"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={formData.isAnonymous}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isAnonymous: checked as boolean })
              }
            />
            <Label htmlFor="anonymous" className="text-sm cursor-pointer">
              Submit anonymously
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-accent hover:bg-accent/90">
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ItemFormModal;
