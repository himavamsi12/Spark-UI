// Maps a component slug to its source file basename under
// src/components/originals/. Generated from the ORIGINAL_COMPONENTS registry;
// display names do not reliably match file names, so this mapping is explicit.
export const ORIGINAL_SOURCE_FILES: Record<string, string> = {
  "cassette-menu": "CassetteMenu",
  "circular-gallery": "CircularGallery",
  "list-hover-cards": "ListHoverCards",
  "grid-reveal-hero": "GridRevealHero",
  "inline-hover-image": "InlineHoverImage",
  "split-flicker-menu": "SplitFlickerMenu",
  "orbit-slider": "OrbitSlider",
  "gooey-text-reveal": "GooeyTextReveal",
  "counter-reveal-hero": "CounterRevealHero",
  "dual-column-slider": "DualColumnSlider",
  "confetti-reveal": "ConfettiReveal",
  "perpetual-slider": "PerpetualSlider",
  "grid-deform-video": "GridDeformVideo",
  "ascii-hand-footer": "AsciiHandFooter",
  "magnetic-marquee": "MagneticMarquee",
  "clip-mask-page-transition": "ClipMaskPageTransition",
  "grid-wipe-transition": "GridWipeTransition",
  "outfit-reveal": "OutfitReveal",
  "starfield-scroll": "StarfieldScroll",
  "name-reveal-scroll": "NameRevealScroll",
  "spotlight-zoom-scroll": "SpotlightZoomScroll",
  "slit-reveal-scroll": "SlitRevealScroll",
  "stroke-draw-reveal": "StrokeDrawReveal",
  "grid-shutter-transition": "GridShutterTransition",
  "dissolve-image-reveal": "DissolveImageReveal",
  "mosaic-flip-hover": "MosaicFlipHover",
  "lens-zoom-scroll": "LensZoomScroll",
  "accordion-frames": "AccordionFrames",
  "magnetic-cards": "MagneticCards",
  "steelworks-reveal": "SteelworksReveal",
};

export function sourceFileFor(slug: string): string | undefined {
  return ORIGINAL_SOURCE_FILES[slug];
}
