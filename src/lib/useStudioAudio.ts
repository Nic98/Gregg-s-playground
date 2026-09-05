import { useCallback, useEffect, useRef, useState } from 'react';
import { resample, SOURCE_RATE } from './soundMath';

/** One audio owner per studio: no background playback or retained microphone. */
export function useStudioAudio() {
  const context = useRef<AudioContext | null>(null);
  const player = useRef<AudioBufferSourceNode | null>(null);
  const connection = useRef<GainNode | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const alive = useRef(true);
  const [playing, setPlaying] = useState('');
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const stop = useCallback(() => {
    generation.current++;
    if (player.current) {
      player.current.onended = null;
      player.current.stop();
      player.current.disconnect();
      player.current = null;
    }
    if (alive.current) setPlaying('');
    connection.current?.disconnect();
    connection.current = null;
  }, []);
  const cancelRecording = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (recorder.current?.state === 'recording') {
      recorder.current.onstop = null;
      recorder.current.stop();
    }
    recorder.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (alive.current) setRecording(false);
  }, []);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stop();
      cancelRecording();
      void context.current?.close();
      context.current = null;
    };
  }, [stop, cancelRecording]);
  async function play(samples: Float32Array, rate: number, label: string) {
    stop();
    setError('');
    const request = generation.current;
    try {
      context.current ??= new AudioContext();
      const audio = context.current;
      await audio.resume();
      if (!alive.current || request !== generation.current) return;
      const buffer = audio.createBuffer(1, samples.length, rate);
      buffer.getChannelData(0).set(samples);
      const source = audio.createBufferSource();
      source.buffer = buffer;
      const gain = audio.createGain();
      connection.current = gain;
      // Identical fixed gain and short edge ramps for every version. No normalisation.
      gain.gain.setValueAtTime(0, audio.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, audio.currentTime + 0.008);
      gain.gain.setValueAtTime(
        0.35,
        audio.currentTime + Math.max(0.008, buffer.duration - 0.008),
      );
      gain.gain.linearRampToValueAtTime(0, audio.currentTime + buffer.duration);
      source.connect(gain).connect(audio.destination);
      source.onended = () => {
        gain.disconnect();
        source.disconnect();
        if (player.current === source) {
          player.current = null;
          connection.current = null;
          if (alive.current) setPlaying('');
        }
      };
      player.current = source;
      setPlaying(label);
      source.start();
    } catch {
      if (alive.current)
        setError(
          'Audio could not start. Check your browser audio permissions and try again.',
        );
    }
  }
  async function record(onComplete: (samples: Float32Array) => void) {
    stop();
    cancelRecording();
    setError('');
    setRecording(true);
    const request = generation.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error('unsupported');
      const media = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      if (!alive.current || request !== generation.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      context.current ??= new AudioContext();
      const capture = new MediaRecorder(media);
      recorder.current = capture;
      const chunks: Blob[] = [];
      capture.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      capture.onerror = () => {
        cancelRecording();
        setError('Recording failed. Please use a built-in source.');
      };
      capture.onstop = async () => {
        media.getTracks().forEach((track) => track.stop());
        stream.current = null;
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        try {
          const bytes = await new Blob(chunks, {
            type: capture.mimeType,
          }).arrayBuffer();
          const decoded = await context.current!.decodeAudioData(bytes);
          const mono = new Float32Array(decoded.length);
          for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
            const data = decoded.getChannelData(channel);
            for (let i = 0; i < mono.length; i++)
              mono[i] += data[i] / decoded.numberOfChannels;
          }
          const converted = resample(mono, decoded.sampleRate, SOURCE_RATE);
          const clip = new Float32Array(3 * SOURCE_RATE);
          clip.set(converted.subarray(0, clip.length));
          if (alive.current && request === generation.current) onComplete(clip);
        } catch {
          if (alive.current && request === generation.current)
            setError(
              'This browser could not decode the recording. Use a built-in source instead.',
            );
        } finally {
          if (alive.current && request === generation.current)
            setRecording(false);
        }
      };
      capture.start();
      timer.current = setTimeout(() => {
        if (capture.state === 'recording') capture.stop();
      }, 3000);
    } catch {
      cancelRecording();
      if (alive.current && request === generation.current)
        setError(
          'Microphone unavailable or permission denied. Built-in sources work without microphone access.',
        );
    }
  }
  return { play, stop, record, cancelRecording, playing, recording, error };
}
