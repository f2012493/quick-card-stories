import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log("Fetching secure ad display data...");

    // Use the secure function to get only safe display data (no sensitive pricing info)
    const { data: adDisplayData, error } = await supabase
      .rpc('get_public_ad_display_data');

    if (error) {
      console.error("Error fetching ad display data:", error);
      throw error;
    }

    // Transform the data to include safe default values and images
    const adsWithImages = (adDisplayData || []).map((ad: any) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description || 'Sponsored content',
      imageUrl: getAdImage(ad.category),
      ctaText: ad.category === 'subscription' ? 'Subscribe' : 'Learn More',
      link: ad.category === 'subscription' ? '#subscribe' : '#',
      revenue: getDefaultRevenue(ad.category), // Use safe default values instead of real pricing
      category: ad.category
    }));

    // Add fallback ads if no active ads exist
    const finalAds = adsWithImages.length > 0 ? adsWithImages : getFallbackAds();

    console.log(`Successfully fetched ${finalAds.length} ad units for display`);

    return new Response(JSON.stringify({ ads: finalAds }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-ad-display function:", error);
    
    // Return fallback ads on error to maintain functionality
    return new Response(JSON.stringify({ ads: getFallbackAds() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

function getAdImage(category?: string): string {
  const images = {
    display: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
    premium: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=600&fit=crop",
    subscription: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop",
    general: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop"
  };
  return images[category as keyof typeof images] || images.general;
}

function getDefaultRevenue(category?: string): number {
  // Use safe default values that don't expose real business pricing
  const defaultRevenues = {
    premium: 25,
    subscription: 20,
    display: 15,
    general: 10
  };
  return defaultRevenues[category as keyof typeof defaultRevenues] || 10;
}

function getFallbackAds() {
  return [
    {
      id: 'fallback_001',
      title: "Stay Updated",
      description: "Don't miss the latest news and updates",
      imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop",
      ctaText: "Learn More",
      link: "#",
      revenue: 10,
      category: 'general'
    }
  ];
}