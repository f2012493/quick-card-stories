
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

interface VideoGenerationRequest {
  articleId: string;
  title: string;
  content: string;
  imageUrl?: string;
}

const generateSubtitleData = (text: string) => {
  // Simple word-by-word timing simulation
  const words = text.split(' ');
  const avgWordsPerMinute = 180;
  const secondsPerWord = 60 / avgWordsPerMinute;
  
  return {
    words: words.map((word, index) => ({
      text: word,
      start: index * secondsPerWord,
      end: (index + 1) * secondsPerWord
    })),
    duration: words.length * secondsPerWord
  };
};

const generateBackgroundMusic = async (mood: string) => {
  // Placeholder for background music generation
  // In production, this would call a music generation API
  const musicTracks = {
    'serious': 'https://example.com/serious-news-bg.mp3',
    'upbeat': 'https://example.com/upbeat-news-bg.mp3',
    'calm': 'https://example.com/calm-news-bg.mp3'
  };
  
  return musicTracks[mood as keyof typeof musicTracks] || musicTracks.calm;
};

const generateAudioNarration = async (text: string): Promise<string> => {
  // Placeholder for TTS generation
  // In production, this would call OpenAI TTS or ElevenLabs API
  console.log('Generating audio narration for text length:', text.length);
  
  // Return placeholder audio URL
  return 'https://example.com/generated-audio.mp3';
};

const createVideoFromImages = async (imageUrl: string, duration: number): Promise<string> => {
  // Placeholder for video creation from images
  // In production, this would use FFmpeg or similar
  console.log('Creating video from image:', imageUrl, 'duration:', duration);
  
  // Return placeholder video URL
  return 'https://example.com/generated-video.mp4';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { articleId, title, content, imageUrl }: VideoGenerationRequest = await req.json();
    
    console.log('Generating video content for article:', articleId);

    // Check if video content already exists
    const { data: existing } = await supabase
      .from('video_content')
      .select('id')
      .eq('article_id', articleId)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Video content already exists', videoId: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark article as video processing started
    await supabase
      .from('articles')
      .update({ 
        video_processing_started_at: new Date().toISOString(),
        video_generated: false 
      })
      .eq('id', articleId);

    // Create initial video content record
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_content')
      .insert({
        article_id: articleId,
        processing_status: 'processing'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Generate subtitle timing data
    const subtitleData = generateSubtitleData(content);
    
    // Generate audio narration (placeholder)
    const audioUrl = await generateAudioNarration(content);
    
    // Generate background music
    const backgroundMusicUrl = await generateBackgroundMusic('calm');
    
    // Create video from images (placeholder)
    const videoUrl = imageUrl ? await createVideoFromImages(imageUrl, subtitleData.duration) : null;

    // Update video content with generated assets
    const { error: updateError } = await supabase
      .from('video_content')
      .update({
        video_url: videoUrl,
        audio_url: audioUrl,
        background_music_url: backgroundMusicUrl,
        subtitle_data: subtitleData,
        video_duration_seconds: Math.ceil(subtitleData.duration),
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', videoRecord.id);

    if (updateError) {
      throw updateError;
    }

    // Mark article as video generated
    await supabase
      .from('articles')
      .update({ video_generated: true })
      .eq('id', articleId);

    console.log('Video content generated successfully for article:', articleId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoId: videoRecord.id,
        videoUrl,
        audioUrl,
        duration: subtitleData.duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating video content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
