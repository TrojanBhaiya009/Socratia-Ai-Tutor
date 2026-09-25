"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SUBJECTS, LEVELS, EXAMPLE_TOPICS } from "@/lib/config";
import { useAccessibility } from "@/lib/accessibility";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { settings, isSpeaking } = useAccessibility();
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<string>(LEVELS[1]);

  const canStart = topic.trim().length > 0;

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams({
      subject,
      topic: topic.trim(),
      level,
    });
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      {/* Masthead */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-h3 font-medium tracking-tight">Socratia</span>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.15em]">Socratic tutor</span>
            </div>
            <AccessibilitySettingsTrigger />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="masthead-rule flex-1" />
            <div className="masthead-rule-sub flex-1" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          {/* Hero */}
          <section aria-labelledby="hero-title" className="mb-16 text-center">
            <span className="section-label">01 — Session</span>
            <h1 id="hero-title" className="mt-4 text-display tracking-tight">
              The tutor that <em className="italic text-signal">refuses</em> to give you the answer.
            </h1>
            <p className="mt-6 text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Socratia guides you to the solution with questions — so the answer you find is one you actually understand.
            </p>
          </section>

          {/* Session setup */}
          <section aria-labelledby="setup-title" className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 id="setup-title" className="text-h2">Set up your session</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Select value={subject} onValueChange={setSubject} aria-required="true">
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Your level</label>
                <Select value={level} onValueChange={setLevel} aria-required="true">
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="topic" className="block text-sm font-medium">Topic</label>
              <div className="relative">
                <Input
                  id="topic"
                  placeholder={EXAMPLE_TOPICS[subject]?.[0] ?? "e.g. Quadratic equations"}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") start(); }}
                  className="pr-10"
                  aria-required="true"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground" aria-hidden>↵</span>
              </div>
              {EXAMPLE_TOPICS[subject]?.length && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Example topics">
                  {EXAMPLE_TOPICS[subject].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className="chip-invert px-3 py-1.5 text-sm border border-border bg-transparent rounded-[3px]"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex-1 min-w-0">
                <span className="section-label">02 — Method</span>
                <ol className="text-sm space-y-3">
                  {[
                    "You paste a problem or question",
                    "Socratia responds with one guiding question",
                    "You answer; it adapts and detects misconceptions",
                    "No direct answers — only the path to understanding",
                  ].map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="font-mono text-muted-foreground shrink-0 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Button
                size="xl"
                onClick={start}
                disabled={!canStart}
                className="w-full sm:w-auto flex-shrink-0"
                aria-disabled={!canStart}
              >
                Start thinking
              </Button>
            </div>
          </section>

          {/* Value props */}
          <section aria-labelledby="values-title" className="mt-16 pt-12 border-t border-border">
            <span className="section-label">03 — Why it works</span>
            <h2 id="values-title" className="text-h2 mb-8 text-center">What makes Socratia different</h2>
            <dl className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  term: "Questions, not answers",
                  description: "Every reply is one sharp guiding question. You do the thinking — that's the point.",
                },
                {
                  term: "Misconception detection",
                  description: "Socratia spots the exact idea tripping you up and targets it, instead of dumping a solution.",
                },
                {
                  term: "Cheat-proof by design",
                  description: 'No amount of "just tell me" makes it cave. The escape hatch teaches, it never copies.',
                },
              ].map(({ term, description }) => (
                <div key={term} className="space-y-2 p-4 rounded-[4px] border border-border bg-card hover:border-signal/50 transition-colors">
                  <dt className="font-medium text-foreground">{term}</dt>
                  <dd className="text-sm text-muted-foreground">{description}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <footer className="border-t border-border bg-background/80 py-8 px-6">
        <p className="mx-auto max-w-3xl text-center font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          Socratia · Learn by thinking · 2026
        </p>
      </footer>
    </main>
  );
}

function AccessibilitySettingsTrigger() {
  const { settings, updateSetting, isSpeaking, stopSpeaking, speak } = useAccessibility();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close accessibility settings" : "Open accessibility settings"}
        className="relative"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" aria-hidden />
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-[4px] border border-border bg-card p-4 shadow-lg z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Accessibility</h3>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Font</label>
              <div className="flex gap-2">
                {(["system", "dyslexic", "monospace"] as const).map((font) => (
                  <Button
                    key={font}
                    variant={settings.fontFamily === font ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("fontFamily", font)}
                    className="flex-1 capitalize text-xs"
                  >
                    {font}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Font size: {settings.fontSize}px</label>
              <input
                type="range"
                min="14"
                max="24"
                step="1"
                value={settings.fontSize}
                onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
                className="w-full"
                aria-label="Font size"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color scheme</label>
              <div className="flex gap-2">
                {(["default", "high-contrast", "sepia"] as const).map((scheme) => (
                  <Button
                    key={scheme}
                    variant={settings.colorScheme === scheme ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("colorScheme", scheme)}
                    className="flex-1 capitalize text-xs"
                  >
                    {scheme.replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <div className="flex gap-2">
                {(["standard", "simplified"] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={settings.languageMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateSetting("languageMode", mode)}
                    className="flex-1 capitalize text-xs"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <label className="flex items-center justify-between text-sm">
                <span>Reduced motion</span>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => updateSetting("reducedMotion", e.target.checked)}
                  className="w-4 h-4 rounded-[3px] border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between text-sm">
                <span>Text-to-speech</span>
                <input
                  type="checkbox"
                  checked={settings.textToSpeech}
                  onChange={(e) => updateSetting("textToSpeech", e.target.checked)}
                  className="w-4 h-4 rounded-[3px] border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between text-sm">
                <span>Announce responses</span>
                <input
                  type="checkbox"
                  checked={settings.announceResponses}
                  onChange={(e) => updateSetting("announceResponses", e.target.checked)}
                  className="w-4 h-4 rounded-[3px] border-border text-primary focus:ring-primary"
                />
              </label>

              <label className="flex items-center justify-between text-sm">
                <span>Voice input</span>
                <input
                  type="checkbox"
                  checked={settings.voiceInput}
                  onChange={(e) => updateSetting("voiceInput", e.target.checked)}
                  className="w-4 h-4 rounded-[3px] border-border text-primary focus:ring-primary"
                />
              </label>
            </div>

            {settings.textToSpeech && (
              <div>
                <label className="block text-sm font-medium mb-2">Speech rate: {settings.speechRate.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) => updateSetting("speechRate", Number(e.target.value))}
                  className="w-full"
                  aria-label="Speech rate"
                />
              </div>
            )}

            <Button variant="outline" onClick={stopSpeaking} disabled={!isSpeaking} className="w-full">
              {isSpeaking ? "Stop speaking" : "Test speech"}
            </Button>

            <Button variant="destructive" onClick={() => {
              if (confirm("Reset all accessibility settings?")) {
                updateSetting("fontFamily", "system");
                updateSetting("fontSize", 16);
                updateSetting("colorScheme", "default");
                updateSetting("languageMode", "standard");
                updateSetting("reducedMotion", false);
                updateSetting("textToSpeech", false);
                updateSetting("speechRate", 1);
                updateSetting("voiceInput", false);
                updateSetting("announceResponses", true);
              }
            }} className="w-full">
              Reset to defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}