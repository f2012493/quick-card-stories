// Gen-Z tone utilities for casual, engaging content generation

export const makeGenZTone = (text: string): string => {
  if (!text) return text;
  
  let genZText = text;
  
  // Replace formal phrases with casual alternatives
  const replacements = [
    { formal: /\b(according to|reports indicate|sources say|it is reported)\b/gi, casual: '' },
    { formal: /\b(officials|authorities|representatives)\b/gi, casual: 'officials' },
    { formal: /\b(approximately|approximately)\b/gi, casual: 'around' },
    { formal: /\b(significant|substantial)\b/gi, casual: 'major' },
    { formal: /\b(demonstrate|illustrate)\b/gi, casual: 'show' },
    { formal: /\b(currently|presently)\b/gi, casual: 'right now' },
    { formal: /\b(anticipated|expected)\b/gi, casual: 'expected' },
    { formal: /\b(commenced|initiated)\b/gi, casual: 'started' },
    { formal: /\b(terminated|concluded)\b/gi, casual: 'ended' },
    { formal: /\b(utilize|employ)\b/gi, casual: 'use' },
    { formal: /\b(regarding|concerning)\b/gi, casual: 'about' },
    { formal: /\b(subsequent to|following)\b/gi, casual: 'after' },
    { formal: /\b(prior to|before)\b/gi, casual: 'before' },
    { formal: /\b(in order to)\b/gi, casual: 'to' },
    { formal: /\b(as a result of)\b/gi, casual: 'because of' },
    { formal: /\b(due to the fact that)\b/gi, casual: 'because' }
  ];
  
  replacements.forEach(({ formal, casual }) => {
    genZText = genZText.replace(formal, casual);
  });
  
  // Add casual connectors occasionally
  if (Math.random() > 0.7) {
    const casualStarters = ['So basically,', 'Here\'s the tea:', 'Basically,', 'Real talk,'];
    const randomStarter = casualStarters[Math.floor(Math.random() * casualStarters.length)];
    genZText = `${randomStarter} ${genZText.toLowerCase()}`;
  }
  
  // Clean up extra spaces and ensure proper capitalization
  genZText = genZText
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter if not already capitalized
  if (genZText && !genZText.match(/^[A-Z]/)) {
    genZText = genZText.charAt(0).toUpperCase() + genZText.slice(1);
  }
  
  return genZText;
};

export const generateGenZTldr = (content: string | null, headline: string = ''): string => {
  if (!content && !headline) return 'No summary available';
  
  // Use content if available, otherwise fall back to headline
  const sourceText = content || headline;
  
  // Clean up HTML entities, artifacts, and unwanted patterns
  let cleanContent = sourceText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\[.*?\]/g, '') // Remove [+ chars], [+n chars] type artifacts
    .replace(/\[\+\d+\s*chars?\]/gi, '') // Specifically target [+n chars]
    .replace(/\d+\s*$/, '') // Remove trailing numbers like "0"
    .replace(/^\d+\s*/, '') // Remove leading numbers
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Remove common prefixes/suffixes that might be artifacts
  cleanContent = cleanContent
    .replace(/^(summary|tldr|description|story|article):\s*/i, '')
    .replace(/\.\.\.\s*$/, '')
    .replace(/…\s*$/, '')
    .replace(/read more.*$/i, '')
    .replace(/continue reading.*$/i, '');
  
  if (!cleanContent) return 'No summary available';
  
  // Extract meaningful sentences, focusing on the beginning for news summary
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  let summary = '';
  let wordCount = 0;
  
  // Try to build a coherent summary from the first few sentences
  for (const sentence of sentences.slice(0, 3)) {
    const sentenceWords = sentence.trim().split(/\s+/);
    if (wordCount + sentenceWords.length <= 55) { // Leave room for Gen-Z tone additions
      summary += (summary ? ' ' : '') + sentence.trim();
      wordCount += sentenceWords.length;
    } else {
      break;
    }
  }
  
  if (!summary) {
    // Fallback to first sentence or truncated content
    summary = sentences[0]?.trim() || cleanContent.split(' ').slice(0, 40).join(' ');
  }
  
  // Apply Gen-Z casual tone transformation
  summary = makeGenZTone(summary);
  
  // Final word count check and cleanup
  const words = summary.split(/\s+/).filter(word => word.length > 0);
  if (words.length > 60) {
    summary = words.slice(0, 58).join(' ') + '...';
  }
  
  // Ensure proper ending
  if (!summary.match(/[.!?…]$/)) {
    summary += '.';
  }
  
  return summary;
};