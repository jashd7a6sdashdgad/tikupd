import { NextRequest, NextResponse } from 'next/server';

// Generate smart translation suggestions and alternatives
export async function POST(request: NextRequest) {
  try {
    const { source, translation, sourceLang, targetLang } = await request.json();

    if (!source || !translation || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Source, translation, and language parameters are required' },
        { status: 400 }
      );
    }

    const suggestions = await generateSmartSuggestions(source, translation, sourceLang, targetLang);
    
    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Translation suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate translation suggestions' },
      { status: 500 }
    );
  }
}

async function generateSmartSuggestions(
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  const suggestions: any[] = [];
  
  // Style variations
  await addStyleSuggestions(suggestions, source, translation, sourceLang, targetLang);
  
  // Grammar improvements
  await addGrammarSuggestions(suggestions, source, translation, sourceLang, targetLang);
  
  // Context alternatives
  await addContextSuggestions(suggestions, source, translation, sourceLang, targetLang);
  
  // Alternative translations
  await addAlternativeSuggestions(suggestions, source, translation, sourceLang, targetLang);
  
  // Cultural adaptations
  await addCulturalSuggestions(suggestions, source, translation, sourceLang, targetLang);
  
  // Sort by confidence and return top suggestions
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
}

async function addStyleSuggestions(
  suggestions: any[],
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  // Formal vs Informal variations
  if (source.length < 100) { // For shorter texts
    if (isInformalText(source)) {
      suggestions.push({
        text: createFormalVariation(translation, targetLang),
        type: 'style',
        confidence: 0.8,
        description: 'Formal version',
        icon: '👔'
      });
    } else if (isFormalText(source)) {
      suggestions.push({
        text: createInformalVariation(translation, targetLang),
        type: 'style',
        confidence: 0.7,
        description: 'Casual version',
        icon: '💬'
      });
    }
  }
  
  // Professional tone
  if (hasBusinessContext(source)) {
    suggestions.push({
      text: createProfessionalVariation(translation, targetLang),
      type: 'style',
      confidence: 0.85,
      description: 'Professional tone',
      icon: '💼'
    });
  }
  
  // Simplified version
  if (isComplexText(source)) {
    suggestions.push({
      text: createSimplifiedVariation(translation, targetLang),
      type: 'style',
      confidence: 0.75,
      description: 'Simplified version',
      icon: '📝'
    });
  }
}

async function addGrammarSuggestions(
  suggestions: any[],
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  // Check for common grammar issues
  const grammarIssues = detectGrammarIssues(translation, targetLang);
  
  grammarIssues.forEach(issue => {
    suggestions.push({
      text: issue.correction,
      type: 'grammar',
      confidence: issue.confidence,
      description: issue.description,
      icon: '✏️'
    });
  });
}

async function addContextSuggestions(
  suggestions: any[],
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  const context = detectTextContext(source);
  
  switch (context) {
    case 'technical':
      suggestions.push({
        text: enhanceForTechnicalContext(translation, targetLang),
        type: 'context',
        confidence: 0.9,
        description: 'Technical terminology enhanced',
        icon: '⚙️'
      });
      break;
      
    case 'medical':
      suggestions.push({
        text: enhanceForMedicalContext(translation, targetLang),
        type: 'context',
        confidence: 0.9,
        description: 'Medical terminology preserved',
        icon: '🏥'
      });
      break;
      
    case 'legal':
      suggestions.push({
        text: enhanceForLegalContext(translation, targetLang),
        type: 'context',
        confidence: 0.9,
        description: 'Legal precision maintained',
        icon: '⚖️'
      });
      break;
      
    case 'academic':
      suggestions.push({
        text: enhanceForAcademicContext(translation, targetLang),
        type: 'context',
        confidence: 0.85,
        description: 'Academic tone enhanced',
        icon: '🎓'
      });
      break;
  }
}

async function addAlternativeSuggestions(
  suggestions: any[],
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  // Generate alternative word choices
  const alternatives = generateAlternativeWords(translation, targetLang);
  
  alternatives.forEach(alt => {
    suggestions.push({
      text: alt.text,
      type: 'alternative',
      confidence: alt.confidence,
      description: `Alternative: ${alt.original} → ${alt.alternative}`,
      icon: '🔄'
    });
  });
  
  // Suggest different sentence structures
  if (source.split(/[.!?]+/).length <= 3) { // For shorter texts
    const restructured = suggestSentenceRestructuring(translation, targetLang);
    if (restructured && restructured !== translation) {
      suggestions.push({
        text: restructured,
        type: 'alternative',
        confidence: 0.7,
        description: 'Alternative structure',
        icon: '🏗️'
      });
    }
  }
}

