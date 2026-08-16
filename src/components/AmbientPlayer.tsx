"use client";

import { useState, useRef, useEffect } from "react";

/* Generates procedural ambient café lofi sound via Web Audio API */
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private nodes: (AudioNode | number)[] = [];

  public start() {
    if (this.isRunning) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.isRunning = true;

      // 1. Soft Warm Rain / Vinyl Crackle Noise
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink / Brown noise filter for warm gentle rain
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        output[i] = lastOut * 3.5;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      whiteNoise.start();
      this.nodes.push(whiteNoise, noiseFilter, noiseGain);

      // 2. Warm Sub Drone / Café Room Resonance (chords: F#m / A major gentle warmth)
      const frequencies = [110, 164.81, 220, 329.63];
      frequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // LFO subtle pitch wobble
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.1 + idx * 0.05, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(1.5, this.ctx.currentTime);
        lfo.connect(osc.frequency);
        lfo.start();

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.015 / (idx + 1), this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, this.ctx.currentTime);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start();

        this.nodes.push(osc, lfo, lfoGain, oscGain, filter);
      });
    } catch {
      // Ignore audio context autoplay restriction
    }
  }

  public stop() {
    if (!this.isRunning) return;
    try {
      this.nodes.forEach((node) => {
        if (typeof node !== "number" && "stop" in node && typeof node.stop === "function") {
          node.stop();
        }
      });
      if (this.ctx) {
        this.ctx.close();
      }
    } catch {
      // cleanup
    }
    this.nodes = [];
    this.ctx = null;
    this.isRunning = false;
  }
}

export default function AmbientPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const engineRef = useRef<AmbientSoundEngine | null>(null);

  useEffect(() => {
    engineRef.current = new AmbientSoundEngine();
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  function togglePlay() {
    if (isPlaying) {
      engineRef.current?.stop();
      setIsPlaying(false);
    } else {
      engineRef.current?.start();
      setIsPlaying(true);
    }
  }

  return (
    <div className="ambient-player" title="Café Ambient Soundscape (Gentle Rain & Warm Lofi Drone)">
      <button
        type="button"
        onClick={togglePlay}
        className={`ambient-player__btn ${isPlaying ? "ambient-player__btn--active" : ""}`}
        aria-label={isPlaying ? "Mute café ambient sound" : "Play café ambient sound"}
      >
        <span className="ambient-player__icon">
          {isPlaying ? "☕" : "🎧"}
        </span>
        <span className="ambient-player__label">
          {isPlaying ? "café vibe: on" : "café vibe: off"}
        </span>
        {isPlaying && (
          <span className="ambient-player__wave">
            <span className="wave-bar" />
            <span className="wave-bar" />
            <span className="wave-bar" />
          </span>
        )}
      </button>
    </div>
  );
}
