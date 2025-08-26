import { NextRequest, NextResponse } from 'next/server';

// AI-powered translation quality analysis
export async function POST(request: NextRequest) {
  try {
    const { source, translation, sourceLang, targetLang } = await request.json();

    if (!source || !translation || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Source, translation, and language parameters are required' },
        { status: 400 }
      );
    }

    const qualityAnalysis = await analyzeTranslationQuality(source, translation, sourceLang, targetLang);
    
    return NextResponse.json(qualityAnalysis);

  } catch (error) {
    console.error('Translation analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze translation quality' },
      { status: 500 }
    );
  }
}

async function analyzeTranslationQuality(
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
) {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 90; // Start with high score
  
  // Length analysis
  const lengthRatio = translation.length / source.length;
  if (lengthRatio < 0.3) {
    issues.push('Translation appears too short compared to source text');
    suggestions.push('Review for missing content or consider expanding translation');
    score -= 20;
  } else if (lengthRatio > 3) {
    issues.push('Translation appears unusually long compared to source text');
    suggestions.push('Review for unnecessary verbosity or redundancy');
    score -= 10;
  }
  
  // Identical text check
  if (source.toLowerCase().trim() === translation.toLowerCase().trim()) {
    issues.push('Translation is identical to source text');
    suggestions.push('Verify language pair selection or check if text needs translation');
    score -= 30;
  }
  
  // Placeholder detection
  if (translation.includes('[') || translation.includes('{{') || translation.includes('PLACEHOLDER')) {
    issues.push('Translation contains placeholder text');
    suggestions.push('Complete the translation by replacing placeholder content');
    score -= 25;
  }
  
  // Language-specific checks
  if (sourceLang === 'en' && targetLang === 'ar') {
    if (!/[\u0600-\u06FF]/.test(translation)) {
      issues.push('Arabic translation does not contain Arabic script');
      suggestions.push('Ensure proper Arabic characters are used');
      score -= 20;
    }
  }
  
  if (sourceLang === 'ar' && targetLang === 'en') {
    if (/[\u0600-\u06FF]/.test(translation)) {
      issues.push('English translation contains Arabic characters');
      suggestions.push('Remove Arabic script from English translation');
      score -= 15;
    }
  }
  
  // Formatting preservation
  const sourceLines = source.split('\n').length;
  const translationLines = translation.split('\n').length;
  if (Math.abs(sourceLines - translationLines) > 2 && sourceLines > 3) {
    issues.push('Line structure differs significantly from source');
    suggestions.push('Consider preserving paragraph structure');
    score -= 5;
  }
  
  // Capitalization analysis
  const sourceCapitalWords = (source.match(/[A-Z][a-z]+/g) || []).length;
  const translationCapitalWords = (translation.match(/[A-Z][a-z]+/g) || []).length;
  if (sourceCapitalWords > 2 && translationCapitalWords === 0) {
    issues.push('Translation may be missing proper capitalization');
    suggestions.push('Review capitalization of proper nouns and sentence beginnings');
    score -= 5;
  }
  
  // Punctuation analysis
  const sourcePunctuation = (source.match(/[.!?;:,]/g) || []).length;
  const translationPunctuation = (translation.match(/[.!?;:,]/g) || []).length;
  if (sourcePunctuation > 0 && Math.abs(sourcePunctuation - translationPunctuation) > sourcePunctuation * 0.5) {
    issues.push('Punctuation pattern differs significantly from source');
    suggestions.push('Review punctuation usage and sentence structure');
    score -= 5;
  }
  
  // Technical term preservation
  const technicalTerms = ['API', 'HTTP', 'JSON', 'SQL', 'CSS', 'HTML', 'XML', 'URL', 'UUID'];
  const sourceTechnical = technicalTerms.filter(term => 
    source.toUpperCase().includes(term)
  );
  const translationTechnical = technicalTerms.filter(term => 
    translation.toUpperCase().includes(term)
  );
  
  if (sourceTechnical.length > translationTechnical.length) {
    issues.push('Technical terms may have been translated incorrectly');
    suggestions.push('Preserve technical terminology in translations');
    score -= 10;
  }
  
  // Numbers preservation
  const sourceNumbers = source.match(/\b\d+(?:\.\d+)?\b/g) || [];
  const translationNumbers = translation.match(/\b\d+(?:\.\d+)?\b/g) || [];
  if (sourceNumbers.length !== translationNumbers.length) {
    issues.push('Numeric values may not be preserved correctly');
    suggestions.push('Ensure all numbers are accurately translated or preserved');
    score -= 10;
  }
  
  // Context appropriateness
  const confidence = calculateConfidence(source, translation, sourceLang, targetLang);
  
  // Final score adjustment
  score = Math.max(10, Math.min(100, score));
  
  return {
    score,
    confidence,
    issues,
    suggestions: suggestions.slice(0, 5), // Limit to top 5 suggestions
    metrics: {
      lengthRatio,
      wordCount: {
        source: source.split(/\s+/).length,
        translation: translation.split(/\s+/).length
      },
      complexity: assessComplexity(source),
      readability: assessReadability(translation)
    }
  };
}

