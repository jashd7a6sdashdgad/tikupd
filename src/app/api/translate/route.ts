import { NextRequest, NextResponse } from 'next/server';

interface TranslationRequest {
  text: string;
  source: string;
  target: string;
}

interface TranslationDatabase {
  [key: string]: {
    [language: string]: string;
  };
}

// Comprehensive translation database optimized for travel
const translations: TranslationDatabase = {
  // Basic Greetings
  'hello': {
    ar: 'مرحبا', es: 'hola', fr: 'bonjour', de: 'hallo', it: 'ciao',
    pt: 'olá', ru: 'привет', ja: 'こんにちは', ko: '안녕하세요', zh: '你好',
    th: 'สวัสดี', hi: 'नमस्ते', tr: 'merhaba', pl: 'cześć', nl: 'hallo',
    da: 'hej', sv: 'hej', no: 'hei', fi: 'hei', cs: 'ahoj'
  },
  'goodbye': {
    ar: 'وداعا', es: 'adiós', fr: 'au revoir', de: 'auf wiedersehen', it: 'ciao',
    pt: 'tchau', ru: 'до свидания', ja: 'さようなら', ko: '안녕히 가세요', zh: '再见',
    th: 'ลาก่อน', hi: 'अलविदा', tr: 'güle güle', pl: 'do widzenia', nl: 'tot ziens'
  },
  'thank you': {
    ar: 'شكرا لك', es: 'gracias', fr: 'merci', de: 'danke', it: 'grazie',
    pt: 'obrigado', ru: 'спасибо', ja: 'ありがとう', ko: '감사합니다', zh: '谢谢',
    th: 'ขอบคุณ', hi: 'धन्यवाद', tr: 'teşekkür ederim', pl: 'dziękuję', nl: 'dank je'
  },
  'please': {
    ar: 'من فضلك', es: 'por favor', fr: 's\'il vous plaît', de: 'bitte', it: 'per favore',
    pt: 'por favor', ru: 'пожалуйста', ja: 'お願いします', ko: '제발', zh: '请',
    th: 'กรุณา', hi: 'कृपया', tr: 'lütfen', pl: 'proszę', nl: 'alsjeblieft'
  },
  'excuse me': {
    ar: 'عذراً', es: 'disculpe', fr: 'excusez-moi', de: 'entschuldigung', it: 'scusi',
    pt: 'com licença', ru: 'извините', ja: 'すみません', ko: '실례합니다', zh: '不好意思',
    th: 'ขอโทษ', hi: 'माफ करें', tr: 'özür dilerim', pl: 'przepraszam', nl: 'excuseer me'
  },
  'sorry': {
    ar: 'آسف', es: 'lo siento', fr: 'désolé', de: 'entschuldigung', it: 'mi dispiace',
    pt: 'desculpe', ru: 'извините', ja: 'ごめんなさい', ko: '죄송합니다', zh: '对不起',
    th: 'ขอโทษ', hi: 'माफ करना', tr: 'üzgünüm', pl: 'przepraszam', nl: 'sorry'
  },
  'good morning': {
    ar: 'صباح الخير', es: 'buenos días', fr: 'bonjour', de: 'guten morgen', it: 'buongiorno',
    pt: 'bom dia', ru: 'доброе утро', ja: 'おはよう', ko: '좋은 아침', zh: '早上好',
    th: 'สวัสดีตอนเช้า', hi: 'शुभ प्रभात', tr: 'günaydın', pl: 'dzień dobry', nl: 'goedemorgen'
  },
  'good evening': {
    ar: 'مساء الخير', es: 'buenas tardes', fr: 'bonsoir', de: 'guten abend', it: 'buonasera',
    pt: 'boa tarde', ru: 'добрый вечер', ja: 'こんばんは', ko: '좋은 저녁', zh: '晚上好',
    th: 'สวัสดีตอนเย็น', hi: 'शुभ संध्या', tr: 'iyi akşamlar', pl: 'dobry wieczór', nl: 'goedenavond'
  },
  'yes': {
    ar: 'نعم', es: 'sí', fr: 'oui', de: 'ja', it: 'sì',
    pt: 'sim', ru: 'да', ja: 'はい', ko: '네', zh: '是',
    th: 'ใช่', hi: 'हाँ', tr: 'evet', pl: 'tak', nl: 'ja'
  },
  'no': {
    ar: 'لا', es: 'no', fr: 'non', de: 'nein', it: 'no',
    pt: 'não', ru: 'нет', ja: 'いいえ', ko: '아니요', zh: '不',
    th: 'ไม่', hi: 'नहीं', tr: 'hayır', pl: 'nie', nl: 'nee'
  },

  // Travel Essentials
  'where is the airport?': {
    ar: 'أين المطار؟', es: '¿dónde está el aeropuerto?', fr: 'où est l\'aéroport?',
    de: 'wo ist der flughafen?', it: 'dov\'è l\'aeroporto?', pt: 'onde fica o aeroporto?',
    ru: 'где аэропорт?', ja: '空港はどこですか？', ko: '공항이 어디에 있나요?', zh: '机场在哪里？',
    th: 'สนามบินอยู่ที่ไหน?', hi: 'हवाई अड्डा कहाँ है?', tr: 'havaalanı nerede?'
  },
  'where is the hotel?': {
    ar: 'أين الفندق؟', es: '¿dónde está el hotel?', fr: 'où est l\'hôtel?',
    de: 'wo ist das hotel?', it: 'dov\'è l\'hotel?', pt: 'onde fica o hotel?',
    ru: 'где отель?', ja: 'ホテルはどこですか？', ko: '호텔이 어디에 있나요?', zh: '酒店在哪里？',
    th: 'โรงแรมอยู่ที่ไหน?', hi: 'होटल कहाँ है?', tr: 'otel nerede?'
  },
  'how much does this cost?': {
    ar: 'كم يكلف هذا؟', es: '¿cuánto cuesta esto?', fr: 'combien ça coûte?',
    de: 'wie viel kostet das?', it: 'quanto costa?', pt: 'quanto custa isto?',
    ru: 'сколько это стоит?', ja: 'これはいくらですか？', ko: '이것은 얼마입니까?', zh: '这个多少钱？',
    th: 'นี่ราคาเท่าไหร่?', hi: 'यह कितना खर्च करता है?', tr: 'bu ne kadar?'
  },
  'i need help': {
    ar: 'أحتاج المساعدة', es: 'necesito ayuda', fr: 'j\'ai besoin d\'aide',
    de: 'ich brauche hilfe', it: 'ho bisogno di aiuto', pt: 'preciso de ajuda',
    ru: 'мне нужна помощь', ja: '助けが必要です', ko: '도움이 필요합니다', zh: '我需要帮助',
    th: 'ฉันต้องการความช่วยเหลือ', hi: 'मुझे मदद चाहिए', tr: 'yardıma ihtiyacım var'
  },
  'do you speak english?': {
    ar: 'هل تتحدث الإنجليزية؟', es: '¿hablas inglés?', fr: 'parlez-vous anglais?',
    de: 'sprechen sie englisch?', it: 'parli inglese?', pt: 'você fala inglês?',
    ru: 'вы говорите по-английски?', ja: '英語を話しますか？', ko: '영어를 할 수 있나요?', zh: '你会说英语吗？',
    th: 'คุณพูดภาษาอังกฤษได้ไหม?', hi: 'क्या आप अंग्रेजी बोलते हैं?', tr: 'İngilizce biliyor musunuz?'
  },
  'i don\'t understand': {
    ar: 'لا أفهم', es: 'no entiendo', fr: 'je ne comprends pas',
    de: 'ich verstehe nicht', it: 'non capisco', pt: 'não entendo',
    ru: 'я не понимаю', ja: 'わかりません', ko: '이해하지 못합니다', zh: '我不明白',
    th: 'ฉันไม่เข้าใจ', hi: 'मैं समझ नहीं पा रहा', tr: 'anlamıyorum'
  },
  'where is the bathroom?': {
    ar: 'أين الحمام؟', es: '¿dónde está el baño?', fr: 'où sont les toilettes?',
    de: 'wo ist die toilette?', it: 'dov\'è il bagno?', pt: 'onde fica o banheiro?',
    ru: 'где туалет?', ja: 'トイレはどこですか？', ko: '화장실이 어디에 있나요?', zh: '厕所在哪里？',
    th: 'ห้องน้ำอยู่ที่ไหน?', hi: 'बाथरूम कहाँ है?', tr: 'tuvalet nerede?'
  },
  'how do i get to...?': {
    ar: 'كيف أصل إلى...؟', es: '¿cómo llego a...?', fr: 'comment aller à...?',
    de: 'wie komme ich zu...?', it: 'come arrivo a...?', pt: 'como chego a...?',
    ru: 'как добраться до...?', ja: '...への行き方は？', ko: '...에 어떻게 가나요?', zh: '我怎么去...？',
    th: 'ฉันจะไปที่...ได้อย่างไร?', hi: 'मैं...कैसे पहुंचूं?', tr: '...\'e nasıl giderim?'
  },
  'what time is it?': {
    ar: 'كم الساعة؟', es: '¿qué hora es?', fr: 'quelle heure est-il?',
    de: 'wie spät ist es?', it: 'che ore sono?', pt: 'que horas são?',
    ru: 'который час?', ja: '何時ですか？', ko: '몇 시입니까?', zh: '现在几点？',
    th: 'กี่โมงแล้ว?', hi: 'समय क्या है?', tr: 'saat kaç?'
  },
  'i would like...': {
    ar: 'أريد...', es: 'me gustaría...', fr: 'je voudrais...',
    de: 'ich hätte gern...', it: 'vorrei...', pt: 'eu gostaria...',
    ru: 'я хотел бы...', ja: '...をお願いします', ko: '...을 원합니다', zh: '我想要...',
    th: 'ฉันต้องการ...', hi: 'मैं चाहूंगा...', tr: '...istiyorum'
  },
  'can you help me?': {
    ar: 'هل يمكنك مساعدتي؟', es: '¿puedes ayudarme?', fr: 'pouvez-vous m\'aider?',
    de: 'können sie mir helfen?', it: 'puoi aiutarmi?', pt: 'você pode me ajudar?',
    ru: 'можете ли вы мне помочь?', ja: '助けてもらえますか？', ko: '도와주실 수 있나요?', zh: '你能帮助我吗？',
    th: 'คุณช่วยฉันได้ไหม?', hi: 'क्या आप मेरी मदद कर सकते हैं?', tr: 'bana yardım edebilir misiniz?'
  },

  // Food & Dining
  'menu': {
    ar: 'قائمة الطعام', es: 'menú', fr: 'menu', de: 'speisekarte', it: 'menu',
    pt: 'cardápio', ru: 'меню', ja: 'メニュー', ko: '메뉴', zh: '菜单',
    th: 'เมนู', hi: 'मेनू', tr: 'menü'
  },
  'water': {
    ar: 'ماء', es: 'agua', fr: 'eau', de: 'wasser', it: 'acqua',
    pt: 'água', ru: 'вода', ja: '水', ko: '물', zh: '水',
    th: 'น้ำ', hi: 'पानी', tr: 'su'
  },
  'coffee': {
    ar: 'قهوة', es: 'café', fr: 'café', de: 'kaffee', it: 'caffè',
    pt: 'café', ru: 'кофе', ja: 'コーヒー', ko: '커피', zh: '咖啡',
    th: 'กาแฟ', hi: 'कॉफी', tr: 'kahve'
  },
  'tea': {
    ar: 'شاي', es: 'té', fr: 'thé', de: 'tee', it: 'tè',
    pt: 'chá', ru: 'чай', ja: 'お茶', ko: '차', zh: '茶',
    th: 'ชา', hi: 'चाय', tr: 'çay'
  },
  'beer': {
    ar: 'بيرة', es: 'cerveza', fr: 'bière', de: 'bier', it: 'birra',
    pt: 'cerveja', ru: 'пиво', ja: 'ビール', ko: '맥주', zh: '啤酒',
    th: 'เบียร์', hi: 'बीयर', tr: 'bira'
  },

  // Numbers
  'one': {
    ar: 'واحد', es: 'uno', fr: 'un', de: 'eins', it: 'uno',
    pt: 'um', ru: 'один', ja: '一', ko: '하나', zh: '一',
    th: 'หนึ่ง', hi: 'एक', tr: 'bir'
  },
  'two': {
    ar: 'اثنان', es: 'dos', fr: 'deux', de: 'zwei', it: 'due',
    pt: 'dois', ru: 'два', ja: '二', ko: '둘', zh: '二',
    th: 'สอง', hi: 'दो', tr: 'iki'
  },
  'three': {
    ar: 'ثلاثة', es: 'tres', fr: 'trois', de: 'drei', it: 'tre',
    pt: 'três', ru: 'три', ja: '三', ko: '셋', zh: '三',
    th: 'สาม', hi: 'तीन', tr: 'üç'
  }
};

