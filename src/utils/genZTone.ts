// Clean, professional content utilities for readable summaries

export const cleanProfessionalTone = (text: string): string => {
  if (!text) return text;
  
  let cleanText = text;
  
  // Replace overly formal phrases with cleaner alternatives
  const replacements = [
    { formal: /\b(according to|reports indicate|sources say|it is reported)\b/gi, casual: '' },
    { formal: /\b(approximately|roughly)\b/gi, casual: 'around' },
    { formal: /\b(demonstrate|illustrate)\b/gi, casual: 'show' },
    { formal: /\b(commenced|initiated)\b/gi, casual: 'started' },
    { formal: /\b(terminated|concluded)\b/gi, casual: 'ended' },
    { formal: /\b(utilize|employ)\b/gi, casual: 'use' },
    { formal: /\b(regarding|concerning)\b/gi, casual: 'about' },
    { formal: /\b(subsequent to|following)\b/gi, casual: 'after' },
    { formal: /\b(prior to)\b/gi, casual: 'before' },
    { formal: /\b(in order to)\b/gi, casual: 'to' },
    { formal: /\b(as a result of)\b/gi, casual: 'because of' },
    { formal: /\b(due to the fact that)\b/gi, casual: 'because' }
  ];
  
  replacements.forEach(({ formal, casual }) => {
    cleanText = cleanText.replace(formal, casual);
  });
  
  // Clean up extra spaces and ensure proper capitalization
  cleanText = cleanText
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter if not already capitalized
  if (cleanText && !cleanText.match(/^[A-Z]/)) {
    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
  }
  
  return cleanText;
};

export const generateCleanTldr = (content: string | null, headline: string = ''): string => {
  if (!content && !headline) return 'No summary available';
  
  // Use content if available, otherwise combine headline and content for richer summaries
  let sourceText = '';
  if (content && content.length > 50) {
    sourceText = content;
  } else if (content && headline) {
    // Combine both for better context when content is short
    sourceText = `${headline}. ${content}`;
  } else {
    sourceText = headline || content || '';
  }
  
  // More aggressive cleaning for better content extraction
  let cleanContent = sourceText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Remove HTML tags more aggressively
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags first
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags first
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .replace(/\[.*?\]/g, '') // Remove [+ chars], [+n chars] type artifacts
    .replace(/\[\+\d+\s*chars?\]/gi, '') // Specifically target [+n chars]
    .replace(/\[Read more\]/gi, '') // Remove [Read more] artifacts
    .replace(/\[Continue reading\]/gi, '') // Remove [Continue reading] artifacts
    .replace(/\[Full story\]/gi, '') // Remove [Full story] artifacts
    // Remove content truncation patterns more aggressively
    .replace(/…\s*\[\+\d+\s*chars?\]/gi, '') // Remove "… [+n chars]"
    .replace(/\.\.\.\s*\[\+\d+\s*chars?\]/gi, '') // Remove "... [+n chars]"
    .replace(/\s*\[\+\d+\s*chars?\].*$/gi, '') // Remove everything from [+n chars] to end
    .replace(/….*$/g, '') // Remove everything after ellipsis
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(click here|read more|continue reading|full story|see more|learn more|find out more)\b.*$/gi, '') // Remove call-to-action endings
    .replace(/^\d+\s*/, '') // Remove leading numbers
    .replace(/\s*\d+\s*$/, '') // Remove trailing numbers and spaces
    .replace(/\s*0\s*$/, '') // Specifically remove trailing "0"
    .replace(/\.\.\.\s*$/, '') // Remove trailing ellipsis
    .replace(/…\s*$/, '') // Remove trailing unicode ellipsis
    .trim();
  
  // Remove common prefixes/suffixes that might be artifacts
  cleanContent = cleanContent
    .replace(/^(summary|tldr|description|story|article):\s*/i, '')
    .replace(/\.\.\.\s*$/, '')
    .replace(/…\s*$/, '')
    .replace(/\s*-\s*$/g, ''); // Remove trailing dashes
  
  if (!cleanContent || cleanContent.length < 10) {
    return headline ? cleanProfessionalTone(headline.split(' ').slice(0, 15).join(' ')) + '.' : 'No summary available';
  }
  
  // Smart sentence extraction for better summaries
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  let summary = '';
  let targetWordCount = 50; // Professional summary target
  
  // Build summary prioritizing the most informative sentences
  if (sentences.length > 0) {
    // Start with the first sentence (usually most important)
    let currentWords = sentences[0].trim().split(/\s+/);
    
    if (currentWords.length <= targetWordCount) {
      summary = sentences[0].trim();
      
      // Try to add a second sentence if there's room
      if (sentences.length > 1) {
        const secondWords = sentences[1].trim().split(/\s+/);
        if (currentWords.length + secondWords.length <= targetWordCount) {
          summary += '. ' + sentences[1].trim();
        }
      }
    } else {
      // If first sentence is too long, truncate it intelligently
      summary = currentWords.slice(0, targetWordCount).join(' ');
    }
  } else {
    // Fallback for no proper sentences
    const words = cleanContent.split(/\s+/);
    summary = words.slice(0, targetWordCount).join(' ');
  }
  
  // Apply professional tone transformation
  summary = cleanProfessionalTone(summary);
  
  // Strict 60-word enforcement after professional tone cleanup
  const finalWords = summary.split(/\s+/).filter(word => word.length > 0);
  if (finalWords.length > 60) {
    summary = finalWords.slice(0, 60).join(' ');
    // If we cut off mid-sentence, try to end gracefully
    if (!summary.match(/[.!?]$/)) {
      summary = summary.replace(/[,;:]?\s*\w*$/, '') + '...';
    }
  }
  
  // Ensure proper ending
  if (!summary.match(/[.!?…]$/)) {
    summary += '.';
  }
  
  return summary;
};