async function addCulturalSuggestions(
  suggestions: any[],
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  // Cultural adaptations based on target language
  const culturalAdaptation = adaptForCulture(translation, sourceLang, targetLang);
  
  if (culturalAdaptation && culturalAdaptation !== translation) {
    suggestions.push({
      text: culturalAdaptation,
      type: 'cultural',
      confidence: 0.8,
      description: 'Culturally adapted version',
      icon: '🌍'
    });
  }
  
  // Localization suggestions
  const localized = localizeContent(translation, targetLang);
  if (localized && localized !== translation) {
    suggestions.push({
      text: localized,
      type: 'cultural',
      confidence: 0.75,
      description: 'Localized version',
      icon: '📍'
    });
  }
}

// Helper functions

function isInformalText(text: string): boolean {
  const informalMarkers = ['hey', 'hi', 'yeah', 'ok', 'gonna', 'wanna', 'kinda', 'sorta'];
  const lowerText = text.toLowerCase();
  return informalMarkers.some(marker => lowerText.includes(marker));
}

function isFormalText(text: string): boolean {
  const formalMarkers = ['please', 'kindly', 'therefore', 'furthermore', 'consequently', 'regards'];
  const lowerText = text.toLowerCase();
  return formalMarkers.some(marker => lowerText.includes(marker));
}

function hasBusinessContext(text: string): boolean {
  const businessTerms = ['meeting', 'presentation', 'proposal', 'client', 'project', 'deadline', 'budget'];
  const lowerText = text.toLowerCase();
  return businessTerms.some(term => lowerText.includes(term));
}

function isComplexText(text: string): boolean {
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const avgWordsPerSentence = words / sentences;
  const longWords = text.split(/\s+/).filter(word => word.length > 7).length;
  
  return avgWordsPerSentence > 15 || longWords / words > 0.2;
}

function createFormalVariation(text: string, targetLang: string): string {
  let formal = text;
  
  // Simple formal transformations
  const informalToFormal: { [key: string]: string } = {
    "hi": "hello",
    "hey": "hello",
    "ok": "acceptable",
    "yeah": "yes",
    "nope": "no",
    "gonna": "going to",
    "wanna": "want to"
  };
  
  for (const [informal, formalWord] of Object.entries(informalToFormal)) {
    const regex = new RegExp(`\\b${informal}\\b`, 'gi');
    formal = formal.replace(regex, formalWord);
  }
  
  return formal;
}

function createInformalVariation(text: string, targetLang: string): string {
  let informal = text;
  
  const formalToInformal: { [key: string]: string } = {
    "hello": "hi",
    "acceptable": "ok",
    "going to": "gonna",
    "want to": "wanna",
    "because": "'cause"
  };
  
  for (const [formalWord, informalWord] of Object.entries(formalToInformal)) {
    const regex = new RegExp(`\\b${formalWord}\\b`, 'gi');
    informal = informal.replace(regex, informalWord);
  }
  
  return informal;
}

function createProfessionalVariation(text: string, targetLang: string): string {
  let professional = text;
  
  // Add professional markers
  if (!professional.toLowerCase().includes('please') && professional.length > 20) {
    professional = professional.replace(/\.$/, ', please.');
  }
  
  // Replace casual terms with professional ones
  const casualToProfessional: { [key: string]: string } = {
    "help": "assist",
    "fix": "resolve",
    "problem": "issue",
    "check": "review",
    "get": "obtain"
  };
  
  for (const [casual, professional_word] of Object.entries(casualToProfessional)) {
    const regex = new RegExp(`\\b${casual}\\b`, 'gi');
    professional = professional.replace(regex, professional_word);
  }
  
  return professional;
}

function createSimplifiedVariation(text: string, targetLang: string): string {
  let simplified = text;
  
  // Replace complex words with simpler alternatives
  const complexToSimple: { [key: string]: string } = {
    "utilize": "use",
    "commence": "start",
    "terminate": "end",
    "assist": "help",
    "obtain": "get",
    "demonstrate": "show",
    "facilitate": "help"
  };
  
  for (const [complex, simple] of Object.entries(complexToSimple)) {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  }
  
  // Break long sentences
  if (simplified.length > 100 && simplified.includes(' and ')) {
    simplified = simplified.replace(/ and /g, '. ');
  }
  
  return simplified;
}

function detectGrammarIssues(text: string, targetLang: string): any[] {
  const issues: any[] = [];
  
  // Check for double spaces
  if (text.includes('  ')) {
    issues.push({
      correction: text.replace(/\s+/g, ' '),
      confidence: 0.9,
      description: 'Remove extra spaces'
    });
  }
  
  // Check for missing capitalization at sentence start
  const sentences = text.split(/[.!?]+/);
  let corrected = text;
  let hasCapitalizationIssues = false;
  
  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    if (trimmed.length > 0 && trimmed[0] === trimmed[0].toLowerCase()) {
      hasCapitalizationIssues = true;
      const capitalized = trimmed[0].toUpperCase() + trimmed.slice(1);
      corrected = corrected.replace(trimmed, capitalized);
    }
  });
  
  if (hasCapitalizationIssues) {
    issues.push({
      correction: corrected,
      confidence: 0.85,
      description: 'Capitalize sentence beginnings'
    });
  }
  
  return issues;
}

