# Voice Assistant UI - Next.js 16 + Tailwind CSS 4 Integration

## CRITICAL: Read This First
This prompt is specifically designed for **Next.js 16+ with Tailwind CSS 4.x**. 
Tailwind v4 uses a completely different configuration system (`@theme` in CSS instead of `tailwind.config.ts`).

---

## PHASE 1: Install Dependencies

```bash
npm install class-variance-authority clsx tailwind-merge
```

> **Note:** You should already have `lucide-react` and Radix UI from your existing stack.

### ✓ VERIFICATION CHECKPOINT
Run `npm list class-variance-authority` - should show version installed.

---

## PHASE 2: Create/Update CSS Theme (Tailwind v4 Format)

**IMPORTANT:** Tailwind v4 uses `@import "tailwindcss"` and `@theme {}` blocks, NOT `@tailwind base/components/utilities`.

### Option A: Replace your main CSS file entirely
Create/replace `src/app/globals.css` with the contents of `TAILWIND_V4_THEME.css` (provided separately).

### Option B: Merge into existing globals.css
Add these sections to your existing CSS file:

#### 1. Add Google Fonts import at the TOP of the file:
```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@200;300;400&display=swap');
```

#### 2. Add/merge inside your `@theme {}` block:
```css
@theme {
  /* Voice Assistant Colors */
  --color-background: oklch(98.5% 0.005 80);
  --color-foreground: oklch(25% 0.02 60);
  
  --color-card: oklch(97% 0.008 75);
  --color-card-foreground: oklch(25% 0.02 60);
  
  --color-primary: oklch(70% 0.08 25);
  --color-primary-foreground: oklch(98.5% 0.005 80);
  
  --color-secondary: oklch(94% 0.015 70);
  --color-secondary-foreground: oklch(35% 0.02 60);
  
  --color-muted: oklch(92% 0.01 70);
  --color-muted-foreground: oklch(55% 0.02 60);
  
  --color-accent: oklch(80% 0.06 70);
  --color-accent-foreground: oklch(25% 0.02 60);
  
  --color-destructive: oklch(55% 0.2 25);
  --color-destructive-foreground: oklch(98% 0.005 80);
  
  --color-gold: oklch(65% 0.12 85);
  --color-gold-muted: oklch(78% 0.06 85);
  
  --color-border: oklch(90% 0.01 70);
  --color-input: oklch(90% 0.01 70);
  --color-ring: oklch(70% 0.08 25);
  
  /* Custom Fonts */
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  
  /* Custom Shadows */
  --shadow-glow: 0 0 60px oklch(70% 0.08 25 / 0.15);
  --shadow-soft: 0 4px 20px oklch(25% 0.02 60 / 0.05);
  
  /* Border Radius */
  --radius: 0.75rem;
  --radius-lg: 0.75rem;
  --radius-md: calc(0.75rem - 2px);
  --radius-sm: calc(0.75rem - 4px);
  
  /* Animations */
  --animate-float: float 6s ease-in-out infinite;
  --animate-pulse-soft: pulseSoft 4s ease-in-out infinite;
  --animate-breathe: breathe 4s ease-in-out infinite;
  --animate-fade-rise: fadeRise 0.8s ease-out forwards;
  --animate-card-entrance: cardEntrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
```

#### 3. Add these keyframes OUTSIDE the `@theme` block:
```css
@keyframes float {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(-8px) translateX(3px); }
  50% { transform: translateY(-4px) translateX(-2px); }
  75% { transform: translateY(-10px) translateX(1px); }
}

@keyframes pulseSoft {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.08); opacity: 1; }
}

@keyframes fadeRise {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes cardEntrance {
  0% { opacity: 0; transform: translateY(30px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

#### 4. Add these utility classes:
```css
/* Luxury text styles */
.text-luxury {
  font-family: var(--font-serif);
  font-weight: 300;
  letter-spacing: 0.025em;
}

