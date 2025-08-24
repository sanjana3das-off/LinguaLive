'use client';

import { translateText } from '@/ai/flows/translate-text';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { findLanguageByCode, supportedLanguages } from '@/lib/languages';
import type { TranslationRecord } from '@/types';
import {
  ArrowRightLeft,
  History,
  Loader2,
  Mic,
  MicOff,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export function LinguaLive() {
  const { toast } = useToast();
  const [sourceLanguage, setSourceLanguage] = useState(
    supportedLanguages[0].code
  );
  const [targetLanguage, setTargetLanguage] = useState(
    supportedLanguages[1].code
  );
  const [history, setHistory] = useState<TranslationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition({ lang: sourceLanguage });

  // Persist and retrieve history from localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('linguaLiveHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to parse history from localStorage', error);
    }
    audioRef.current = new Audio();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('linguaLiveHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history to localStorage', error);
    }
  }, [history]);

  useEffect(() => {
    setCurrentTranscript(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!isListening && transcript) {
      handleTranslation(transcript);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  const handleTranslation = async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setTranslatedText('');

    try {
      const sourceLangName = findLanguageByCode(sourceLanguage)?.name;
      const targetLangName = findLanguageByCode(targetLanguage)?.name;
      
      if (!sourceLangName || !targetLangName) {
        throw new Error('Invalid language selection');
      }

      const translationResult = await translateText({
        text,
        sourceLanguage: sourceLangName,
        targetLanguage: targetLangName,
      });
      const finalTranslatedText = translationResult.translatedText;
      setTranslatedText(finalTranslatedText);

      const newRecord: TranslationRecord = {
        id: Date.now().toString(),
        sourceText: text,
        translatedText: finalTranslatedText,
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        audioDataUri: null,
        timestamp: Date.now(),
      };

      setHistory((prev) => [newRecord, ...prev].slice(0, 50)); // Keep last 50 records

    } catch (error) {
      console.error('Translation failed:', error);
      toast({
        title: 'Translation Error',
        description:
          'Could not translate the text. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    setCurrentTranscript('');
    setTranslatedText('');
  };

  const handleRecord = () => {
    if (isListening) {
      stopListening();
    } else {
      setCurrentTranscript('');
      setTranslatedText('');
      startListening();
    }
  };

  const playAudio = async (item: TranslationRecord) => {
    if (audioRef.current && isPlaying === item.id) {
      return;
    }
    
    if (audioRef.current && audioRef.current.src === item.audioDataUri && item.audioDataUri) {
      audioRef.current.play();
      return;
    }

    setIsPlaying(item.id);
    try {
      const targetLangVoice = findLanguageByCode(item.targetLanguage)?.voice;
      if (!targetLangVoice) throw new Error('Voice not found for language.');

      let audioData = item.audioDataUri;
      if (!audioData) {
        const ttsResult = await textToSpeech({
          text: item.translatedText,
          voice: targetLangVoice,
        });
        audioData = ttsResult.audio;
        setHistory(prev => prev.map(r => r.id === item.id ? {...r, audioDataUri: audioData} : r));
      }
      
      if (audioRef.current && audioData) {
        audioRef.current.src = audioData;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Automatic playback started!
            setIsPlaying(null);
          }).catch(error => {
            console.error("Playback failed", error);
            setIsPlaying(null);
          });
        }
         audioRef.current.onended = () => {
           setIsPlaying(null);
         };
      } else {
        setIsPlaying(null);
      }
    } catch (error) {
       console.error('TTS failed:', error);
      toast({
        title: 'Audio Error',
        description:
          'Could not generate audio. Please try again later.',
        variant: 'destructive',
      });
      setIsPlaying(null);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          LinguaLive
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-Time Speech Translation
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="font-headline text-2xl">Translator</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={sourceLanguage}
                  onValueChange={setSourceLanguage}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Source Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSwapLanguages}
                  aria-label="Swap languages"
                >
                  <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Target Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="source-text" className="font-medium text-muted-foreground">From: {findLanguageByCode(sourceLanguage)?.name}</label>
              <Textarea
                id="source-text"
                placeholder="Speak or type here..."
                value={currentTranscript}
                onChange={(e) => setCurrentTranscript(e.target.value)}
                className="h-48 resize-none text-base"
              />
            </div>
            <div className="relative flex flex-col gap-2">
              <label htmlFor="translated-text" className="font-medium text-muted-foreground">To: {findLanguageByCode(targetLanguage)?.name}</label>
               <Textarea
                id="translated-text"
                placeholder="Translation will appear here..."
                value={translatedText}
                readOnly
                className="h-48 resize-none bg-secondary/50 text-base"
              />
               {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                   <Loader2 className="w-8 h-8 animate-spin text-primary" />
                 </div>
               )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
               <Button
                onClick={handleRecord}
                size="lg"
                className={`transition-colors duration-300 ${
                  isListening ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
                disabled={!isSupported || isLoading}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
              >
                {isListening ? (
                  <MicOff className="mr-2 h-5 w-5" />
                ) : (
                  <Mic className="mr-2 h-5 w-5" />
                )}
                {isListening ? 'Stop' : 'Record'}
              </Button>
               {!isSupported && <p className="text-xs text-destructive">Speech recognition not supported in your browser.</p>}
            </div>
            <Button
              onClick={() => handleTranslation(currentTranscript)}
              disabled={isLoading || !currentTranscript}
            >
              Translate
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-headline text-2xl">History</CardTitle>
              <CardDescription>Your recent translations</CardDescription>
            </div>
            {history.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setHistory([])} aria-label="Clear history">
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 pr-4">
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg bg-secondary/30 relative group">
                      <p className="font-semibold text-sm truncate">{item.sourceText}</p>
                      <p className="text-primary text-sm truncate">{item.translatedText}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {findLanguageByCode(item.sourceLanguage)?.name} &rarr; {findLanguageByCode(item.targetLanguage)?.name}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => playAudio(item)} aria-label="Play audio" disabled={isPlaying === item.id}>
                          {isPlaying === item.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Volume2 className="w-4 h-4"/>}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <History className="w-12 h-12 mb-4" />
                  <p>No translations yet.</p>
                  <p className="text-xs">Start a translation to see your history here.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