function detectTextContext(text: string): string {
  const lowerText = text.toLowerCase();
  
  const contexts = {
    technical: ['function', 'class', 'import', 'const', 'var', 'api', 'http', 'json', 'code', 'software'],
    medical: ['patient', 'diagnosis', 'treatment', 'symptoms', 'medication', 'therapy', 'clinical', 'medical'],
    legal: ['contract', 'agreement', 'terms', 'conditions', 'liability', 'jurisdiction', 'legal', 'court'],
    academic: ['research', 'study', 'analysis', 'hypothesis', 'methodology', 'conclusion', 'academic', 'paper'],
    business: ['meeting', 'client', 'project', 'deadline', 'budget', 'revenue', 'profit', 'business']
  };
  
  for (const [context, keywords] of Object.entries(contexts)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return context;
    }
  }
  
  return 'general';
}

function enhanceForTechnicalContext(text: string, targetLang: string): string {
  // Preserve technical terms and add clarity
  let enhanced = text;
  
  // Add technical precision
  enhanced = enhanced.replace(/\buse\b/gi, 'utilize');
  enhanced = enhanced.replace(/\bget\b/gi, 'retrieve');
  enhanced = enhanced.replace(/\bsend\b/gi, 'transmit');
  
  return enhanced;
}

function enhanceForMedicalContext(text: string, targetLang: string): string {
  // Ensure medical terminology is preserved and professional
  return text.replace(/\bsickness\b/gi, 'condition')
             .replace(/\bdoctor\b/gi, 'physician');
}

function enhanceForLegalContext(text: string, targetLang: string): string {
  // Ensure legal precision
  return text.replace(/\bagree\b/gi, 'consent')
             .replace(/\brule\b/gi, 'regulation');
}

function enhanceForAcademicContext(text: string, targetLang: string): string {
  // Academic tone enhancement
  return text.replace(/\bshow\b/gi, 'demonstrate')
             .replace(/\bprove\b/gi, 'establish');
}

function generateAlternativeWords(text: string, targetLang: string): any[] {
  const alternatives: any[] = [];
  const words = text.split(/\s+/);
  
  const wordAlternatives: { [key: string]: string[] } = {
    'good': ['excellent', 'great', 'fine'],
    'bad': ['poor', 'inadequate', 'unsatisfactory'],
    'big': ['large', 'huge', 'enormous'],
    'small': ['tiny', 'little', 'compact'],
    'fast': ['quick', 'rapid', 'swift'],
    'slow': ['gradual', 'leisurely', 'unhurried']
  };
  
  words.forEach(word => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    if (wordAlternatives[cleanWord]) {
      wordAlternatives[cleanWord].forEach(alt => {
        alternatives.push({
          text: text.replace(new RegExp(`\\b${word}\\b`, 'gi'), alt),
          original: word,
          alternative: alt,
          confidence: 0.7
        });
      });
    }
  });
  
  return alternatives.slice(0, 3); // Limit alternatives
}

function suggestSentenceRestructuring(text: string, targetLang: string): string {
  // Simple restructuring suggestions
  if (text.includes(' because ')) {
    return text.replace(/ because /g, '. This is because ');
  }
  
  if (text.includes(' but ')) {
    return text.replace(/ but /g, '. However, ');
  }
  
  return text;
}

function adaptForCulture(text: string, sourceLang: string, targetLang: string): string {
  // Cultural adaptations based on language pairs
  if (sourceLang === 'en' && targetLang === 'ar') {
    // Add Arabic cultural context
    if (text.toLowerCase().includes('hello')) {
      return text.replace(/hello/gi, 'مرحبا وأهلا');
    }
  }
  
  if (sourceLang === 'en' && targetLang === 'ja') {
    // Add Japanese politeness levels
    if (text.toLowerCase().includes('thank you')) {
      return text.replace(/thank you/gi, 'ありがとうございます');
    }
  }
  
  return text;
}

function localizeContent(text: string, targetLang: string): string {
  // Localize measurements, currencies, dates etc.
  let localized = text;
  
  // Convert measurements for metric countries
  if (['fr', 'de', 'es', 'it'].includes(targetLang)) {
    localized = localized.replace(/(\d+)\s*feet/gi, (match, num) => {
      const meters = Math.round(parseInt(num) * 0.3048 * 100) / 100;
      return `${meters} meters`;
    });
  }
  
  // Currency localization
  if (targetLang === 'ar') {
    localized = localized.replace(/\$(\d+)/g, '$1 dollars');
  }
  
  return localized;
}