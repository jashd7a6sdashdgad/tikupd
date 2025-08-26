import { NextRequest, NextResponse } from 'next/server';

// Enhanced AI-powered translation with context awareness
export async function POST(request: NextRequest) {
  try {
    const { text, source, target, context, previousTranslations } = await request.json();

    if (!text || !source || !target) {
      return NextResponse.json(
        { error: 'Text, source, and target languages are required' },
        { status: 400 }
      );
    }

    // Enhanced translation with context
    const translation = await performSmartTranslation(text, source, target, context, previousTranslations);
    
    return NextResponse.json(translation);

  } catch (error) {
    console.error('Smart translation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform smart translation' },
      { status: 500 }
    );
  }
}

async function performSmartTranslation(
  text: string, 
  source: string, 
  target: string,
  context?: string,
  previousTranslations?: any[]
) {
  // In production, this would call advanced AI translation services
  // For demo, we'll enhance the basic translation with context awareness
  
  let enhancedText = text;
  
  // Apply context-aware preprocessing
  if (context) {
    enhancedText = applyContextualEnhancement(text, context);
  }
  
  // Learn from previous translations for consistency
  if (previousTranslations && previousTranslations.length > 0) {
    enhancedText = applyTranslationConsistency(enhancedText, previousTranslations, source, target);
  }
  
  // Basic translation logic (replace with actual AI service)
  const translatedText = await basicTranslate(enhancedText, source, target);
  
  // Generate quality assessment
  const quality = await assessTranslationQuality(text, translatedText, source, target);
  
  // Generate smart suggestions
  const suggestions = await generateTranslationSuggestions(text, translatedText, source, target);
  
  return {
    translatedText,
    quality,
    suggestions,
    detectedContext: detectTextContext(text),
    confidence: calculateTranslationConfidence(text, translatedText, source, target)
  };
}

function applyContextualEnhancement(text: string, context: string): string {
  // Apply context-based text preprocessing
  const contextKeywords = context.toLowerCase().split(/\s+/);
  let enhancedText = text;
  
  // Technical context
  if (contextKeywords.some(word => ['technical', 'programming', 'software', 'code'].includes(word))) {
    // Preserve technical terms and formatting
    enhancedText = preserveTechnicalTerms(text);
  }
  
  // Medical context
  if (contextKeywords.some(word => ['medical', 'health', 'clinical', 'patient'].includes(word))) {
    // Handle medical terminology carefully
    enhancedText = preserveMedicalTerms(text);
  }
  
  // Legal context
  if (contextKeywords.some(word => ['legal', 'contract', 'agreement', 'law'].includes(word))) {
    // Preserve legal precision
    enhancedText = preserveLegalTerms(text);
  }
  
  // Business context
  if (contextKeywords.some(word => ['business', 'corporate', 'financial', 'commercial'].includes(word))) {
    // Handle business terminology
    enhancedText = preserveBusinessTerms(text);
  }
  
  return enhancedText;
}

function applyTranslationConsistency(
  text: string, 
  previousTranslations: any[], 
  source: string, 
  target: string
): string {
  // Maintain consistency with previous translations
  let consistentText = text;
  
  // Extract common terms and their translations
  const termMap = buildTermConsistencyMap(previousTranslations, source, target);
  
  // Apply consistent term translations
  for (const [sourceTerm, targetTerm] of Object.entries(termMap)) {
    const regex = new RegExp(`\\b${sourceTerm}\\b`, 'gi');
    consistentText = consistentText.replace(regex, targetTerm as string);
  }
  
  return consistentText;
}

function buildTermConsistencyMap(translations: any[], source: string, target: string): { [key: string]: string } {
  const termMap: { [key: string]: string } = {};
  
  // Simple term extraction and mapping
  translations.forEach(t => {
    if (t.sourceLang === source && t.targetLang === target) {
      // Extract potential term pairs (simplified)
      const sourceWords = t.sourceText.toLowerCase().split(/\s+/);
      const targetWords = t.translatedText.toLowerCase().split(/\s+/);
      
      // Map high-frequency terms (simplified approach)
      if (sourceWords.length === targetWords.length) {
        sourceWords.forEach((word, index) => {
          if (word.length > 3 && !termMap[word]) {
            termMap[word] = targetWords[index];
          }
        });
      }
    }
  });
  
  return termMap;
}

