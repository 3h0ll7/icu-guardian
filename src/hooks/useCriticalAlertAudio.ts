import { useCallback, useEffect, useRef, useState } from 'react';

const TONE_SCHEDULE = [
  { frequency: 880, start: 0, duration: 0.12 },
  { frequency: 880, start: 0.2, duration: 0.12 },
  { frequency: 660, start: 0.4, duration: 0.2 },
];

type BrowserWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function useCriticalAlertAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const browserWindow = window as BrowserWindow;
    const AudioContextConstructor = window.AudioContext || browserWindow.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }, []);

  const ensureAudioReady = useCallback(async () => {
    const context = getAudioContext();
    if (!context) {
      setAudioReady(false);
      return false;
    }

    try {
      if (context.state === 'suspended') {
        await context.resume();
      }

      const ready = context.state === 'running';
      setAudioReady(ready);
      return ready;
    } catch (error) {
      console.warn('Unable to initialize alert audio.', error);
      setAudioReady(false);
      return false;
    }
  }, [getAudioContext]);

  const playCriticalAlert = useCallback(async () => {
    const ready = await ensureAudioReady();
    if (!ready) return;

    const context = audioContextRef.current;
    if (!context) return;

    try {
      const now = context.currentTime;
      const gain = context.createGain();
      gain.connect(context.destination);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      TONE_SCHEDULE.forEach(({ frequency, start, duration }) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now + start);
        oscillator.connect(gain);
        oscillator.start(now + start);
        oscillator.stop(now + start + duration);
      });
    } catch (error) {
      console.warn('Unable to play critical alert audio.', error);
    }
  }, [ensureAudioReady]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  return { playCriticalAlert, ensureAudioReady, audioReady };
}
