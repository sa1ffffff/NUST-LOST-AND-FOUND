import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

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

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate embedding: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
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

    // Generate embedding for found item
    const foundText = `${foundItem.title} ${foundItem.description || ""} ${foundItem.location}`;
    const foundEmbedding = await generateEmbedding(foundText);

    // Generate embeddings for all lost items and calculate similarity
    const matches: Match[] = [];

    for (const lostItem of lostItems) {
      const lostText = `${lostItem.title} ${lostItem.description || ""} ${lostItem.location}`;
      const lostEmbedding = await generateEmbedding(lostText);
      
      const similarity = cosineSimilarity(foundEmbedding, lostEmbedding);
      const score = Math.round(similarity * 100);

      matches.push({
        lostItem,
        score,
      });
    }

    // Sort by score and get top 3
    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, 3).filter(m => m.score >= 60);

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
