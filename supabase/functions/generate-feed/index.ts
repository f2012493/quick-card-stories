
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Calculate personalization score for a user and cluster
const calculatePersonalizationScore = async (userId: string, cluster: any): Promise<number> => {
  try {
    let personalizationScore = 0.5; // Base score

    // Get user preferences
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userProfile) {
      // Regional relevance bonus
      if (userProfile.location_country && cluster.region_tags?.includes(userProfile.location_country)) {
        personalizationScore += 0.2;
      }
      if (userProfile.location_city && cluster.region_tags?.includes(userProfile.location_city)) {
        personalizationScore += 0.15;
      }

      // Category preference
      if (userProfile.preferred_categories?.includes(cluster.category)) {
        personalizationScore += 0.15;
      }
    }

    // Get user reading history for this category
    const { data: categoryHistory } = await supabase
      .from('user_reading_history')
      .select('interaction_type, read_duration_seconds')
      .eq('user_id', userId)
      .gte('read_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(50);

    if (categoryHistory && categoryHistory.length > 0) {
      const avgEngagement = categoryHistory.reduce((sum, h) => {
        let score = 0;
        if (h.interaction_type === 'view') score += 1;
        if (h.interaction_type === 'click') score += 2;
        if (h.interaction_type === 'share') score += 3;
        if (h.interaction_type === 'like') score += 3;
        if (h.read_duration_seconds && h.read_duration_seconds > 30) score += 1;
        return sum + score;
      }, 0) / categoryHistory.length;

      personalizationScore += Math.min(0.3, avgEngagement / 10);
    }

    // Get topic preferences
    const { data: topicPrefs } = await supabase
      .from('user_topic_preferences')
      .select('topic_keyword, preference_score')
      .eq('user_id', userId);

    if (topicPrefs && topicPrefs.length > 0) {
      const titleLower = cluster.title.toLowerCase();
      const descLower = (cluster.description || '').toLowerCase();
      
      for (const pref of topicPrefs) {
        if (titleLower.includes(pref.topic_keyword.toLowerCase()) || 
            descLower.includes(pref.topic_keyword.toLowerCase())) {
          personalizationScore += (pref.preference_score - 0.5) * 0.2; // -0.1 to +0.1 based on preference
        }
      }
    }

    return Math.max(0, Math.min(1, personalizationScore));
  } catch (error) {
    console.error('Error calculating personalization score:', error);
    return 0.5; // Default score on error
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, location } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating feed for user: ${user_id}`);

    // Check for existing valid cache
    const { data: cachedFeed } = await supabase
      .from('personalized_feeds')
      .select(`
        *,
        story_clusters!inner(
          id, title, description, category, base_score,
          representative_image_url, latest_published_at
        )
      `)
      .eq('user_id', user_id)
      .gt('expires_at', new Date().toISOString())
      .order('rank_position', { ascending: true })
      .limit(20);

    if (cachedFeed && cachedFeed.length > 0) {
      console.log(`Returning cached feed with ${cachedFeed.length} items`);
      return new Response(
        JSON.stringify({ 
          feed: cachedFeed.map(item => ({
            ...item.story_clusters,
            personalized_score: item.personalized_score,
            rank_position: item.rank_position
          })),
          cached: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get top clusters from last 24 hours
    const { data: topClusters } = await supabase
      .from('story_clusters')
      .select('*')
      .eq('status', 'active')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('base_score', { ascending: false })
      .limit(50);

    if (!topClusters || topClusters.length === 0) {
      return new Response(
        JSON.stringify({ feed: [], message: 'No active clusters found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate personalized scores
    const personalizedClusters = [];
    for (const cluster of topClusters) {
      const personalizationScore = await calculatePersonalizationScore(user_id, cluster);
      const finalScore = (cluster.base_score || 0) * 0.7 + personalizationScore * 100 * 0.3;
      
      personalizedClusters.push({
        ...cluster,
        personalized_score: Math.round(finalScore * 100) / 100
      });
    }

    // Sort by personalized score
    personalizedClusters.sort((a, b) => b.personalized_score - a.personalized_score);

    // Cache the feed
    const feedEntries = personalizedClusters.slice(0, 20).map((cluster, index) => ({
      user_id,
      cluster_id: cluster.id,
      personalized_score: cluster.personalized_score,
      rank_position: index + 1,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    }));

    // Clear old cache for this user
    await supabase
      .from('personalized_feeds')
      .delete()
      .eq('user_id', user_id);

    // Insert new cache
    await supabase
      .from('personalized_feeds')
      .insert(feedEntries);

    console.log(`Generated personalized feed with ${feedEntries.length} items`);

    return new Response(
      JSON.stringify({ 
        feed: personalizedClusters.slice(0, 20),
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-feed function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
