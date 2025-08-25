import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, source, target } = await request.json();

    if (!text || !source || !target) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: text, source, target' },
        { status: 400 }
      );
    }

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
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      translatedText: data.translatedText,
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Translation failed' 
      },
      { status: 500 }
    );
  }
}