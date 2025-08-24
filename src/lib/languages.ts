import type { Language } from '@/types';

export const supportedLanguages: Language[] = [
  { code: 'en-US', name: 'English', voice: 'Algenib' },
  { code: 'hi-IN', name: 'Hindi', voice: 'Antares' },
  { code: 'mr-IN', name: 'Marathi', voice: 'Canopus' },
  { code: 'bn-IN', name: 'Bengali', voice: 'Deneb' },
];

export const findLanguageByCode = (code: string): Language | undefined =>
  supportedLanguages.find((lang) => lang.code === code);
