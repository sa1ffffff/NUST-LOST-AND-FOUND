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

// Compute cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate embeddings using Lovable AI
async function generateEmbedding(text: string): Promise<number[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Embedding API error:", response.status, errorText);
    throw new Error(`Failed to generate embedding: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
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

    // Create text representations for embedding
    const lostText = `${lostItem.title} ${lostItem.description || ''} ${lostItem.location}`.toLowerCase();
    console.log("Generating embedding for lost item...");
    const lostEmbedding = await generateEmbedding(lostText);

    // Calculate similarity scores for all found items
    const matches: Match[] = [];
    
    for (const foundItem of foundItems) {
      const foundText = `${foundItem.title} ${foundItem.description || ''} ${foundItem.location}`.toLowerCase();
      console.log(`Generating embedding for found item: ${foundItem.title}`);
      const foundEmbedding = await generateEmbedding(foundText);
      
      const similarity = cosineSimilarity(lostEmbedding, foundEmbedding);
      const score = Math.round(similarity * 100);
      
      matches.push({
        foundItem,
        score,
      });
    }

    // Sort by score and take top 3
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 3);

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