.text-elegant {
  font-family: var(--font-sans);
  font-weight: 200;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

/* Animations */
.animate-float { animation: var(--animate-float); }
.animate-pulse-soft { animation: var(--animate-pulse-soft); }
.animate-breathe { animation: var(--animate-breathe); }
.animate-fade-rise { animation: var(--animate-fade-rise); }
.animate-card-entrance { animation: var(--animate-card-entrance); }

/* Glass effects */
.glass { background: oklch(98.5% 0.005 80 / 0.6); backdrop-filter: blur(24px); }
.glass-subtle { background: oklch(98.5% 0.005 80 / 0.3); backdrop-filter: blur(12px); }

/* Glow effect */
.glow-primary { box-shadow: var(--shadow-glow); }
.shadow-glow { box-shadow: var(--shadow-glow); }
.shadow-soft { box-shadow: var(--shadow-soft); }
```

### ✓ VERIFICATION CHECKPOINT
1. Open browser DevTools console
2. Run: `getComputedStyle(document.body).getPropertyValue('--color-primary')`
3. Should return something like `oklch(70% 0.08 25)` (NOT empty)

---

## PHASE 3: Create Utility Files

### 3A. Create `src/lib/utils.ts`
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3B. Create `src/lib/animations.ts`
```typescript
/**
 * Animation utilities and constants for the voice assistant UI
 */

// Particle configuration
export const PARTICLE_CONFIG = {
  count: 150,
  baseRadius: 120,
  maxRadius: 160,
  minRadius: 80,
  speed: 0.002,
  connectionDistance: 50,
  pulseSpeed: 0.03,
} as const;

// Voice activity levels
export type VoiceActivityLevel = 'idle' | 'listening' | 'speaking' | 'processing';

// Animation timing presets
export const TIMING = {
  slow: 800,
  medium: 400,
  fast: 200,
  extraSlow: 1200,
} as const;

// Easing functions
export const EASING = {
  smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Generate staggered delay for list items
export const staggerDelay = (index: number, baseDelay = 100): number => {
  return index * baseDelay;
};

// Interpolate between two values
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// Generate HSL color string
export const hslColor = (h: number, s: number, l: number, a = 1): string => {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Split text into words for animation
export const splitTextIntoWords = (text: string): string[] => {
  return text.split(' ').filter(word => word.length > 0);
};
```

---

## PHASE 4: Create Voice Components

**CRITICAL:** All components need `"use client"` at the top since they use React hooks.

### 4A. Create directory structure:
```
src/components/voice/
├── VoiceAssistantLayout.tsx
├── ParticleVisualization.tsx
├── AnimatedTranscript.tsx
├── FloatingLocations.tsx
├── ResortCard.tsx
├── StateToggle.tsx
└── index.ts
```

### 4B. Create `src/components/voice/index.ts`
```typescript
export { VoiceAssistantLayout, type DemoState } from './VoiceAssistantLayout';
export { ParticleVisualization } from './ParticleVisualization';
export { AnimatedTranscript, StaticTranscript } from './AnimatedTranscript';
export { FloatingLocations } from './FloatingLocations';
export { ResortCard, type Resort } from './ResortCard';
// Optional: Only include if you created StateToggle for demo purposes
// export { StateToggle } from './StateToggle';
```

### 4C. Create `src/components/voice/ParticleVisualization.tsx`
```tsx
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { 
  PARTICLE_CONFIG, 
  hslColor, 
  lerp, 
  clamp,
  type VoiceActivityLevel 
} from '@/lib/animations';

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
  size = 400,
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

    // Clear with warm background for trail effect
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

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    canvas.width = size;
    canvas.height = size;

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
        style={{ filter: 'blur(0.5px)' }}
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
```

### 4D. Create `src/components/voice/AnimatedTranscript.tsx`
```tsx
"use client";

import React, { useEffect, useState } from 'react';
import { splitTextIntoWords, staggerDelay } from '@/lib/animations';

interface AnimatedTranscriptProps {
  text: string;
  isActive?: boolean;
  className?: string;
  speed?: 'slow' | 'medium' | 'fast';
}

export const AnimatedTranscript: React.FC<AnimatedTranscriptProps> = ({
  text,
  isActive = true,
  className = '',
  speed = 'medium',
}) => {
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const words = splitTextIntoWords(text);

  const speedMs = {
    slow: 150,
    medium: 80,
    fast: 40,
  };

  useEffect(() => {
    if (!isActive) {
      setVisibleWords(0);
      return;
    }

    setVisibleWords(0);
    const interval = setInterval(() => {
      setVisibleWords(prev => {
        if (prev >= words.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs[speed]);

    return () => clearInterval(interval);
  }, [text, isActive, words.length, speed]);

  return (
    <div 
      className={className}
      style={{ 
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 300,
        letterSpacing: '0.025em',
        textAlign: 'center'
      }}
    >
      <p 
        style={{ 
          fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
          lineHeight: 1.6,
          color: 'hsl(30 20% 15% / 0.9)'
        }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{
              display: 'inline-block',
              marginLeft: '0.25rem',
              marginRight: '0.25rem',
              transitionDelay: `${staggerDelay(index, 30)}ms`,
              opacity: index < visibleWords ? 1 : 0,
              transform: index < visibleWords ? 'translateY(0)' : 'translateY(0.5rem)',
              filter: index < visibleWords ? 'blur(0)' : 'blur(4px)',
              transition: 'all 500ms ease-out',
            }}
          >
            {word}
          </span>
        ))}
      </p>
    </div>
  );
};

interface StaticTranscriptProps {
  text: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'muted';
}

export const StaticTranscript: React.FC<StaticTranscriptProps> = ({
  text,
  className = '',
  variant = 'primary',
}) => {
  const variantColors = {
    primary: 'hsl(30 20% 15% / 0.9)',
    secondary: 'hsl(30 20% 15% / 0.7)',
    muted: 'hsl(30 15% 45%)',
  };

  return (
    <div 
      className={className}
      style={{ 
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 300,
        letterSpacing: '0.025em',
        textAlign: 'center'
      }}
    >
      <p 
        style={{ 
          fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
          lineHeight: 1.6,
          color: variantColors[variant]
        }}
      >
        {text}
      </p>
    </div>
  );
};

export default AnimatedTranscript;
```

### 4E. Create `src/components/voice/FloatingLocations.tsx`
```tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';

const EXOTIC_LOCATIONS = [
  'Bali', 'Maldives', 'Santorini', 'Tokyo', 'Paris',
  'Sydney', 'New York', 'Marrakech', 'Iceland', 'Patagonia',
  'Amalfi Coast', 'Seychelles', 'Kyoto', 'Dubai', 'Cape Town',
  'Bora Bora', 'Venice', 'Swiss Alps', 'Maui', 'Tuscany'
];

interface FloatingLocation {
  id: number;
  name: string;
  angle: number;
  radius: number;
  opacity: number;
  scale: number;
  rotationSpeed: number;
  phaseOffset: number;
}

interface FloatingLocationsProps {
  isActive?: boolean;
  radius?: number;
  className?: string;
}

export const FloatingLocations: React.FC<FloatingLocationsProps> = ({
  isActive = true,
  radius = 200,
  className = '',
}) => {
  const [locations, setLocations] = useState<FloatingLocation[]>([]);
  const [visibleLocations, setVisibleLocations] = useState<FloatingLocation[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const generateLocations = useCallback(() => {
    const shuffled = [...EXOTIC_LOCATIONS].sort(() => Math.random() - 0.5);
    const count = 8;
    
    return shuffled.slice(0, count).map((name, index) => ({
      id: Date.now() + index,
      name,
      angle: (index / count) * Math.PI * 2 + Math.random() * 0.3,
      radius: radius + (Math.random() - 0.5) * 60,
      opacity: 0.5 + Math.random() * 0.5,
      scale: 0.85 + Math.random() * 0.3,
      rotationSpeed: 0.0003 + Math.random() * 0.0002,
      phaseOffset: Math.random() * Math.PI * 2,
    }));
  }, [radius]);

  useEffect(() => {
    if (!isActive) {
      setLocations([]);
      setVisibleLocations([]);
      return;
    }

    const newLocations = generateLocations();
    setLocations(newLocations);
    
    newLocations.forEach((loc, index) => {
      setTimeout(() => {
        setVisibleLocations(prev => [...prev, loc]);
      }, index * 300);
    });

    const interval = setInterval(() => {
      setLocations(prev => {
        const shuffled = [...EXOTIC_LOCATIONS].sort(() => Math.random() - 0.5);
        const newLocs = [...prev];
        const replaceCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < replaceCount; i++) {
          const replaceIndex = Math.floor(Math.random() * newLocs.length);
          const newName = shuffled.find(n => !newLocs.some(l => l.name === n)) || shuffled[0];
          
          newLocs[replaceIndex] = {
            ...newLocs[replaceIndex],
            id: Date.now() + i,
            name: newName,
            opacity: 0,
          };
        }
        
        return newLocs;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, generateLocations]);

  useEffect(() => {
    if (!isActive || locations.length === 0) return;

    const animate = () => {
      timeRef.current += 16;
      
      setLocations(prev => prev.map(loc => ({
        ...loc,
        angle: loc.angle + loc.rotationSpeed * 16,
        opacity: Math.min(loc.opacity + 0.02, 0.5 + Math.random() * 0.3),
      })));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, locations.length]);

  if (!isActive) return null;

  return (
    <div 
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      {locations.map((location) => {
        const x = Math.cos(location.angle) * location.radius;
        const y = Math.sin(location.angle) * location.radius;
        const pulse = Math.sin(timeRef.current * 0.002 + location.phaseOffset) * 0.1 + 1;
        
        return (
          <div
            key={location.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${location.scale * pulse})`,
              opacity: location.opacity,
              transition: 'opacity 1000ms',
            }}
          >
            <span 
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 200,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                color: 'hsl(30 15% 45% / 0.7)',
                whiteSpace: 'nowrap',
                transition: 'all 500ms',
              }}
            >
              {location.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default FloatingLocations;
```

### 4F. Create `src/components/voice/ResortCard.tsx`
```tsx
"use client";

import React from 'react';

export interface Resort {
  id: string;
  name: string;
  location: string;
  description: string;
  pricePerNight: string;
  rating: number;
  amenities: string[];
  imageUrl?: string;
}

interface ResortCardProps {
  resort: Resort;
  index?: number;
  className?: string;
}

export const ResortCard: React.FC<ResortCardProps> = ({
  resort,
  index = 0,
  className = '',
}) => {
  return (
    <div
      className={`group rounded-xl transition-all duration-500 cursor-pointer ${className}`}
      style={{
        background: 'hsl(30 20% 96% / 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid hsl(30 15% 88% / 0.5)',
        padding: '1.5rem',
        animationDelay: `${index * 150}ms`,
        animation: 'cardEntrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(30 20% 96% / 0.8)';
        e.currentTarget.style.borderColor = 'hsl(15 55% 70% / 0.3)';
        e.currentTarget.style.boxShadow = '0 0 60px hsl(15 55% 70% / 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'hsl(30 20% 96% / 0.5)';
        e.currentTarget.style.borderColor = 'hsl(30 15% 88% / 0.5)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {resort.imageUrl && (
        <div 
          className="relative overflow-hidden"
          style={{ 
            height: '12rem', 
            marginBottom: '1.25rem', 
            borderRadius: '0.5rem',
            background: 'hsl(30 15% 92%)' 
          }}
        >
          <img 
            src={resort.imageUrl} 
            alt={resort.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div 
            className="absolute inset-0" 
            style={{ background: 'linear-gradient(to top, hsl(30 20% 6% / 0.6), transparent)' }} 
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <span 
          style={{ 
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 200,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            color: 'hsl(30 15% 45%)'
          }}
        >
          {resort.location}
        </span>

        <h3 
          className="group-hover:text-primary transition-colors"
          style={{ 
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.25rem',
            fontWeight: 300,
            color: 'hsl(30 20% 15%)'
          }}
        >
          {resort.name}
        </h3>

        <p 
          style={{ 
            fontSize: '0.875rem',
            color: 'hsl(30 15% 45%)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {resort.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem' }}>
          {resort.amenities.slice(0, 3).map((amenity, i) => (
            <span 
              key={i}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                background: 'hsl(30 20% 92% / 0.5)',
                color: 'hsl(30 20% 25%)'
              }}
            >
              {amenity}
            </span>
          ))}
        </div>

        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'space-between', 
            paddingTop: '1rem',
            borderTop: '1px solid hsl(30 15% 88% / 0.3)'
          }}
        >
          <div>
            <span 
              style={{ 
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 200,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                color: 'hsl(30 15% 45%)',
                display: 'block',
                marginBottom: '0.25rem'
              }}
            >
              From
            </span>
            <span 
              style={{ 
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.125rem',
                color: 'hsl(30 20% 15%)'
              }}
            >
              {resort.pricePerNight}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(30 15% 45%)' }}> / night</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: 'hsl(42 65% 50%)' }}>★</span>
            <span 
              style={{ 
                fontSize: '0.875rem', 
                fontWeight: 300, 
                color: 'hsl(30 20% 15%)' 
              }}
            >
              {resort.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortCard;
```

### 4G. (OPTIONAL) Create `src/components/voice/StateToggle.tsx`

> **Note:** This component is ONLY for demo/testing purposes to manually switch states.
> **Skip this file** if your voice assistant state is controlled by your real-time API (OpenAI Realtime, etc.).

```tsx
"use client";

import React from 'react';
import { type DemoState } from './VoiceAssistantLayout';

interface StateToggleProps {
  currentState: DemoState;
  onStateChange: (state: DemoState) => void;
  className?: string;
}

const STATES: { value: DemoState; label: string }[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'listening', label: 'Listening' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'searching', label: 'Searching' },
  { value: 'results', label: 'Results' },
];

export const StateToggle: React.FC<StateToggleProps> = ({
  currentState,
  onStateChange,
  className = '',
}) => {
  return (
    <div 
      className={className}
      style={{
        position: 'fixed',
        top: '5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.375rem',
          background: 'hsl(30 20% 96% / 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '9999px',
          border: '1px solid hsl(30 15% 88% / 0.5)',
          boxShadow: '0 4px 20px hsl(30 20% 15% / 0.05)',
        }}
      >
        {STATES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onStateChange(value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 300,
              letterSpacing: '0.05em',
              transition: 'all 300ms',
              border: 'none',
              cursor: 'pointer',
              background: currentState === value ? 'hsl(15 55% 70%)' : 'transparent',
              color: currentState === value ? 'hsl(30 25% 98%)' : 'hsl(30 15% 45%)',
              boxShadow: currentState === value ? '0 2px 8px hsl(15 55% 70% / 0.3)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StateToggle;
```

### 4H. Create `src/components/voice/VoiceAssistantLayout.tsx`
```tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, LogIn, UserPlus } from 'lucide-react';
import { ParticleVisualization } from './ParticleVisualization';
import { AnimatedTranscript } from './AnimatedTranscript';
import { FloatingLocations } from './FloatingLocations';
import { ResortCard, type Resort } from './ResortCard';
import { type VoiceActivityLevel } from '@/lib/animations';

export type DemoState = 'idle' | 'listening' | 'speaking' | 'searching' | 'results';

interface VoiceAssistantLayoutProps {
  state: DemoState;
  transcript: string;
  results?: Resort[];
  className?: string;
}

export const VoiceAssistantLayout: React.FC<VoiceAssistantLayoutProps> = ({
  state,
  transcript,
  results = [],
  className = '',
}) => {
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [visibleResultCount, setVisibleResultCount] = useState(0);
  const prevStateRef = useRef<DemoState>(state);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      const interval = setInterval(() => {
        const baseWave = Math.sin(Date.now() * 0.008) * 0.3;
        const quickWave = Math.sin(Date.now() * 0.02) * 0.2;
        const noise = (Math.random() - 0.5) * 0.3;
        setVoiceIntensity(Math.max(0, Math.min(1, 0.4 + baseWave + quickWave + noise)));
      }, 50);

      return () => clearInterval(interval);
    } else {
      const fadeOut = () => {
        setVoiceIntensity(prev => {
          if (prev <= 0.01) return 0;
          return prev * 0.9;
        });
        if (voiceIntensity > 0.01) {
          animationRef.current = requestAnimationFrame(fadeOut);
        }
      };
      fadeOut();
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [state]);

  useEffect(() => {
    if (state === 'results' && results.length > 0) {
      if (prevStateRef.current !== 'results') {
        setShowResults(false);
        setVisibleResultCount(0);
        
        setTimeout(() => {
          setShowResults(true);
          
          results.forEach((_, index) => {
            setTimeout(() => {
              setVisibleResultCount(prev => prev + 1);
            }, index * 200);
          });
        }, 300);
      } else {
        setShowResults(true);
        setVisibleResultCount(results.length);
      }
    } else {
      setShowResults(false);
      setVisibleResultCount(0);
    }
    
    prevStateRef.current = state;
  }, [state, results]);

  const getActivity = (): VoiceActivityLevel => {
    switch (state) {
      case 'idle': return 'idle';
      case 'listening': return 'listening';
      case 'speaking': return 'speaking';
      case 'searching': return 'processing';
      case 'results': return 'idle';
      default: return 'idle';
    }
  };

  const isCompact = state === 'results' && showResults;

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  return (
    <div 
      className={className}
      style={{
        minHeight: '100vh',
        background: 'hsl(30 25% 98%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '5rem 1.5rem 0',
      }}
    >
      {/* Header */}
      <header 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          background: 'hsl(30 25% 98% / 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div 
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, hsl(15 55% 70%), hsl(35 45% 75%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'hsl(30 25% 98%)', fontWeight: 600, fontSize: '0.875rem' }}>V</span>
          </div>
          <span style={{ fontSize: '1.125rem', letterSpacing: '0.05em', color: 'hsl(30 20% 15%)' }}>Voyage</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: 'hsl(30 15% 45%)',
              background: 'transparent',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <LogIn style={{ width: '1rem', height: '1rem' }} />
            Login
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: 'hsl(30 25% 98%)',
              background: 'hsl(15 55% 70%)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <UserPlus style={{ width: '1rem', height: '1rem' }} />
            Join
          </button>
        </div>
      </header>

      {/* Audio controls */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50, display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => setIsMicMuted(!isMicMuted)}
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 300ms',
            boxShadow: '0 4px 12px hsl(30 20% 15% / 0.1)',
            border: isMicMuted ? '1px solid hsl(0 70% 50% / 0.3)' : '1px solid hsl(30 15% 88%)',
            background: isMicMuted ? 'hsl(0 70% 50% / 0.2)' : 'hsl(30 20% 96%)',
            color: isMicMuted ? 'hsl(0 70% 50%)' : 'hsl(15 55% 70%)',
            cursor: 'pointer',
          }}
          aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMicMuted ? <MicOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Mic style={{ width: '1.25rem', height: '1.25rem' }} />}
        </button>
        <button
          onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 300ms',
            boxShadow: '0 4px 12px hsl(30 20% 15% / 0.1)',
            border: isSpeakerMuted ? '1px solid hsl(0 70% 50% / 0.3)' : '1px solid hsl(30 15% 88%)',
            background: isSpeakerMuted ? 'hsl(0 70% 50% / 0.2)' : 'hsl(30 20% 96%)',
            color: isSpeakerMuted ? 'hsl(0 70% 50%)' : 'hsl(15 55% 70%)',
            cursor: 'pointer',
          }}
          aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
        >
          {isSpeakerMuted ? <VolumeX style={{ width: '1.25rem', height: '1.25rem' }} /> : <Volume2 style={{ width: '1.25rem', height: '1.25rem' }} />}
        </button>
      </div>

      {/* Main visualization area */}
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '56rem',
          transition: 'all 700ms ease-out',
          flex: isCompact ? 'none' : 1,
          justifyContent: isCompact ? 'flex-start' : 'center',
        }}
      >
        <div style={{ marginBottom: '1.5rem', transition: 'all 500ms' }}>
          <span 
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 200,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              color: 'hsl(30 15% 45%)',
              animation: state === 'searching' ? 'pulse 1s infinite' : 'pulseSoft 4s ease-in-out infinite',
            }}
          >
            {state === 'idle' && 'Ready'}
            {state === 'listening' && 'Listening...'}
            {state === 'speaking' && 'Speaking'}
            {state === 'searching' && 'Searching'}
            {state === 'results' && 'Found for you'}
          </span>
        </div>

        <div 
          style={{
            position: 'relative',
            transition: 'all 700ms ease-out',
            transform: isCompact ? 'scale(0.75)' : 'scale(1)',
            marginBottom: isCompact ? '-2rem' : 0,
          }}
        >
          <ParticleVisualization 
            activity={getActivity()} 
            voiceIntensity={voiceIntensity}
            size={350}
          />
          
          <FloatingLocations 
            isActive={state === 'searching'}
            radius={220}
          />
        </div>

        <div 
          style={{
            maxWidth: '42rem',
            width: '100%',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 500ms',
            marginTop: isCompact ? 0 : '2rem',
            marginBottom: isCompact ? '1.5rem' : '3rem',
          }}
        >
          {transcript && (
            <AnimatedTranscript 
              text={transcript}
              isActive={state === 'speaking'}
              speed="medium"
            />
          )}
        </div>
      </div>

      {/* Results grid */}
      <div 
        style={{
          width: '100%',
          maxWidth: '72rem',
          padding: '0 1rem 4rem',
          transition: 'all 700ms ease-out',
          opacity: showResults ? 1 : 0,
          transform: showResults ? 'translateY(0)' : 'translateY(2rem)',
          pointerEvents: showResults ? 'auto' : 'none',
        }}
      >
        {state === 'results' && results.length > 0 && (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {results.slice(0, visibleResultCount).map((resort, index) => (
              <div 
                key={resort.id}
                style={{ 
                  animation: 'fadeRise 0.8s ease-out forwards',
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                }}
              >
                <ResortCard 
                  resort={resort}
                  index={index}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branding */}
      <div 
        style={{ 
          position: 'absolute', 
          bottom: '1.5rem', 
          left: '50%', 
          transform: 'translateX(-50%)' 
        }}
      >
        <span 
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 200,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            color: 'hsl(30 15% 45% / 0.4)',
          }}
        >
          Voyage AI
        </span>
      </div>
    </div>
  );
};

export default VoiceAssistantLayout;
```

---

## PHASE 5: Usage Example

### For Real Integration (with OpenAI Realtime API)
```tsx
"use client";

import { VoiceAssistantLayout, type DemoState, type Resort } from '@/components/voice';

interface VoiceAssistantPageProps {
  // These come from your OpenAI Realtime API integration
  voiceState: DemoState;
  transcriptText: string;
  searchResults: Resort[];
}

export default function VoiceAssistantPage({ 
  voiceState, 
  transcriptText, 
  searchResults 
}: VoiceAssistantPageProps) {
  return (
    <VoiceAssistantLayout 
      state={voiceState}           // From OpenAI WebSocket state
      transcript={transcriptText}   // From Whisper transcription
      results={searchResults}       // From your hotel search API
    />
  );
}
```

### For Demo/Testing (with StateToggle)
```tsx
"use client";

import { useState } from 'react';
import { VoiceAssistantLayout, type DemoState, type Resort } from '@/components/voice';
import { StateToggle } from '@/components/voice/StateToggle'; // Only if you created it

const SAMPLE_RESORTS: Resort[] = [
  {
    id: '1',
    name: 'Amanpuri',
    location: 'Phuket, Thailand',
    description: 'Iconic resort with pavilions nestled in a coconut palm grove overlooking the Andaman Sea.',
    pricePerNight: '$1,200',
    rating: 4.9,
    amenities: ['Private Beach', 'Spa', 'Fine Dining'],
  },
  // ... more resorts
];

export default function DemoPage() {
  const [demoState, setDemoState] = useState<DemoState>('idle');
  const transcript = demoState === 'speaking' 
    ? "I found some wonderful beach resorts in Thailand for you..." 
    : "";

  return (
    <>
      <StateToggle currentState={demoState} onStateChange={setDemoState} />
      <VoiceAssistantLayout 
        state={demoState} 
        transcript={transcript}
        results={demoState === 'results' ? SAMPLE_RESORTS : []}
      />
    </>
  );
}
```

---

## PHASE 6: Final Verification Checklist

Open browser DevTools and run these checks:

### ✓ CSS Variables
```javascript
// Should return color value, not empty
getComputedStyle(document.body).getPropertyValue('--color-primary')
```

### ✓ Font Loading
```javascript
// Should return true after page load
document.fonts.check('1em Cormorant Garamond')
```

### ✓ Visual Checks
1. **Background**: Should be warm cream/off-white (NOT pure white)
2. **Buttons**: Should be muted rose/pink color
3. **Cards**: Should have glassmorphic backdrop blur
4. **Particle Animation**: Should show colorful particles (gold, navy, green, rose)
5. **Text**: Headings should use serif font, body should use Inter

---

## Troubleshooting

### Colors not working?
- Check that `@theme {}` block is in your CSS
- Tailwind v4 uses `--color-*` prefix, not just `--`
- Make sure CSS is imported in your layout

### Fonts not loading?
- Verify Google Fonts import is at top of CSS file
- Check Network tab for font files loading

### Animations not working?
- Verify keyframes are outside `@theme` block
- Check that animation classes are defined in utilities

### Import errors?
- Verify `@/` alias is configured in `tsconfig.json`
- All components need `"use client"` directive
