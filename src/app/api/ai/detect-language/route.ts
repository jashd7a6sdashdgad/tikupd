import { NextRequest, NextResponse } from 'next/server';

// Simple language detection based on character patterns
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const detectedLanguage = detectLanguageFromText(text);
    
    return NextResponse.json({ language: detectedLanguage });

  } catch (error) {
    console.error('Language detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect language' },
      { status: 500 }
    );
  }
}

function detectLanguageFromText(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Arabic detection
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ar';
  }
  
  // Chinese detection
  if (/[\u4e00-\u9fff]/.test(text)) {
    return 'zh';
  }
  
  // Japanese detection
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    return 'ja';
  }
  
  // Korean detection
  if (/[\uac00-\ud7af]/.test(text)) {
    return 'ko';
  }
  
  // Russian/Cyrillic detection
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru';
  }
  
  // Greek detection
  if (/[\u0370-\u03FF]/.test(text)) {
    return 'el';
  }
  
  // Hebrew detection
  if (/[\u0590-\u05FF]/.test(text)) {
    return 'he';
  }
  
  // Thai detection
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return 'th';
  }
  
  // Devanagari (Hindi) detection
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }
  
  // Common word patterns for European languages
  const patterns = [
    { lang: 'es', patterns: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'está', 'muy', 'todo', 'pero', 'más', 'hacer', 'él', 'qué', 'tiempo', 'hombre'] },
    { lang: 'fr', patterns: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'mais', 'comme', 'où', 'très'] },
    { lang: 'de', patterns: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie'] },
    { lang: 'it', patterns: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del', 'da', 'è', 'al', 'le', 'si', 'gli', 'una', 'dei', 'nel', 'alla', 'come', 'o', 'se', 'ci', 'questo', 'ma', 'più', 'sono', 'lo'] },
    { lang: 'pt', patterns: ['o', 'de', 'e', 'do', 'a', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu'] },
    { lang: 'nl', patterns: ['de', 'van', 'het', 'een', 'en', 'in', 'te', 'dat', 'op', 'is', 'voor', 'met', 'als', 'zijn', 'er', 'maar', 'om', 'door', 'over', 'ze', 'bij', 'kan', 'we', 'of', 'hebben', 'hij', 'niet', 'werd', 'haar'] },
    { lang: 'sv', patterns: ['och', 'i', 'att', 'det', 'som', 'på', 'de', 'av', 'för', 'är', 'den', 'till', 'en', 'med', 'var', 'sig', 'om', 'så', 'efter', 'men', 'kan', 'när', 'han', 'inte', 'skulle', 'här', 'än', 'bara', 'upp'] },
    { lang: 'da', patterns: ['og', 'i', 'af', 'til', 'det', 'på', 'med', 'en', 'der', 'som', 'de', 'for', 'var', 'er', 'den', 'at', 'havde', 'han', 'ikke', 'ved', 'har', 'du', 'om', 'så', 'fra', 'skulle', 'over', 'også', 'bare'] },
    { lang: 'no', patterns: ['og', 'i', 'det', 'av', 'en', 'til', 'på', 'er', 'som', 'for', 'med', 'han', 'de', 'at', 'den', 'var', 'ikke', 'har', 'seg', 'så', 'kan', 'men', 'når', 'hun', 'eller', 'om', 'fra', 'skulle', 'bare'] },
    { lang: 'fi', patterns: ['ja', 'on', 'että', 'se', 'ei', 'ole', 'hän', 'olla', 'kun', 'kaikki', 'sen', 'niin', 'vain', 'jos', 'mikä', 'sitten', 'tai', 'tämä', 'myös', 'minä', 'joka', 'voi', 'kuin', 'mutta', 'hänen', 'tulee'] },
    { lang: 'pl', patterns: ['i', 'w', 'na', 'z', 'nie', 'to', 'się', 'a', 'że', 'do', 'o', 'jak', 'ale', 'od', 'za', 'po', 'jest', 'by', 'go', 'te', 'co', 'ze', 'już', 'tylko', 'może', 'gdy', 'jego', 'dla', 'czy'] },
    { lang: 'cs', patterns: ['a', 'v', 'na', 'se', 'že', 'o', 'k', 's', 'z', 'do', 'je', 'to', 'jako', 'by', 'pro', 'od', 'po', 'i', 'za', 'u', 'si', 'ale', 'když', 'tak', 'nebo', 'co', 'jeho', 'již', 'který'] },
    { lang: 'hu', patterns: ['a', 'az', 'és', 'hogy', 'van', 'egy', 'nem', 'meg', 'el', 'de', 'ki', 'be', 'le', 'fel', 'át', 'ott', 'már', 'még', 'csak', 'is', 'volt', 'vele', 'neki', 'most', 'után', 'alatt', 'nélkül'] },
    { lang: 'ro', patterns: ['și', 'de', 'în', 'cu', 'la', 'pe', 'pentru', 'ca', 'este', 'sau', 'din', 'nu', 'se', 'o', 'un', 'ce', 'care', 'le', 'să', 'după', 'mai', 'să', 'fost', 'avea', 'sunt', 'fiind', 'foarte', 'mult'] },
    { lang: 'bg', patterns: ['и', 'в', 'на', 'се', 'е', 'за', 'с', 'от', 'да', 'не', 'до', 'по', 'са', 'или', 'като', 'една', 'един', 'при', 'има', 'би', 'ще', 'може', 'тази', 'този', 'така', 'много', 'само', 'още'] },
    { lang: 'hr', patterns: ['i', 'u', 'se', 'na', 'da', 'je', 'za', 'a', 's', 'to', 'su', 'od', 'do', 'kao', 'ne', 'ili', 'te', 'će', 'biti', 'bi', 'koja', 'koji', 'ta', 'tu', 'iz', 'nije', 'im', 'sve'] },
    { lang: 'sk', patterns: ['a', 'v', 'na', 'sa', 'že', 'o', 'do', 's', 'je', 'z', 'to', 'ako', 'by', 'pre', 'od', 'po', 'za', 'k', 'ale', 'keď', 'tak', 'už', 'len', 'aj', 'si', 'ma', 'ho', 'jeho', 'aby'] },
    { lang: 'sl', patterns: ['in', 'je', 'da', 'v', 'na', 'za', 's', 'se', 'z', 'ki', 'so', 'po', 'do', 'kot', 'o', 'ne', 'od', 'pri', 'bo', 'pa', 'lahko', 'tudi', 'le', 'ter', 'bi', 'ali', 'ima', 'te', 'samo'] }
  ];
  
  // Check for language patterns
  for (const { lang, patterns: langPatterns } of patterns) {
    const matches = langPatterns.filter(pattern => 
      new RegExp(`\\b${pattern}\\b`, 'i').test(text)
    ).length;
    
    if (matches >= 3) { // If we find at least 3 common words
      return lang;
    }
  }
  
  // Default to English
  return 'en';
}