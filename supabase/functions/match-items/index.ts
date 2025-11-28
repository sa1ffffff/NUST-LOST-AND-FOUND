import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LostItem {
  id: string;
  title: string;
  description: string | null;
  location: string;
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
  foundItem: FoundItem;
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

// Calculate match score between lost and found items
function calculateMatchScore(lostItem: LostItem, foundItem: FoundItem): number {
  // Title similarity (weight: 40%)
  const titleSimilarity = calculateTextSimilarity(lostItem.title, foundItem.title);
  
  // Description similarity (weight: 30%)
  const lostDesc = lostItem.description || "";
  const foundDesc = foundItem.description || "";
  const descSimilarity = calculateTextSimilarity(lostDesc, foundDesc);
  
  // Location similarity (weight: 30%)
  const locationSimilarity = calculateTextSimilarity(lostItem.location, foundItem.location);
  
  // Weighted average
  const score = (titleSimilarity * 0.4 + descSimilarity * 0.3 + locationSimilarity * 0.3) * 100;
  
  return Math.round(score);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lostItemId } = await req.json();
    
    if (!lostItemId) {
      return new Response(
        JSON.stringify({ error: "Lost item ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Matching lost item:", lostItemId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the lost item
    const { data: lostItem, error: lostError } = await supabase
      .from("lost_items")
      .select("*")
      .eq("id", lostItemId)
      .single();

    if (lostError || !lostItem) {
      console.error("Error fetching lost item:", lostError);
      return new Response(
        JSON.stringify({ error: "Lost item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all found items
    const { data: foundItems, error: foundError } = await supabase
      .from("found_items")
      .select("*");

    if (foundError || !foundItems || foundItems.length === 0) {
      console.log("No found items to match against");
      return new Response(
        JSON.stringify({ matches: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate similarity scores for all found items
    const matches: Match[] = [];
    
    for (const foundItem of foundItems) {
      const score = calculateMatchScore(lostItem, foundItem);
      
      matches.push({
        foundItem,
        score,
      });
    }

    // Sort by score and take top 3 with score >= 30
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 3).filter(m => m.score >= 30);

    console.log("Top matches:", topMatches.map(m => ({ title: m.foundItem.title, score: m.score })));

    // Store matches in database
    for (const match of topMatches) {
      await supabase.from("item_matches").insert({
        lost_item_id: lostItemId,
        found_item_id: match.foundItem.id,
        match_score: match.score,
      });
    }

    return new Response(
      JSON.stringify({ matches: topMatches }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in match-items function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