// Smart text normalization for better matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?.!,]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize spaces
}

// Find translation with fuzzy matching
function findTranslation(text: string, targetLang: string): string | null {
  const normalized = normalizeText(text);
  
  // Direct match
  if (translations[normalized]?.[targetLang]) {
    return translations[normalized][targetLang];
  }
  
  // Try without articles and common words
  const withoutArticles = normalized
    .replace(/^(the|a|an|i|you|we|they|he|she|it)\s+/g, '')
    .replace(/\s+(the|a|an)$/g, '');
  
  if (translations[withoutArticles]?.[targetLang]) {
    return translations[withoutArticles][targetLang];
  }
  
  // Partial matches for phrases
  for (const [key, translations_obj] of Object.entries(translations)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      if (translations_obj[targetLang]) {
        return translations_obj[targetLang];
      }
    }
  }
  
  return null;
}

// Pattern-based translation for common structures
function patternTranslation(text: string, sourceLang: string, targetLang: string): string | null {
  const normalized = normalizeText(text);
  
  // "Where is..." pattern
  if (normalized.match(/where\s+is/)) {
    const whereIs = {
      es: '¿dónde está',
      fr: 'où est',
      de: 'wo ist',
      it: 'dov\'è',
      pt: 'onde fica',
      ru: 'где',
      ja: 'はどこですか',
      ko: '어디에 있나요',
      zh: '在哪里',
      ar: 'أين',
      hi: 'कहाँ है',
      tr: 'nerede'
    };
    return whereIs[targetLang] || null;
  }
  
  // "How much..." pattern
  if (normalized.match(/how\s+much/)) {
    const howMuch = {
      es: '¿cuánto',
      fr: 'combien',
      de: 'wie viel',
      it: 'quanto',
      pt: 'quanto',
      ru: 'сколько',
      ja: 'いくら',
      ko: '얼마',
      zh: '多少',
      ar: 'كم',
      hi: 'कितना',
      tr: 'ne kadar'
    };
    return howMuch[targetLang] || null;
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslationRequest = await request.json();
    const { text, source, target } = body;
    
    if (!text || !source || !target) {
      return NextResponse.json(
        { error: 'Missing required fields: text, source, target' },
        { status: 400 }
      );
    }
    
    // Find direct translation
    let translation = findTranslation(text, target);
    
    // Try pattern-based translation if direct fails
    if (!translation) {
      translation = patternTranslation(text, source, target);
    }
    
    if (translation) {
      return NextResponse.json({
        translatedText: translation,
        source: source,
        target: target,
        confidence: 1.0,
        method: 'local_database'
      });
    }
    
    // If no translation found, return a helpful message
    return NextResponse.json({
      translatedText: `[Translation for "${text}" to ${target} not available in offline database]`,
      source: source,
      target: target,
      confidence: 0.0,
      method: 'fallback'
    });
    
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Lightweight Translation API for Vercel',
    version: '1.0.0',
    supportedLanguages: ['ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'th', 'hi', 'tr', 'pl', 'nl', 'da', 'sv', 'no', 'fi', 'cs'],
    totalPhrases: Object.keys(translations).length
  });
}