"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";

export type FontFamily = "system" | "dyslexic" | "monospace";
export type ColorScheme = "default" | "high-contrast" | "sepia";
export type LanguageMode = "standard" | "simplified";

export interface AccessibilitySettings {
  fontFamily: FontFamily;
  fontSize: number; // 14-24px
  colorScheme: ColorScheme;
  languageMode: LanguageMode;
  reducedMotion: boolean;
  textToSpeech: boolean;
  speechRate: number; // 0.5-2.0
  voiceInput: boolean;
  announceResponses: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontFamily: "system",
  fontSize: 16,
  colorScheme: "default",
  languageMode: "standard",
  reducedMotion: false,
  textToSpeech: false,
  speechRate: 1.0,
  voiceInput: false,
  announceResponses: true,
};

const STORAGE_KEY = "socratia-a11y-settings";

function loadSettings(): AccessibilitySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AccessibilitySettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

function applySettingsToDOM(settings: AccessibilitySettings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Font family
  root.classList.remove("font-system", "font-dyslexic", "font-monospace");
  root.classList.add(`font-${settings.fontFamily}`);

  // Font size
  root.style.setProperty("--a11y-font-size", `${settings.fontSize}px`);

  // Color scheme
  root.classList.remove("scheme-default", "scheme-high-contrast", "scheme-sepia");
  root.classList.add(`scheme-${settings.colorScheme}`);

  // Reduced motion
  if (settings.reducedMotion) {
    root.classList.add("reduce-motion");
  } else {
    root.classList.remove("reduce-motion");
  }

  // Language mode (for CSS/content adjustments)
  root.classList.toggle("lang-simplified", settings.languageMode === "simplified");
}

// Check system prefers-reduced-motion
function getSystemReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const loaded = loadSettings();
    // Merge with system prefers-reduced-motion if user hasn't explicitly set it
    if (getSystemReducedMotion() && !loaded.reducedMotion) {
      loaded.reducedMotion = true;
    }
    return loaded;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Apply settings to DOM on mount and when settings change
  useEffect(() => {
    applySettingsToDOM(settings);
  }, [settings]);

  // Listen for system reduced-motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      setSettings((prev) => {
        if (!prev.reducedMotion || e.matches) {
          // Only auto-enable, never auto-disable user choice
          return { ...prev, reducedMotion: e.matches };
        }
        return prev;
      });
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        saveSettings(next);
        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!settings.textToSpeech || typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) return;

      stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.speechRate;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to find a good voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) => v.lang.startsWith("en") && v.name.includes("Natural")) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        null;
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [settings.textToSpeech, settings.speechRate]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        speak,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}