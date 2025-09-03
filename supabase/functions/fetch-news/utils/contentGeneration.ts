import { cleanGarbageText, capitalizeFirstLetter } from './textCleaning.ts';

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
    const casualStarters = ['So basically,', 'Here\'s the tea:', 'Basically,', 'TL;DR:', 'Real talk,'];
    const randomStarter = casualStarters[Math.floor(Math.random() * casualStarters.length)];
    genZText = `${randomStarter} ${genZText.toLowerCase()}`;
  }
  
  // Clean up extra spaces and ensure proper capitalization
  genZText = genZText
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter if not already capitalized
  if (genZText && !genZText.match(/^[A-Z]/)) {
    genZText = capitalizeFirstLetter(genZText);
  }
  
  return genZText;
};

export const formatTLDR = (text: string): string => {
  if (!text) return text;
  
  let cleanedText = cleanGarbageText(text);
  if (!cleanedText) return text;
  
  const sentences = cleanedText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  
  const formattedSentences = sentences.map(sentence => {
    if (!sentence) return '';
    
    const words = sentence.split(/\s+/);
    const formattedWords = words.map((word, index) => {
      if (!word) return word;
      
      if (index === 0) {
        return capitalizeFirstLetter(word.toLowerCase());
      }
      
      if (word.match(/^[A-Z]{2,}$/)) {
        return word;
      }
      
      if (word.match(/^[A-Z][a-z]+$/)) {
        return word;
      }
      
      if (word.match(/^[A-Z][a-z]*[A-Z]/)) {
        return word;
      }
      
      const lowercaseWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall'];
      
      if (lowercaseWords.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      return capitalizeFirstLetter(word.toLowerCase());
    });
    
    return formattedWords.join(' ');
  });
  
  let result = formattedSentences.join('. ');
  
  if (result && !result.match(/[.!?]$/)) {
    result += '.';
  }
  
  return result;
};

export const extractFromHeadline = (headline: string): string => {
  let summary = cleanGarbageText(headline.trim());
  
  if (summary.startsWith('"') && summary.endsWith('"')) {
    summary = summary.slice(1, -1);
  }
  
  if (summary.split(' ').length <= 8) {
    return summary + (summary.endsWith('.') ? '' : '.');
  }
  
  const words = summary.split(' ');
  if (words.length > 15) {
    const firstPart = words.slice(0, 12).join(' ');
    return firstPart + (firstPart.endsWith('.') ? '' : '...');
  }
  
  return summary + (summary.endsWith('.') ? '' : '.');
};

export const generateSmartFallback = (content: string, headline: string, description: string = ''): string => {
  console.log(`Generating smart fallback for: "${headline}"`);
  
  // Remove CDATA sections first
  const fullContent = `${description} ${content}`.trim()
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  const cleanedContent = cleanGarbageText(fullContent);
  
  if (!cleanedContent || cleanedContent.length < 20) {
    return formatTLDR(extractFromHeadline(headline));
  }

  let cleaned = cleanedContent.toLowerCase();
  const unwantedPhrases = [
    'only available in paid plans',
    'subscribe to continue reading',
    'premium content',
    'the news mill',
    'breaking news',
    'read more',
    'click here',
    'advertisement',
    'sponsored content',
    'paywall',
    'sign up',
    'login required',
    'subscription required',
    'premium subscription',
    'free trial',
    'upgrade to premium',
    'full access',
    'unlimited access',
    'get latest articles',
    'follow us',
    'subscribe now',
    'continue reading',
    'developing story',
    'stay tuned',
    'more details expected',
    'developing news story',
    'situation continues to evolve',
    'closely monitored',
    'stakeholders for further updates',
    'multiple factors and stakeholders',
    'officials and experts analyze',
    'implications and next steps',
    'being analyzed',
    'continue to monitor',
    'updates as it develops',
    'this represents a notable development',
    'this development is being',
    'the situation continues',
    'more information becomes available',
    'authorities and stakeholders',
    'relevant authorities',
    'situation as it updates',
    'news development involves',
    'continues to evolve',
    'being closely monitored',
    'key development involving',
    'situation involving',
    'development in',
    'notable development',
    'significant development',
    'mobile app',
    'onelink.to',
    'youtube',
    'download app',
    'app store',
    'google play',
    'breaking-news',
    'n180c_',
    '_indian18oc_',
    'desc-youtube'
  ];
  unwantedPhrases.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  cleaned = cleaned.replace(/\b(according to|reports suggest|sources say|it is reported|officials said|experts believe)\b/gi, '');
  cleaned = cleaned.replace(/\b(in a statement|in an interview|during a press conference)\b/gi, '');
  
  const sentences = cleaned.split(/[.!?]+/).map(s => s.trim()).filter(sentence => {
    return sentence.length > 15 && 
           sentence.split(' ').length >= 5 &&
           !unwantedPhrases.some(phrase => sentence.toLowerCase().includes(phrase.toLowerCase())) &&
           !sentence.match(/^\s*(the|this|that|it|there)\s+/i);
  });

  if (sentences.length > 0) {
    let summary = sentences[0].trim();
    
    // Apply Gen-Z casual tone transformation
    summary = makeGenZTone(summary);
    
    const words = summary.split(' ');
    if (words.length > 45) {
      summary = words.slice(0, 40).join(' ') + '...';
    } else if (!summary.endsWith('.')) {
      summary += '.';
    }
    
    return formatTLDR(summary);
  }
  
  return formatTLDR(extractFromHeadline(headline));
};

export const generateTLDR = async (content: string, headline: string, description: string = ''): Promise<string> => {
  console.log(`Generating TL;DR for: "${headline}"`);
  
  // Remove CDATA sections first
  const fullContent = `${description} ${content}`.trim()
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  const cleanedContent = cleanGarbageText(fullContent);
  
  if (cleanedContent.length > 20) {
    return generateSmartFallback(cleanedContent, headline, description);
  }
  
  return generateSmartFallback(cleanedContent, headline, description);
};
