import { NextRequest, NextResponse } from 'next/server';

// Simple translation API (in production, you would use Google Translate, DeepL, etc.)
export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !from || !to) {
      return NextResponse.json(
        { error: 'Text, from, and to parameters are required' },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json({ translatedText: text });
    }

    // For demonstration, we'll use a simple word replacement approach
    // In production, you would call a real translation service
    const translatedText = await translateText(text, from, to);
    
    return NextResponse.json({ translatedText });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}

async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  // This is a very basic translation approach for demonstration
  // In production, you would use services like:
  // - Google Translate API
  // - Microsoft Translator
  // - DeepL API
  // - LibreTranslate
  
  const commonTranslations: { [key: string]: { [key: string]: string } } = {
    // Arabic to English
    'ar-en': {
      'طقس': 'weather',
      'مطر': 'rain',
      'شمس': 'sun',
      'بحث': 'search',
      'صور': 'images',
      'أماكن': 'places',
      'مطاعم': 'restaurants',
      'فنادق': 'hotels',
      'أخبار': 'news',
      'اليوم': 'today',
      'غداً': 'tomorrow',
      'الآن': 'now'
    },
    
    // Spanish to English
    'es-en': {
      'tiempo': 'weather',
      'lluvia': 'rain',
      'sol': 'sun',
      'buscar': 'search',
      'imágenes': 'images',
      'lugares': 'places',
      'restaurantes': 'restaurants',
      'hoteles': 'hotels',
      'noticias': 'news',
      'hoy': 'today',
      'mañana': 'tomorrow',
      'ahora': 'now'
    },
    
    // French to English
    'fr-en': {
      'temps': 'weather',
      'pluie': 'rain',
      'soleil': 'sun',
      'rechercher': 'search',
      'images': 'images',
      'lieux': 'places',
      'restaurants': 'restaurants',
      'hôtels': 'hotels',
      'nouvelles': 'news',
      'aujourd\'hui': 'today',
      'demain': 'tomorrow',
      'maintenant': 'now'
    },
    
    // German to English
    'de-en': {
      'wetter': 'weather',
      'regen': 'rain',
      'sonne': 'sun',
      'suchen': 'search',
      'bilder': 'images',
      'orte': 'places',
      'restaurants': 'restaurants',
      'hotels': 'hotels',
      'nachrichten': 'news',
      'heute': 'today',
      'morgen': 'tomorrow',
      'jetzt': 'now'
    }
  };
  
  const translationKey = `${fromLang}-${toLang}`;
  const translations = commonTranslations[translationKey];
  
  if (!translations) {
    // If we don't have translations for this language pair, return original text
    return text;
  }
  
  let translatedText = text.toLowerCase();
  
  // Replace known words
  for (const [originalWord, translatedWord] of Object.entries(translations)) {
    const regex = new RegExp(`\\b${originalWord}\\b`, 'gi');
    translatedText = translatedText.replace(regex, translatedWord);
  }
  
  return translatedText;
}