function calculateConfidence(
  source: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): number {
  let confidence = 0.7;
  
  // Language pair confidence
  const highConfidencePairs = ['en-es', 'en-fr', 'en-de', 'es-en', 'fr-en', 'de-en'];
  const mediumConfidencePairs = ['en-ar', 'ar-en', 'en-zh', 'zh-en'];
  
  const langPair = `${sourceLang}-${targetLang}`;
  
  if (highConfidencePairs.includes(langPair)) {
    confidence += 0.2;
  } else if (mediumConfidencePairs.includes(langPair)) {
    confidence += 0.1;
  }
  
  // Length-based confidence
  if (source.length < 20) {
    confidence += 0.1; // Short texts are usually more reliable
  } else if (source.length > 1000) {
    confidence -= 0.1; // Very long texts may have issues
  }
  
  // Content-based confidence
  if (hasSpecializedContent(source)) {
    confidence -= 0.1; // Technical/specialized content is harder
  }
  
  return Math.min(0.95, Math.max(0.1, confidence));
}

function assessComplexity(text: string): 'low' | 'medium' | 'high' {
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const avgWordsPerSentence = words / sentences;
  
  const complexWords = text.split(/\s+/).filter(word => word.length > 6).length;
  const complexityRatio = complexWords / words;
  
  if (avgWordsPerSentence > 20 || complexityRatio > 0.3) {
    return 'high';
  } else if (avgWordsPerSentence > 12 || complexityRatio > 0.15) {
    return 'medium';
  } else {
    return 'low';
  }
}

function assessReadability(text: string): 'easy' | 'medium' | 'difficult' {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(w => w.trim().length > 0).length;
  
  if (sentences === 0 || words === 0) return 'medium';
  
  const avgWordsPerSentence = words / sentences;
  const avgCharsPerWord = text.replace(/\s+/g, '').length / words;
  
  // Simple readability estimation
  if (avgWordsPerSentence < 10 && avgCharsPerWord < 5) {
    return 'easy';
  } else if (avgWordsPerSentence > 20 || avgCharsPerWord > 7) {
    return 'difficult';
  } else {
    return 'medium';
  }
}

function hasSpecializedContent(text: string): boolean {
  const technicalTerms = ['function', 'class', 'import', 'const', 'var', 'API', 'HTTP', 'JSON'];
  const medicalTerms = ['patient', 'diagnosis', 'treatment', 'symptoms', 'medication'];
  const legalTerms = ['contract', 'agreement', 'terms', 'liability', 'jurisdiction'];
  
  const allSpecializedTerms = [...technicalTerms, ...medicalTerms, ...legalTerms];
  
  return allSpecializedTerms.some(term => 
    text.toLowerCase().includes(term.toLowerCase())
  );
}