'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  PARTICLE_CONFIG,
  hslColor,
  lerp,
  clamp,
  type VoiceActivityLevel
} from '@/lib/assistant/animations';

// Multi-color palette: gold, navy blue, royal green, and warm tones
const PARTICLE_PALETTES = {
  gold: { h: 42, s: 65, l: 58 },
  navy: { h: 220, s: 60, l: 35 },
  royalGreen: { h: 160, s: 45, l: 40 },
  rose: { h: 15, s: 55, l: 70 },
  champagne: { h: 35, s: 45, l: 75 },
  coral: { h: 25, s: 50, l: 72 },
};

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  colorIndex: number;
  colorPhase: number;
  alpha: number;
  phase: number;
}

interface ParticleVisualizationProps {
  activity?: VoiceActivityLevel;
  voiceIntensity?: number;
  size?: number;
  className?: string;
}

export const ParticleVisualization: React.FC<ParticleVisualizationProps> = ({
  activity = 'idle',
  voiceIntensity = 0,
  size = 350,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const activityRef = useRef<VoiceActivityLevel>(activity);
  const voiceIntensityRef = useRef<number>(voiceIntensity);
  const colorTimeRef = useRef<number>(0);

  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    voiceIntensityRef.current = voiceIntensity;
  }, [voiceIntensity]);

  const getColorForParticle = useCallback((colorPhase: number, time: number) => {
    const colors = Object.values(PARTICLE_PALETTES);
    const cycleTime = 8000;
    const phase = ((time + colorPhase * 1000) % cycleTime) / cycleTime;

    const colorIndex = Math.floor(phase * colors.length);
    const nextColorIndex = (colorIndex + 1) % colors.length;
    const blendFactor = (phase * colors.length) % 1;

    const currentColor = colors[colorIndex];
    const nextColor = colors[nextColorIndex];

    return {
      h: lerp(currentColor.h, nextColor.h, blendFactor),
      s: lerp(currentColor.s, nextColor.s, blendFactor),
      l: lerp(currentColor.l, nextColor.l, blendFactor),
    };
  }, []);

  const initParticles = useCallback((canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const particles: Particle[] = [];

    for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = PARTICLE_CONFIG.minRadius + Math.random() * (PARTICLE_CONFIG.baseRadius - PARTICLE_CONFIG.minRadius);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 1 + Math.random() * 2,
        colorIndex: Math.floor(Math.random() * 6),
        colorPhase: Math.random() * Math.PI * 2,
        alpha: 0.4 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }

    particlesRef.current = particles;
  }, []);

  const getActivityParams = useCallback(() => {
    const voice = voiceIntensityRef.current;
    const voiceBoost = voice * 0.5;

    switch (activityRef.current) {
      case 'idle':
        return {
          expansion: 1 + voiceBoost * 0.1,
          speed: 0.5 + voiceBoost,
          brightness: 0.7 + voiceBoost * 0.2,
          jitter: 0.3 + voiceBoost * 0.5,
          pulseStrength: 0.1 + voiceBoost * 0.3
        };
      case 'listening':
        return {
          expansion: 1.1 + voiceBoost * 0.2,
          speed: 1 + voiceBoost * 1.5,
          brightness: 0.85 + voiceBoost * 0.15,
          jitter: 0.6 + voiceBoost * 0.8,
          pulseStrength: 0.3 + voiceBoost * 0.5
        };
      case 'speaking':
        return {
          expansion: 1.2 + voice * 0.4,
          speed: 1.5 + voice * 2,
          brightness: 0.9 + voice * 0.1,
          jitter: 0.8 + voice * 1.5,
          pulseStrength: 0.5 + voice * 0.8
        };
      case 'processing':
        return {
          expansion: 1.15,
          speed: 2,
          brightness: 0.9,
          jitter: 0.8,
          pulseStrength: 0.4
        };
      default:
        return { expansion: 1, speed: 0.5, brightness: 0.7, jitter: 0.3, pulseStrength: 0.1 };
    }
  }, []);

  const animate = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const params = getActivityParams();

    timeRef.current += 0.016 * params.speed;
    colorTimeRef.current += 16;

    ctx.fillStyle = 'hsla(30, 25%, 98%, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const voice = voiceIntensityRef.current;
    const voicePulse = Math.sin(timeRef.current * 8) * voice * 0.3;

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PARTICLE_CONFIG.connectionDistance * (1 + voice * 0.5)) {
          const alpha = (1 - dist / PARTICLE_CONFIG.connectionDistance) * 0.12 * params.brightness;
          const color = getColorForParticle((particles[i].colorPhase + particles[j].colorPhase) / 2, colorTimeRef.current);
          ctx.strokeStyle = hslColor(color.h, color.s * 0.6, color.l + 20, alpha);
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Update and draw particles
    for (const particle of particles) {
      const particleColor = getColorForParticle(particle.colorPhase, colorTimeRef.current);

      const dx = particle.baseX - centerX;
      const dy = particle.baseY - centerY;
      const baseDistance = Math.sqrt(dx * dx + dy * dy);

      const breathe = Math.sin(timeRef.current * 0.8 + particle.phase) * 0.15 * params.expansion;
      const voiceExpansion = voicePulse * (baseDistance / PARTICLE_CONFIG.baseRadius);
      const targetDistance = baseDistance * (1 + breathe + voiceExpansion);

      const angle = Math.atan2(dy, dx);
      const targetX = centerX + Math.cos(angle) * targetDistance;
      const targetY = centerY + Math.sin(angle) * targetDistance;

      const jitterAmount = params.jitter * (1 + voice * 2);
      const jitterX = Math.sin(timeRef.current * 3 + particle.phase) * jitterAmount * 2;
      const jitterY = Math.cos(timeRef.current * 3 + particle.phase * 1.5) * jitterAmount * 2;

      particle.x = lerp(particle.x, targetX + jitterX, 0.08);
      particle.y = lerp(particle.y, targetY + jitterY, 0.08);

      const pulseAlpha = 0.5 + Math.sin(timeRef.current * 2 + particle.phase) * params.pulseStrength;
      const voiceAlpha = voice * 0.3;
      const finalAlpha = clamp(particle.alpha * (pulseAlpha + voiceAlpha) * params.brightness, 0.2, 1);

      const glowRadius = particle.radius * (2.5 + voice * 1.5);
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, glowRadius
      );
      gradient.addColorStop(0, hslColor(particleColor.h, particleColor.s, particleColor.l, finalAlpha));
      gradient.addColorStop(0.4, hslColor(particleColor.h, particleColor.s, particleColor.l, finalAlpha * 0.5));
      gradient.addColorStop(1, hslColor(particleColor.h, particleColor.s, particleColor.l, 0));

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * (1 + voice * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = hslColor(particleColor.h, particleColor.s, particleColor.l + 15, finalAlpha);
      ctx.fill();
    }

    // Central glow
    const centerColor = getColorForParticle(0, colorTimeRef.current);
    const centerGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, 60 * params.expansion * (1 + voice * 0.3)
    );
    centerGlow.addColorStop(0, hslColor(centerColor.h, centerColor.s * 0.5, centerColor.l + 20, 0.15 * params.brightness));
    centerGlow.addColorStop(0.5, hslColor(centerColor.h, centerColor.s * 0.3, centerColor.l + 30, 0.08 * params.brightness));
    centerGlow.addColorStop(1, hslColor(centerColor.h, centerColor.s * 0.2, centerColor.l + 40, 0));

    ctx.fillStyle = centerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60 * params.expansion * (1 + voice * 0.3), 0, Math.PI * 2);
    ctx.fill();

    animationRef.current = requestAnimationFrame(() => animate(canvas, ctx));
  }, [getActivityParams, getColorForParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initParticles(canvas);
    animate(canvas, ctx);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, initParticles, animate]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="animate-breathe"
        style={{
          filter: 'blur(0.5px)',
          width: size,
          height: size,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, transparent 40%, hsl(30 25% 98%) 100%)',
        }}
      />
    </div>
  );
};

export default ParticleVisualization;
