import type { EffectMode } from "./effects";

const EFFECT_COPY: Record<EffectMode, { blurb: string; features: string[] }> = {
  orbit: {
    blurb:
      "A rotating cloud of points traced onto a sphere, drifting under its own idle spin with soft depth-based shading.",
    features: [
      "Points are distributed evenly across the sphere so density stays even at every rotation angle",
      "Depth-sorted shading fades points on the far side so the silhouette always reads correctly",
      "Idle spin runs continuously and can be paused or redirected on interaction",
    ],
  },
  starfield: {
    blurb:
      "Streaks of light radiate outward from a shared vanishing point, building a warp-speed field that never quite repeats.",
    features: [
      "Each streak gets its own speed and origin so the field avoids visible looping",
      "Additive blending keeps overlapping streaks bright without clipping to white",
      "Density and streak length scale independently for subtler or punchier looks",
    ],
  },
  flow: {
    blurb:
      "Layered ribbons drift and cross using overlapping sine waves, each faded at the edges with a soft gradient mask.",
    features: [
      "Multiple wave layers run at different frequencies so the motion never falls into a simple loop",
      "Edge-masked gradients keep the ribbons from hard-clipping at the frame boundary",
      "Line weight and glow respond to a single intensity control",
    ],
  },
  grid: {
    blurb:
      "A field of cells pulses outward from the center in concentric rings, driven by a simple distance-based wave function.",
    features: [
      "Cell brightness is derived from distance to center, so the ripple scales cleanly to any grid size",
      "Runs entirely on canvas with no DOM nodes per cell, keeping large grids cheap to animate",
      "Wave speed and cell size are independently tunable",
    ],
  },
  tunnel: {
    blurb:
      "Particles travel along radial spokes toward the center, with depth-based fading standing in for perspective.",
    features: [
      "Spoke count and particle spread are decoupled so the tunnel can look sparse or dense",
      "Depth fade approximates perspective without a full 3D camera",
      "Particles respawn on a randomized cycle so the loop point is never obvious",
    ],
  },
  liquid: {
    blurb:
      "Soft, blurred blobs drift and merge using overlapping radial gradients, approximating a gooey liquid surface.",
    features: [
      "A single blur filter fuses overlapping gradients into a convincing metaball look",
      "Blob paths use independent sine offsets so motion stays organic rather than mechanical",
      "Additive blending lets overlapping blobs brighten naturally where they meet",
    ],
  },
  snow: {
    blurb:
      "Small particles drift downward with independent speed, drift, and opacity for a naturalistic falling effect.",
    features: [
      "Per-particle speed and horizontal sway avoid the uniform look of a single shared animation curve",
      "Particles wrap seamlessly from bottom back to top for an endless loop",
      "Density, size, and wind can all be tuned independently",
    ],
  },
  carousel: {
    blurb:
      "Panels rotate around a shared vertical axis, scaling and fading by depth to fake a three-dimensional carousel.",
    features: [
      "Depth-based scale and opacity stand in for true 3D perspective at a fraction of the cost",
      "Rotation speed and panel count are independent, so density can flex without changing pacing",
      "Designed to drop in real images or video in place of the placeholder panels",
    ],
  },
  cursor: {
    blurb:
      "A custom pointer traces a smooth lissajous path with a fading trail of ghost dots behind it.",
    features: [
      "Trail length and fade rate are independently tunable",
      "The path is generated from two out-of-phase sine waves so it never retraces itself exactly",
      "Swappable pointer glyph for different cursor styles",
    ],
  },
  loader: {
    blurb:
      "A gradient arc sweeps around a static track, giving continuous feedback without a fixed start or end point.",
    features: [
      "The gradient sweep avoids the harsh cut-off of a solid-color spinner",
      "Rotation speed and arc length are both configurable",
      "Minimal enough to drop into buttons, cards, or full-page loading states",
    ],
  },
  text: {
    blurb:
      "A headline gets a glitch-and-shine treatment: colour-split ghosting punctuated by a slow light sweep.",
    features: [
      "Ghost offsets only trigger occasionally, keeping the base text legible most of the time",
      "The shine sweep is a moving gradient stop rather than a masked overlay, so it scales to any string",
      "Works with any font size or weight without re-tuning",
    ],
  },
  game: {
    blurb:
      "A minimal two-paddle simulation runs continuously in the background, evoking classic arcade play.",
    features: [
      "Ball and paddle motion use independent sine cycles so rallies never look scripted",
      "Center line and paddle styling are easy to restyle to match a theme",
      "Runs at a light frame budget so it's safe as a background loop",
    ],
  },
};

export function getCopy(effect: EffectMode) {
  return EFFECT_COPY[effect];
}
