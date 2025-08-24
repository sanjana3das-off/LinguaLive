export interface Language {
  code: string;
  name: string;
  voice: string;
}

export interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  audioDataUri: string | null;
  timestamp: number;
  error?: string;
}
