import type { Language } from '@/types';

export const supportedLanguages: Language[] = [
  { code: 'en-US', name: 'English', voice: 'Algenib' },
  { code: 'hi-IN', name: 'Hindi', voice: 'sadachbia' },
  { code: 'mr-IN', name: 'Marathi', voice: 'schedar' },
  { code: 'bn-IN', name: 'Bengali', voice: 'rasalgethi' },
  { code: 'es-ES', name: 'Spanish', voice: 'gacrux' },
  { code: 'fr-FR', name: 'French', voice: 'achernar' },
  { code: 'de-DE', name: 'German', voice: 'achird' },
  { code: 'it-IT', name: 'Italian', voice: 'algieba' },
  { code: 'pt-BR', name: 'Portuguese', voice: 'alnilam' },
  { code: 'ru-RU', name: 'Russian', voice: 'autonoe' },
  { code: 'ja-JP', name: 'Japanese', voice: 'charon' },
  { code: 'ko-KR', name: 'Korean', voice: 'despina' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', voice: 'enceladus' },
];

export const findLanguageByCode = (code: string): Language | undefined =>
  supportedLanguages.find((lang) => lang.code === code);
