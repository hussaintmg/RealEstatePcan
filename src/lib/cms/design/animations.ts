export interface AnimationDefinition {
  key: string;
  name: string;
  category: 'Entrance' | 'Exit' | 'Scroll' | 'Stagger' | 'Storytelling' | 'Attention' | string;
  engine: 'css' | 'motion' | 'gsap';
  durationMs: number;
  delayMs?: number;
  easing: string;
  reducedMotionFallback: string;
  config: {
    distance?: string | number;
    staggerStepMs?: number;
    scrollTrigger?: {
      pin?: boolean;
      scrub?: boolean | number;
      start?: string;
      end?: string;
    };
    cssClass?: string;
  };
  description: string;
}

export const ANIMATION_REGISTRY: AnimationDefinition[] = [
  // CSS Animations (Micro-interactions & transitions)
  {
    key: 'anim-fade-in',
    name: 'Fade In',
    category: 'Entrance',
    engine: 'css',
    durationMs: 300,
    easing: 'ease-out',
    reducedMotionFallback: 'opacity: 1',
    config: { cssClass: 'animate-fade-in' },
    description: 'Clean opacity transition from 0 to 1 for cards and badges.',
  },
  {
    key: 'anim-reveal-up-subtle',
    name: 'Subtle Reveal Up',
    category: 'Entrance',
    engine: 'css',
    durationMs: 400,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    reducedMotionFallback: 'opacity: 1; transform: none',
    config: { distance: '16px', cssClass: 'animate-reveal-up' },
    description: 'Smooth upward translate of 16px with simultaneous fade-in.',
  },
  {
    key: 'anim-color-pulse',
    name: 'Subtle Color Pulse',
    category: 'Attention',
    engine: 'css',
    durationMs: 1500,
    easing: 'ease-in-out',
    reducedMotionFallback: 'none',
    config: { cssClass: 'animate-pulse' },
    description: 'Gentle cyclical background luminance shift for live status pills.',
  },
  {
    key: 'anim-scale-in',
    name: 'Scale In Dialog',
    category: 'Entrance',
    engine: 'css',
    durationMs: 250,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    reducedMotionFallback: 'opacity: 1; transform: none',
    config: { cssClass: 'animate-scale-in' },
    description: 'Slight zoom expansion from 95% to 100% scale for modal dialogs.',
  },
  {
    key: 'anim-border-glow',
    name: 'Border Glow Loop',
    category: 'Attention',
    engine: 'css',
    durationMs: 2000,
    easing: 'linear',
    reducedMotionFallback: 'border-color: var(--primary)',
    config: { cssClass: 'animate-glow' },
    description: 'Cyclical border glow traveling around featured property cards.',
  },

  // Framer Motion (UI state & component transitions)
  {
    key: 'anim-motion-drawer-slide',
    name: 'Framer Motion Drawer Slide',
    category: 'Entrance',
    engine: 'motion',
    durationMs: 350,
    easing: 'easeInOut',
    reducedMotionFallback: 'opacity: 1',
    config: { distance: '100%' },
    description: 'Hardware-accelerated sliding drawer transition for mobile menus.',
  },
  {
    key: 'anim-motion-stagger-grid',
    name: 'Stagger Children Listing Grid',
    category: 'Stagger',
    engine: 'motion',
    durationMs: 400,
    easing: 'easeOut',
    reducedMotionFallback: 'opacity: 1',
    config: { staggerStepMs: 80, distance: '24px' },
    description: 'Progressively reveals child cards with an 80ms wave cascade.',
  },
  {
    key: 'anim-motion-modal-backdrop',
    name: 'Modal Backdrop Fade & Blur',
    category: 'Entrance',
    engine: 'motion',
    durationMs: 300,
    easing: 'easeOut',
    reducedMotionFallback: 'opacity: 1',
    config: {},
    description: 'Smooth backdrop-blur and darkening transition for viewing modals.',
  },
  {
    key: 'anim-motion-accordion-expand',
    name: 'Accordion Smooth Height Expand',
    category: 'Entrance',
    engine: 'motion',
    durationMs: 300,
    easing: 'easeInOut',
    reducedMotionFallback: 'display: block',
    config: {},
    description: 'Animates height from 0 to auto without layout jumps.',
  },
  {
    key: 'anim-motion-tab-crossfade',
    name: 'Tab Content Crossfade',
    category: 'Entrance',
    engine: 'motion',
    durationMs: 250,
    easing: 'easeOut',
    reducedMotionFallback: 'opacity: 1',
    config: {},
    description: 'Crossfades content between Overview, Floorplans, and 3D Studio tabs.',
  },
  {
    key: 'anim-motion-badge-pop',
    name: 'Status Badge Spring Pop',
    category: 'Attention',
    engine: 'motion',
    durationMs: 400,
    easing: 'spring',
    reducedMotionFallback: 'transform: none',
    config: {},
    description: 'Playful bouncy spring entrance for "Just Listed" and "Sold" chips.',
  },
  {
    key: 'anim-motion-blur-reveal',
    name: 'Cinematic Blur Reveal',
    category: 'Entrance',
    engine: 'motion',
    durationMs: 500,
    easing: 'easeOut',
    reducedMotionFallback: 'filter: none; opacity: 1',
    config: { distance: '8px' },
    description: 'Transitions from 8px Gaussian blur and 0% opacity to crisp focus.',
  },
  {
    key: 'anim-motion-slide-mask',
    name: 'Curtain Slide Mask',
    category: 'Entrance',
    engine: 'motion',
    durationMs: 600,
    easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
    reducedMotionFallback: 'clip-path: none',
    config: {},
    description: 'Architectural wipe reveal using responsive clip-path masking.',
  },

  // GSAP & ScrollTrigger (Advanced storytelling & scrubbed sequences)
  {
    key: 'anim-gsap-pinned-story',
    name: 'GSAP Pinned Architectural Story',
    category: 'Storytelling',
    engine: 'gsap',
    durationMs: 1000,
    easing: 'none',
    reducedMotionFallback: 'position: relative',
    config: {
      scrollTrigger: {
        pin: true,
        scrub: 1,
        start: 'top top',
        end: '+=2000',
      },
    },
    description: 'Pins the viewport while scrubbing through narrative property chapters.',
  },
  {
    key: 'anim-gsap-parallax-layers',
    name: 'Multi-Depth Parallax Scroll',
    category: 'Scroll',
    engine: 'gsap',
    durationMs: 800,
    easing: 'power1.out',
    reducedMotionFallback: 'transform: none',
    config: {
      scrollTrigger: {
        scrub: 0.5,
        start: 'top bottom',
        end: 'bottom top',
      },
    },
    description: 'Moves background villa photography at a different velocity than foreground text.',
  },
  {
    key: 'anim-gsap-horizontal-showcase',
    name: 'Horizontal Showcase Gallery Scroll',
    category: 'Storytelling',
    engine: 'gsap',
    durationMs: 1200,
    easing: 'none',
    reducedMotionFallback: 'overflow-x: auto',
    config: {
      scrollTrigger: {
        pin: true,
        scrub: 1,
        start: 'top top',
        end: '+=3000',
      },
    },
    description: 'Translates vertical wheel scrolling into silky horizontal penthouse suite tour.',
  },
  {
    key: 'anim-gsap-scrub-camera-3d',
    name: 'Scroll-Scrubbed 3D Orbit Camera',
    category: 'Storytelling',
    engine: 'gsap',
    durationMs: 1000,
    easing: 'none',
    reducedMotionFallback: 'none',
    config: {
      scrollTrigger: {
        pin: true,
        scrub: 0.8,
        start: 'top top',
        end: '+=2500',
      },
    },
    description: 'Drives PlayCanvas 3D camera yaw and pitch directly from user scroll progress.',
  },
  {
    key: 'anim-gsap-text-split-reveal',
    name: 'Text Character Split Reveal',
    category: 'Entrance',
    engine: 'gsap',
    durationMs: 800,
    easing: 'power3.out',
    reducedMotionFallback: 'opacity: 1; transform: none',
    config: { staggerStepMs: 30 },
    description: 'Splits headline words into individually animated character spans.',
  },
  {
    key: 'anim-gsap-zoom-hero-image',
    name: 'Hero Image Scale Scrub',
    category: 'Scroll',
    engine: 'gsap',
    durationMs: 600,
    easing: 'power2.out',
    reducedMotionFallback: 'transform: none',
    config: {
      scrollTrigger: {
        scrub: true,
        start: 'top top',
        end: 'bottom top',
      },
    },
    description: 'Scales hero image smoothly from 1.0 to 1.15 as user scrolls down.',
  },
  {
    key: 'anim-gsap-sticky-amenities',
    name: 'Sticky Amenities Stagger Sequence',
    category: 'Storytelling',
    engine: 'gsap',
    durationMs: 1000,
    easing: 'power1.inOut',
    reducedMotionFallback: 'position: relative',
    config: {
      scrollTrigger: {
        pin: true,
        scrub: 1,
        start: 'top 20%',
        end: '+=1500',
      },
    },
    description: 'Sequentially swaps luxury amenity cards (Spa, Pool, Concierge, Heliport).',
  },
  {
    key: 'anim-gsap-countup-metric',
    name: 'Numerical Statistics Count-Up',
    category: 'Entrance',
    engine: 'gsap',
    durationMs: 1500,
    easing: 'power2.out',
    reducedMotionFallback: 'none',
    config: {},
    description: 'Counts numbers up smoothly (e.g. $250M Sold, 98% Occupancy).',
  },
  {
    key: 'anim-gsap-svg-draw',
    name: 'Architectural SVG Floorplan Draw',
    category: 'Entrance',
    engine: 'gsap',
    durationMs: 1200,
    easing: 'power2.inOut',
    reducedMotionFallback: 'stroke-dashoffset: 0',
    config: {},
    description: 'Traces architectural blueprint walls using SVG stroke-dashoffset animation.',
  },
  {
    key: 'anim-gsap-curtain-exit',
    name: 'Curtain Page Transition Exit',
    category: 'Exit',
    engine: 'gsap',
    durationMs: 500,
    easing: 'power3.inOut',
    reducedMotionFallback: 'opacity: 0',
    config: {},
    description: 'Wipes screen with solid brand color prior to route navigation.',
  },
  {
    key: 'anim-gsap-floating-particles',
    name: 'Floating Gold Shimmer Particles',
    category: 'Attention',
    engine: 'gsap',
    durationMs: 4000,
    easing: 'sine.inOut',
    reducedMotionFallback: 'none',
    config: {},
    description: 'Subtle floating micro-elements drifting across luxury hero section.',
  },
  {
    key: 'anim-gsap-curtain-drop',
    name: 'Dual Stage Curtain Drop',
    category: 'Entrance',
    engine: 'gsap',
    durationMs: 700,
    easing: 'power4.out',
    reducedMotionFallback: 'transform: none',
    config: {},
    description: 'Top and bottom panels open outwards to reveal penthouse panoramic view.',
  },
];

export function getAnimationByKey(key: string): AnimationDefinition {
  return ANIMATION_REGISTRY.find((a) => a.key === key) || ANIMATION_REGISTRY[0];
}