async function basicTranslate(text: string, source: string, target: string): Promise<string> {
  // Try the external translation API first
  try {
    const response = await fetch('https://translate.1000273.xyz/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: source,
        target: target,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      if (data.translatedText) {
        return data.translatedText;
      }
    }
  } catch (error) {
    console.log('External translation API failed, using fallback:', error);
  }
  
  // Fallback to expanded dictionary-based translation
  const commonTranslations: { [key: string]: { [key: string]: string } } = {
    'en-ar': {
      'hello': 'مرحبا',
      'hi': 'مرحبا',
      'world': 'عالم',
      'thank you': 'شكرا',
      'thanks': 'شكرا',
      'please': 'من فضلك',
      'yes': 'نعم',
      'no': 'لا',
      'good': 'جيد',
      'bad': 'سيء',
      'big': 'كبير',
      'small': 'صغير',
      'water': 'ماء',
      'food': 'طعام',
      'house': 'منزل',
      'car': 'سيارة',
      'book': 'كتاب',
      'time': 'وقت',
      'day': 'يوم',
      'night': 'ليل',
      'man': 'رجل',
      'woman': 'امرأة',
      'child': 'طفل',
      'love': 'حب',
      'peace': 'سلام',
      'friend': 'صديق',
      'family': 'عائلة',
      'work': 'عمل',
      'money': 'مال',
      'help': 'مساعدة',
      'sorry': 'آسف',
      'excuse me': 'عذرا',
      'goodbye': 'مع السلامة',
      'see you later': 'أراك لاحقا',
      'how are you': 'كيف حالك',
      'what is your name': 'ما اسمك',
      'nice to meet you': 'سررت بلقائك',
      'i love you': 'أحبك',
      'can you help me': 'هل يمكنك مساعدتي',
      'where is': 'أين',
      'how much': 'كم',
      'what time': 'كم الساعة'
    },
    'ar-en': {
      'مرحبا': 'hello',
      'عالم': 'world',
      'شكرا': 'thank you',
      'من فضلك': 'please',
      'نعم': 'yes',
      'لا': 'no',
      'جيد': 'good',
      'سيء': 'bad',
      'كبير': 'big',
      'صغير': 'small',
      'ماء': 'water',
      'طعام': 'food',
      'منزل': 'house',
      'سيارة': 'car',
      'كتاب': 'book',
      'وقت': 'time',
      'يوم': 'day',
      'ليل': 'night',
      'رجل': 'man',
      'امرأة': 'woman',
      'طفل': 'child',
      'حب': 'love',
      'سلام': 'peace',
      'صديق': 'friend',
      'عائلة': 'family',
      'عمل': 'work',
      'مال': 'money',
      'مساعدة': 'help',
      'آسف': 'sorry',
      'عذرا': 'excuse me',
      'مع السلامة': 'goodbye',
      'أراك لاحقا': 'see you later',
      'كيف حالك': 'how are you',
      'ما اسمك': 'what is your name',
      'سررت بلقائك': 'nice to meet you',
      'أحبك': 'i love you',
      'هل يمكنك مساعدتي': 'can you help me',
      'أين': 'where is',
      'كم': 'how much',
      'كم الساعة': 'what time'
    },
    'en-es': {
      'hello': 'hola',
      'hi': 'hola',
      'world': 'mundo',
      'thank you': 'gracias',
      'thanks': 'gracias',
      'please': 'por favor',
      'yes': 'sí',
      'no': 'no',
      'good': 'bueno',
      'bad': 'malo',
      'big': 'grande',
      'small': 'pequeño',
      'water': 'agua',
      'food': 'comida',
      'house': 'casa',
      'car': 'coche',
      'book': 'libro',
      'time': 'tiempo',
      'day': 'día',
      'night': 'noche',
      'man': 'hombre',
      'woman': 'mujer',
      'child': 'niño',
      'love': 'amor',
      'peace': 'paz',
      'friend': 'amigo',
      'family': 'familia',
      'work': 'trabajo',
      'money': 'dinero',
      'help': 'ayuda',
      'sorry': 'lo siento',
      'excuse me': 'disculpe',
      'goodbye': 'adiós',
      'see you later': 'hasta luego',
      'how are you': 'cómo estás',
      'what is your name': 'cómo te llamas',
      'nice to meet you': 'mucho gusto',
      'i love you': 'te amo',
      'can you help me': 'puedes ayudarme',
      'where is': 'dónde está',
      'how much': 'cuánto cuesta',
      'what time': 'qué hora es'
    },
    'es-en': {
      'hola': 'hello',
      'mundo': 'world',
      'gracias': 'thank you',
      'por favor': 'please',
      'sí': 'yes',
      'no': 'no',
      'bueno': 'good',
      'malo': 'bad',
      'grande': 'big',
      'pequeño': 'small',
      'agua': 'water',
      'comida': 'food',
      'casa': 'house',
      'coche': 'car',
      'libro': 'book',
      'tiempo': 'time',
      'día': 'day',
      'noche': 'night',
      'hombre': 'man',
      'mujer': 'woman',
      'niño': 'child',
      'amor': 'love',
      'paz': 'peace',
      'amigo': 'friend',
      'familia': 'family',
      'trabajo': 'work',
      'dinero': 'money',
      'ayuda': 'help',
      'lo siento': 'sorry',
      'disculpe': 'excuse me',
      'adiós': 'goodbye',
      'hasta luego': 'see you later',
      'cómo estás': 'how are you',
      'cómo te llamas': 'what is your name',
      'mucho gusto': 'nice to meet you',
      'te amo': 'i love you',
      'puedes ayudarme': 'can you help me',
      'dónde está': 'where is',
      'cuánto cuesta': 'how much',
      'qué hora es': 'what time'
    },
    'en-fr': {
      'hello': 'bonjour',
      'hi': 'salut',
      'world': 'monde',
      'thank you': 'merci',
      'thanks': 'merci',
      'please': 's\'il vous plaît',
      'yes': 'oui',
      'no': 'non',
      'good': 'bon',
      'bad': 'mauvais',
      'big': 'grand',
      'small': 'petit',
      'water': 'eau',
      'food': 'nourriture',
      'house': 'maison',
      'car': 'voiture',
      'book': 'livre',
      'time': 'temps',
      'day': 'jour',
      'night': 'nuit',
      'man': 'homme',
      'woman': 'femme',
      'child': 'enfant',
      'love': 'amour',
      'peace': 'paix',
      'friend': 'ami',
      'family': 'famille',
      'work': 'travail',
      'money': 'argent',
      'help': 'aide',
      'sorry': 'désolé',
      'excuse me': 'excusez-moi',
      'goodbye': 'au revoir',
      'see you later': 'à bientôt',
      'how are you': 'comment allez-vous',
      'what is your name': 'comment vous appelez-vous',
      'nice to meet you': 'ravi de vous rencontrer',
      'i love you': 'je t\'aime',
      'can you help me': 'pouvez-vous m\'aider',
      'where is': 'où est',
      'how much': 'combien',
      'what time': 'quelle heure'
    },
    'fr-en': {
      'bonjour': 'hello',
      'salut': 'hi',
      'monde': 'world',
      'merci': 'thank you',
      's\'il vous plaît': 'please',
      'oui': 'yes',
      'non': 'no',
      'bon': 'good',
      'mauvais': 'bad',
      'grand': 'big',
      'petit': 'small',
      'eau': 'water',
      'nourriture': 'food',
      'maison': 'house',
      'voiture': 'car',
      'livre': 'book',
      'temps': 'time',
      'jour': 'day',
      'nuit': 'night',
      'homme': 'man',
      'femme': 'woman',
      'enfant': 'child',
      'amour': 'love',
      'paix': 'peace',
      'ami': 'friend',
      'famille': 'family',
      'travail': 'work',
      'argent': 'money',
      'aide': 'help',
      'désolé': 'sorry',
      'excusez-moi': 'excuse me',
      'au revoir': 'goodbye',
      'à bientôt': 'see you later',
      'comment allez-vous': 'how are you',
      'comment vous appelez-vous': 'what is your name',
      'ravi de vous rencontrer': 'nice to meet you',
      'je t\'aime': 'i love you',
      'pouvez-vous m\'aider': 'can you help me',
      'où est': 'where is',
      'combien': 'how much',
      'quelle heure': 'what time'
    },
    'en-de': {
      'hello': 'hallo',
      'hi': 'hi',
      'world': 'welt',
      'thank you': 'danke',
      'thanks': 'danke',
      'please': 'bitte',
      'yes': 'ja',
      'no': 'nein',
      'good': 'gut',
      'bad': 'schlecht',
      'big': 'groß',
      'small': 'klein',
      'water': 'wasser',
      'food': 'essen',
      'house': 'haus',
      'car': 'auto',
      'book': 'buch',
      'time': 'zeit',
      'day': 'tag',
      'night': 'nacht',
      'man': 'mann',
      'woman': 'frau',
      'child': 'kind',
      'love': 'liebe',
      'peace': 'frieden',
      'friend': 'freund',
      'family': 'familie',
      'work': 'arbeit',
      'money': 'geld',
      'help': 'hilfe',
      'sorry': 'entschuldigung',
      'excuse me': 'entschuldigen sie',
      'goodbye': 'auf wiedersehen',
      'see you later': 'bis später',
      'how are you': 'wie geht es dir',
      'what is your name': 'wie heißt du',
      'nice to meet you': 'freut mich',
      'i love you': 'ich liebe dich',
      'can you help me': 'können sie mir helfen',
      'where is': 'wo ist',
      'how much': 'wie viel',
      'what time': 'wie spät ist es'
    },
    'de-en': {
      'hallo': 'hello',
      'hi': 'hi',
      'welt': 'world',
      'danke': 'thank you',
      'bitte': 'please',
      'ja': 'yes',
      'nein': 'no',
      'gut': 'good',
      'schlecht': 'bad',
      'groß': 'big',
      'klein': 'small',
      'wasser': 'water',
      'essen': 'food',
      'haus': 'house',
      'auto': 'car',
      'buch': 'book',
      'zeit': 'time',
      'tag': 'day',
      'nacht': 'night',
      'mann': 'man',
      'frau': 'woman',
      'kind': 'child',
      'liebe': 'love',
      'frieden': 'peace',
      'freund': 'friend',
      'familie': 'family',
      'arbeit': 'work',
      'geld': 'money',
      'hilfe': 'help',
      'entschuldigung': 'sorry',
      'entschuldigen sie': 'excuse me',
      'auf wiedersehen': 'goodbye',
      'bis später': 'see you later',
      'wie geht es dir': 'how are you',
      'wie heißt du': 'what is your name',
      'freut mich': 'nice to meet you',
      'ich liebe dich': 'i love you',
      'können sie mir helfen': 'can you help me',
      'wo ist': 'where is',
      'wie viel': 'how much',
      'wie spät ist es': 'what time'
    },
    'en-ru': {
      'hello': 'привет',
      'hi': 'привет',
      'world': 'мир',
      'thank you': 'спасибо',
      'thanks': 'спасибо',
      'please': 'пожалуйста',
      'yes': 'да',
      'no': 'нет',
      'good': 'хорошо',
      'bad': 'плохо',
      'big': 'большой',
      'small': 'маленький',
      'water': 'вода',
      'food': 'еда',
      'house': 'дом',
      'car': 'машина',
      'book': 'книга',
      'time': 'время',
      'day': 'день',
      'night': 'ночь',
      'man': 'мужчина',
      'woman': 'женщина',
      'child': 'ребёнок',
      'love': 'любовь',
      'peace': 'мир',
      'friend': 'друг',
      'family': 'семья',
      'work': 'работа',
      'money': 'деньги',
      'help': 'помощь',
      'sorry': 'извините',
      'excuse me': 'извините',
      'goodbye': 'до свидания',
      'see you later': 'увидимся позже',
      'how are you': 'как дела',
      'what is your name': 'как вас зовут',
      'nice to meet you': 'приятно познакомиться',
      'i love you': 'я люблю тебя',
      'can you help me': 'можете мне помочь',
      'where is': 'где находится',
      'how much': 'сколько стоит',
      'what time': 'который час',
      'who are you': 'кто ты'
    },
    'ru-en': {
      'привет': 'hello',
      'мир': 'world',
      'спасибо': 'thank you',
      'пожалуйста': 'please',
      'да': 'yes',
      'нет': 'no',
      'хорошо': 'good',
      'плохо': 'bad',
      'большой': 'big',
      'маленький': 'small',
      'вода': 'water',
      'еда': 'food',
      'дом': 'house',
      'машина': 'car',
      'книга': 'book',
      'время': 'time',
      'день': 'day',
      'ночь': 'night',
      'мужчина': 'man',
      'женщина': 'woman',
      'ребёнок': 'child',
      'любовь': 'love',
      'друг': 'friend',
      'семья': 'family',
      'работа': 'work',
      'деньги': 'money',
      'помощь': 'help',
      'извините': 'sorry',
      'до свидания': 'goodbye',
      'увидимся позже': 'see you later',
      'как дела': 'how are you',
      'как вас зовут': 'what is your name',
      'приятно познакомиться': 'nice to meet you',
      'я люблю тебя': 'i love you',
      'можете мне помочь': 'can you help me',
      'где находится': 'where is',
      'сколько стоит': 'how much',
      'который час': 'what time',
      'кто ты': 'who are you'
    }
  };
  
  const translationKey = `${source}-${target}`;
  const translations = commonTranslations[translationKey];
  
  if (!translations) {
    // Return a message indicating translation not supported
    return `Translation from ${source} to ${target} is not currently supported. Available language pairs: ${Object.keys(commonTranslations).join(', ')}`;
  }
  
  let translatedText = text.toLowerCase().trim();
  let hasTranslation = false;
  
  // First try exact phrase matches (longer phrases first)
  const sortedPhrases = Object.keys(translations).sort((a, b) => b.length - a.length);
  
  for (const originalPhrase of sortedPhrases) {
    const regex = new RegExp(`\\b${originalPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(translatedText)) {
      translatedText = translatedText.replace(regex, translations[originalPhrase]);
      hasTranslation = true;
    }
  }
  
  // If no translations found, return original with note
  if (!hasTranslation) {
    return `${text} (Note: Exact translation not available in dictionary. Please try simpler words like: hello, thank you, yes, no, good, help)`;
  }
  
  return translatedText;
}

async function assessTranslationQuality(
  source: string, 
  translation: string, 
  sourceLang: string, 
  targetLang: string
) {
  // Simplified quality assessment
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for potential issues
  if (translation.includes('[') && translation.includes(']')) {
    issues.push('Translation may be incomplete or placeholder text detected');
    suggestions.push('Try rephrasing the source text or check if the language pair is supported');
  }
  
  if (source.length > translation.length * 2) {
    issues.push('Translation appears significantly shorter than source text');
    suggestions.push('Review translation for completeness');
  }
  
  if (translation.toLowerCase() === source.toLowerCase()) {
    issues.push('Translation appears identical to source text');
    suggestions.push('Verify language selection or try alternative phrasing');
  }
  
  // Calculate quality score
  let score = 85; // Base score
  score -= issues.length * 15;
  score = Math.max(10, Math.min(100, score));
  
  return {
    score,
    confidence: score / 100,
    issues,
    suggestions: suggestions.slice(0, 3)
  };
}

async function generateTranslationSuggestions(
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  const suggestions: any[] = [];
  
  // Generate alternative translations
  if (source.length < 50) { // For short texts
    suggestions.push({
      text: `Alternative: ${translation} (formal)`,
      type: 'style',
      confidence: 0.8
    });
    
    suggestions.push({
      text: `Casual: ${translation.toLowerCase()}`,
      type: 'style',
      confidence: 0.7
    });
  }
  
  // Grammar suggestions
  if (translation.includes('  ')) { // Double spaces
    suggestions.push({
      text: 'Remove extra spaces for better formatting',
      type: 'grammar',
      confidence: 0.9
    });
  }
  
  // Context suggestions
  suggestions.push({
    text: 'Add context hint for more accurate translation',
    type: 'context',
    confidence: 0.6
  });
  
  return suggestions.slice(0, 5);
}

function detectTextContext(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('function') || lowerText.includes('class') || lowerText.includes('import')) {
    return 'technical';
  }
  if (lowerText.includes('patient') || lowerText.includes('diagnosis') || lowerText.includes('treatment')) {
    return 'medical';
  }
  if (lowerText.includes('contract') || lowerText.includes('agreement') || lowerText.includes('terms')) {
    return 'legal';
  }
  if (lowerText.includes('revenue') || lowerText.includes('profit') || lowerText.includes('business')) {
    return 'business';
  }
  if (lowerText.includes('hello') || lowerText.includes('how are you') || lowerText.includes('nice to meet')) {
    return 'casual';
  }
  
  return 'general';
}

function calculateTranslationConfidence(
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): number {
  let confidence = 0.7; // Base confidence
  
  // Adjust based on language pair commonality
  const commonPairs = ['en-es', 'en-fr', 'en-de', 'es-en', 'fr-en', 'de-en'];
  if (commonPairs.includes(`${sourceLang}-${targetLang}`)) {
    confidence += 0.2;
  }
  
  // Adjust based on text length
  if (source.length < 10) {
    confidence += 0.1; // Short texts are generally more reliable
  } else if (source.length > 500) {
    confidence -= 0.1; // Long texts may have more complexity
  }
  
  return Math.min(0.95, Math.max(0.1, confidence));
}

function preserveTechnicalTerms(text: string): string {
  // Preserve common technical terms
  const technicalTerms = ['function', 'class', 'import', 'export', 'const', 'let', 'var', 'API', 'HTTP', 'JSON', 'SQL'];
  let preservedText = text;
  
  technicalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    preservedText = preservedText.replace(regex, `<PRESERVE>${term}</PRESERVE>`);
  });
  
  return preservedText;
}

function preserveMedicalTerms(text: string): string {
  const medicalTerms = ['diagnosis', 'treatment', 'patient', 'symptoms', 'medication', 'therapy'];
  let preservedText = text;
  
  medicalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    preservedText = preservedText.replace(regex, `<PRESERVE>${term}</PRESERVE>`);
  });
  
  return preservedText;
}

function preserveLegalTerms(text: string): string {
  const legalTerms = ['contract', 'agreement', 'terms', 'conditions', 'liability', 'jurisdiction'];
  let preservedText = text;
  
  legalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    preservedText = preservedText.replace(regex, `<PRESERVE>${term}</PRESERVE>`);
  });
  
  return preservedText;
}

function preserveBusinessTerms(text: string): string {
  const businessTerms = ['revenue', 'profit', 'ROI', 'KPI', 'stakeholder', 'deliverable'];
  let preservedText = text;
  
  businessTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    preservedText = preservedText.replace(regex, `<PRESERVE>${term}</PRESERVE>`);
  });
  
  return preservedText;
}