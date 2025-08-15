// Gen-Z tone utilities for casual, engaging content generation

export const makeGenZTone = (text: string): string => {
  if (!text) return text;
  
  let genZText = text;
  
  // Replace formal phrases with casual alternatives
  const replacements = [
    { formal: /\b(according to|reports indicate|sources say|it is reported)\b/gi, casual: '' },
    { formal: /\b(officials|authorities|representatives)\b/gi, casual: 'officials' },
    { formal: /\b(approximately|roughly)\b/gi, casual: 'around' },
    { formal: /\b(significant|substantial)\b/gi, casual: 'major' },
    { formal: /\b(demonstrate|illustrate)\b/gi, casual: 'show' },
    { formal: /\b(currently|presently)\b/gi, casual: 'rn' },
    { formal: /\b(anticipated|expected)\b/gi, casual: 'expected' },
    { formal: /\b(commenced|initiated)\b/gi, casual: 'started' },
    { formal: /\b(terminated|concluded)\b/gi, casual: 'ended' },
    { formal: /\b(utilize|employ)\b/gi, casual: 'use' },
    { formal: /\b(regarding|concerning)\b/gi, casual: 'about' },
    { formal: /\b(subsequent to|following)\b/gi, casual: 'after' },
    { formal: /\b(prior to)\b/gi, casual: 'before' },
    { formal: /\b(in order to)\b/gi, casual: 'to' },
    { formal: /\b(as a result of)\b/gi, casual: 'because of' },
    { formal: /\b(due to the fact that)\b/gi, casual: 'because' },
    { formal: /\b(very important|extremely important)\b/gi, casual: 'lowkey important' },
    { formal: /\b(really|very)\b/gi, casual: 'literally' },
    { formal: /\b(absolutely|completely)\b/gi, casual: 'totally' },
    { formal: /\b(immediately|right away)\b/gi, casual: 'asap' }
  ];
  
  replacements.forEach(({ formal, casual }) => {
    genZText = genZText.replace(formal, casual);
  });
  
  // Add Gen-Z intensifiers and casual words
  genZText = genZText
    .replace(/\b(amazing|incredible|extraordinary)\b/gi, 'fire')
    .replace(/\b(terrible|awful|horrible)\b/gi, 'trash')
    .replace(/\b(popular|trending)\b/gi, 'viral')
    .replace(/\b(obvious|clear)\b/gi, 'lowkey obvious')
    .replace(/\b(surprising|shocking)\b/gi, 'no cap shocking');
  
  // Add casual connectors and starters with higher probability
  const shouldAddStarter = Math.random() > 0.5; // Increased from 0.7
  if (shouldAddStarter) {
    const casualStarters = [
      'So basically,', 'Here\'s the tea:', 'Ngl,', 'Real talk,', 
      'Lowkey,', 'Highkey,', 'Not gonna lie,', 'Tbh,'
    ];
    const randomStarter = casualStarters[Math.floor(Math.random() * casualStarters.length)];
    genZText = `${randomStarter} ${genZText.toLowerCase()}`;
  }
  
  // Add casual transitions within text
  if (Math.random() > 0.6) {
    genZText = genZText
      .replace(/\. /g, ', and ')
      .replace(/, and ([^,]+)$/, ` and $1 ngl.`);
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
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/\[.*?\]/g, '') // Remove [+ chars], [+n chars] type artifacts
    .replace(/\[\+\d+\s*chars?\]/gi, '') // Specifically target [+n chars]
    .replace(/\[Read more\]/gi, '') // Remove [Read more] artifacts
    .replace(/\[Continue reading\]/gi, '') // Remove [Continue reading] artifacts
    .replace(/\[Full story\]/gi, '') // Remove [Full story] artifacts
    .replace(/\s+/g, ' ') // Normalize whitespace first
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
    return headline ? makeGenZTone(headline.split(' ').slice(0, 15).join(' ')) + '.' : 'No summary available';
  }
  
  // Smart sentence extraction for better summaries
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  let summary = '';
  let targetWordCount = 45; // Leave more room for Gen-Z additions
  
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
  
  // Apply Gen-Z casual tone transformation
  summary = makeGenZTone(summary);
  
  // Strict 60-word enforcement after Gen-Z transformation
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