import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";

type WebSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type NativeVoiceModule = {
  onSpeechResults?: (event: { value?: string[] }) => void;
  onSpeechError?: (event: { error?: { message?: string } }) => void;
  start: (locale: string) => Promise<void>;
  stop: () => Promise<void>;
  destroy?: () => Promise<void>;
  removeAllListeners?: () => void;
};

type WindowWithSpeech = typeof globalThis & {
  SpeechRecognition?: new () => WebSpeechRecognition;
  webkitSpeechRecognition?: new () => WebSpeechRecognition;
};

export function useVoiceInput(onTranscript: (value: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const webRecognitionRef = useRef<WebSpeechRecognition | null>(null);
  const nativeVoiceRef = useRef<NativeVoiceModule | null>(null);

  const stopListening = useCallback(async () => {
    try {
      webRecognitionRef.current?.stop();
      await nativeVoiceRef.current?.stop?.();
    } finally {
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    setVoiceError(null);

    if (Platform.OS === "web") {
      const speechWindow = globalThis as WindowWithSpeech;
      const SpeechRecognition =
        speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setVoiceError("Trình duyệt này chưa hỗ trợ voice-to-text.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "vi-VN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) onTranscript(transcript);
      };
      recognition.onerror = (event) => {
        setVoiceError(event.error || "Không thể nhận dạng giọng nói.");
      };
      recognition.onend = () => setIsListening(false);
      webRecognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
      return;
    }

    try {
      const voiceImport = require("@react-native-voice/voice") as unknown;
      const importRecord = voiceImport && typeof voiceImport === "object"
        ? (voiceImport as { default?: NativeVoiceModule })
        : {};
      const Voice = (importRecord.default || voiceImport) as NativeVoiceModule;
      nativeVoiceRef.current = Voice;
      Voice.onSpeechResults = (event: { value?: string[] }) => {
        const transcript = event.value?.[0];
        if (transcript) onTranscript(transcript);
      };
      Voice.onSpeechError = (event: { error?: { message?: string } }) => {
        setVoiceError(event.error?.message || "Không thể nhận dạng giọng nói.");
      };
      setIsListening(true);
      await Voice.start("vi-VN");
    } catch {
      setIsListening(false);
      setVoiceError("Voice-to-text cần Expo dev build có native module.");
    }
  }, [onTranscript]);

  return { isListening, voiceError, startListening, stopListening };
}
