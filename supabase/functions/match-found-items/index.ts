import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LostItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date_lost: string;
  contact: string | null;
  image_url: string | null;
}

interface FoundItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
  date_found: string;
  contact: string | null;
  image_url: string | null;
}

interface Match {
  lostItem: LostItem;
  score: number;
}

// Calculate text similarity using word overlap
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  let intersection = 0;
  set1.forEach(word => {
    if (set2.has(word)) intersection++;
  });
  
  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// Calculate match score between found and lost items
function calculateMatchScore(foundItem: FoundItem, lostItem: LostItem): number {
  // Title similarity (weight: 40%)
  const titleSimilarity = calculateTextSimilarity(foundItem.title, lostItem.title);
  
  // Description similarity (weight: 30%)
  const foundDesc = foundItem.description || "";
  const lostDesc = lostItem.description || "";
  const descSimilarity = calculateTextSimilarity(foundDesc, lostDesc);
  
  // Location similarity (weight: 30%)
  const locationSimilarity = calculateTextSimilarity(foundItem.location, lostItem.location);
  
  // Weighted average
  const score = (titleSimilarity * 0.4 + descSimilarity * 0.3 + locationSimilarity * 0.3) * 100;
  
  return Math.round(score);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foundItemId } = await req.json();
    console.log("Matching found item:", foundItemId);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the found item
    const { data: foundItem, error: foundError } = await supabase
      .from("found_items")
      .select("*")
      .eq("id", foundItemId)
      .single();

    if (foundError || !foundItem) {
      throw new Error("Found item not found");
    }

    // Get all lost items
    const { data: lostItems, error: lostError } = await supabase
      .from("lost_items")
      .select("*");

    if (lostError) {
      throw lostError;
    }

    if (!lostItems || lostItems.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate similarity for all lost items
    const matches: Match[] = [];

    for (const lostItem of lostItems) {
      const score = calculateMatchScore(foundItem, lostItem);

      matches.push({
        lostItem,
        score,
      });
    }

    // Sort by score and get top 3 with score >= 30
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 3).filter(m => m.score >= 30);

    // Store matches in database
    for (const match of topMatches) {
      await supabase.from("item_matches").insert({
        found_item_id: foundItemId,
        lost_item_id: match.lostItem.id,
        match_score: match.score,
      });
    }

    console.log("Found matches:", topMatches.length);

    return new Response(
      JSON.stringify({ matches: topMatches }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in match-found-items function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
