// Speech in and out. STT: Web Speech API where the browser supports the language, otherwise a
// recording is sent to the tutor proxy (Whisper). TTS: the device's own voice for the language.
// Audio is processed and discarded; nothing is stored (SPEC §9).
import { LANGS } from '../langs';
import type { LangId } from '../types';

type Rec = { lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean; start(): void; stop(): void; abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null };

const RecCtor = (): (new () => Rec) | undefined => {
  const w = globalThis as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

let voices: SpeechSynthesisVoice[] = [];
const loadVoices = () => { voices = globalThis.speechSynthesis?.getVoices() ?? []; };
if (typeof speechSynthesis !== 'undefined') { loadVoices(); speechSynthesis.addEventListener?.('voiceschanged', loadVoices); }

function voiceFor(lang: LangId): SpeechSynthesisVoice | undefined {
  if (!voices.length) loadVoices();
  const tag = LANGS[lang].bcp47.toLowerCase(), base = tag.split('-')[0];
  return voices.find((v) => v.lang.toLowerCase().replace('_', '-') === tag) ?? voices.find((v) => v.lang.toLowerCase().startsWith(base));
}

/** True when the device has a voice for this language. (Few devices ship a Maltese voice.) */
export function canListen(lang: LangId): boolean {
  return typeof speechSynthesis !== 'undefined' && !!voiceFor(lang);
}

export function speak(text: string, lang: LangId, rate = 0.9): void {
  if (typeof speechSynthesis === 'undefined') return;
  const v = voiceFor(lang);
  if (!v) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v; u.lang = v.lang; u.rate = rate;
  speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  globalThis.speechSynthesis?.cancel();
}

export type SttMode = 'browser' | 'server' | 'none';

export function sttMode(lang: LangId, hasProxy: boolean): SttMode {
  if (RecCtor() && LANGS[lang].browserStt) return 'browser';
  if (hasProxy && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia) return 'server';
  return 'none';
}

export interface Listening { stop(): void; result: Promise<string> }

/** Start listening. Call stop() when the learner finishes (browser mode also stops on silence). */
export function listen(lang: LangId, mode: SttMode, proxy: { url: string; token: string }): Listening {
  if (mode === 'browser') {
    const rec = new (RecCtor()!)();
    rec.lang = LANGS[lang].bcp47; rec.interimResults = false; rec.maxAlternatives = 1; rec.continuous = false;
    let text = '';
    const result = new Promise<string>((resolve, reject) => {
      rec.onresult = (e) => { text = Array.from(e.results).map((r) => r[0].transcript).join(' '); };
      rec.onerror = (e) => { if (e.error !== 'no-speech' && e.error !== 'aborted') reject(new Error(sttMessage(e.error))); };
      rec.onend = () => resolve(text.trim());
    });
    rec.start();
    return { stop: () => rec.stop(), result };
  }
  if (mode === 'server') {
    let recorder: MediaRecorder | undefined;
    let cancelled = false;
    const result = (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const stopped = new Promise<void>((r) => { recorder!.onstop = () => r(); });
      recorder.start();
      if (cancelled) recorder.stop();
      setTimeout(() => recorder?.state === 'recording' && recorder.stop(), 20000);
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      const res = await fetch(`${proxy.url.replace(/\/+$/, '')}/stt`, { method: 'POST', headers: { 'X-Lang': lang, 'X-App-Token': proxy.token, 'Content-Type': recorder.mimeType || 'audio/webm' }, body: new Blob(chunks) });
      if (!res.ok) throw new Error('Speech recognition service is unavailable right now.');
      return String((await res.json()).text ?? '').trim();
    })();
    return { stop: () => { cancelled = true; if (recorder?.state === 'recording') recorder.stop(); }, result };
  }
  return { stop: () => {}, result: Promise.reject(new Error('Speech recognition is not available on this device.')) };
}

function sttMessage(code: string): string {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'Microphone permission was denied.';
  if (code === 'language-not-supported') return 'This browser cannot recognise this language.';
  if (code === 'network') return 'Speech recognition needs a network connection on this device.';
  return 'Could not hear that. Try again.';
}
