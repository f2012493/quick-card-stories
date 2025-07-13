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

// Extract entities from content for image search
const extractEntities = (text: string) => {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
  
  // Extract potential keywords (capitalized words, longer words)
  const entities = words.filter(word => 
    word.length > 4 && 
    !stopWords.includes(word) &&
    (word[0] === word[0].toUpperCase() || word.length > 6)
  ).slice(0, 3);
  
  return entities;
};

// Get images from Unsplash API (free tier: 50 requests/hour)
const getImagesFromUnsplash = async (query: string) => {
  try {
    const unsplashKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!unsplashKey) {
      console.log('No Unsplash key, using fallback images');
      return getFallbackImages(query);
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${unsplashKey}`
        }
      }
    );

    if (!response.ok) {
      console.log('Unsplash API error, using fallback');
      return getFallbackImages(query);
    }

    const data = await response.json();
    return data.results?.map((img: any) => ({
      url: img.urls.regular,
      description: img.alt_description || img.description || query,
      credit: `Photo by ${img.user.name} on Unsplash`
    })) || getFallbackImages(query);
    
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return getFallbackImages(query);
  }
};

// Fallback images using Lorem Picsum (free)
const getFallbackImages = (query: string) => {
  const imageIds = [1018, 1019, 1020, 1021, 1022];
  return imageIds.map(id => ({
    url: `https://picsum.photos/800/600?random=${id}`,
    description: `Stock image related to ${query}`,
    credit: 'Lorem Picsum'
  }));
};

// Generate TTS using free services (Web Speech API simulation)
const generateAudioNarration = async (text: string): Promise<{ audioUrl: string; duration: number; wordTimings: any[] }> => {
  try {
    // For now, we'll generate timing data and return a placeholder
    // In a real implementation, you could use:
    // - Google Cloud TTS (free tier: 1M chars/month)
    // - Amazon Polly (free tier: 5M chars/month)
    // - ElevenLabs (free tier: 10k chars/month)
    
    const words = text.split(' ');
    const avgWordsPerMinute = 150;
    const secondsPerWord = 60 / avgWordsPerMinute;
    
    const wordTimings = words.map((word, index) => ({
      text: word,
      start: index * secondsPerWord,
      end: (index + 1) * secondsPerWord,
      confidence: 0.95
    }));

    const totalDuration = words.length * secondsPerWord;

    // Generate simple TTS using browser's speech synthesis (client-side)
    return {
      audioUrl: 'client-side-tts', // Special marker for client-side generation
      duration: totalDuration,
      wordTimings
    };
    
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
};

// Get background music (using free royalty-free sources)
const getBackgroundMusic = async (mood: string) => {
  // Free background music sources
  const musicTracks = {
    'news': 'https://www.soundjay.com/misc/sounds-1179.mp3',
    'serious': 'https://www.soundjay.com/misc/sounds-1180.mp3',
    'upbeat': 'https://www.soundjay.com/misc/sounds-1181.mp3',
    'calm': 'https://www.soundjay.com/misc/sounds-1182.mp3'
  };
  
  // For production, you could use:
  // - Freesound.org API (free with attribution)
  // - YouTube Audio Library
  // - Pixabay Music API
  
  return musicTracks[mood as keyof typeof musicTracks] || musicTracks.calm;
};

// Classify content mood for music selection
const classifyMood = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('crisis') || lowerContent.includes('urgent') || lowerContent.includes('breaking')) {
    return 'serious';
  } else if (lowerContent.includes('celebration') || lowerContent.includes('success') || lowerContent.includes('achievement')) {
    return 'upbeat';
  } else if (lowerContent.includes('health') || lowerContent.includes('wellness') || lowerContent.includes('meditation')) {
    return 'calm';
  }
  
  return 'news';
};

// Create video compilation metadata (for client-side assembly)
const createVideoMetadata = async (images: any[], audioData: any, backgroundMusic: string, content: string) => {
  const scenes = [];
  const wordsPerScene = Math.ceil(audioData.wordTimings.length / images.length);
  
  for (let i = 0; i < images.length; i++) {
    const startWordIndex = i * wordsPerScene;
    const endWordIndex = Math.min((i + 1) * wordsPerScene, audioData.wordTimings.length);
    const sceneWords = audioData.wordTimings.slice(startWordIndex, endWordIndex);
    
    scenes.push({
      image: images[i],
      words: sceneWords,
      startTime: sceneWords[0]?.start || 0,
      endTime: sceneWords[sceneWords.length - 1]?.end || audioData.duration,
      text: sceneWords.map(w => w.text).join(' ')
    });
  }

  return {
    scenes,
    totalDuration: audioData.duration,
    backgroundMusic,
    subtitles: audioData.wordTimings
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { articleId, title, content, imageUrl }: VideoGenerationRequest = await req.json();
    
    console.log('Generating video content for article:', articleId);

    // Since we're dealing with mock data IDs that aren't UUIDs, we'll use a simple storage approach
    // that doesn't rely on foreign key relationships to the articles table
    
    // Check if video content already exists using a simple text-based lookup
    const { data: existing } = await supabase
      .from('video_content')
      .select('id')
      .eq('article_id', articleId)
      .maybeSingle();

    if (existing) {
      console.log('Video content already exists for article:', articleId);
      return new Response(
        JSON.stringify({ message: 'Video content already exists', videoId: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating new video content for article:', articleId);

    // Step 1: Extract entities for image search
    const entities = extractEntities(title + ' ' + content);
    const searchQuery = entities.join(' ') || title.split(' ').slice(0, 3).join(' ');
    
    console.log('Searching images for:', searchQuery);

    // Step 2: Get images from Unsplash
    const images = await getImagesFromUnsplash(searchQuery);
    console.log('Found', images.length, 'images');
    
    // Step 3: Generate audio narration with timing
    const audioData = await generateAudioNarration(content);
    console.log('Generated audio data with duration:', audioData.duration);
    
    // Step 4: Get background music based on content mood
    const mood = classifyMood(content);
    const backgroundMusic = await getBackgroundMusic(mood);
    console.log('Selected background music for mood:', mood);
    
    // Step 5: Create video compilation metadata
    const videoMetadata = await createVideoMetadata(images, audioData, backgroundMusic, content);
    console.log('Created video metadata with', videoMetadata.scenes.length, 'scenes');

    // Store video content with the string-based article ID
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_content')
      .insert({
        article_id: articleId, // Use the string ID directly
        video_url: 'client-assembled',
        audio_url: audioData.audioUrl,
        background_music_url: backgroundMusic,
        subtitle_data: {
          scenes: videoMetadata.scenes,
          subtitles: videoMetadata.subtitles,
          totalDuration: videoMetadata.totalDuration
        },
        video_duration_seconds: Math.ceil(videoMetadata.totalDuration),
        processing_status: 'completed'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting video content:', insertError);
      throw insertError;
    }

    console.log('Video content generated successfully for article:', articleId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        videoId: videoRecord.id,
        metadata: videoMetadata,
        audioData,
        images,
        backgroundMusic
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
