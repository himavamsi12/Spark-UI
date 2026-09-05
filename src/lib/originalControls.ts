import type { ControlDef } from "./controls";
import type { Params } from "./effects";

export type OriginalEntry = {
  key: string;
  name: string;
  category: string;
  blurb: string;
  features: string[];
  controls: ControlDef[];
};

function defaultsFrom(controls: ControlDef[]): Params {
  const p: Params = {};
  for (const c of controls) p[c.key] = c.default;
  return p;
}

export const ORIGINALS: OriginalEntry[] = [
  {
    key: "cassette-menu",
    name: "Cassette Menu",
    category: "Navigation",
    blurb: "A retro cassette-tape menu overlay: tapes and a player slide in from below and fan out into place when the nav toggle is pressed, then snap back on close.",
    features: [
      "Two GSAP timelines (open/close) drive every element from one shared toggle state, with proper interrupt handling via overwrite: \"auto\"",
      "Tapes fan out horizontally on desktop and stack vertically on narrow containers, computed per-index inside the tween",
      "clip-path reveal on the overlay plus a bleeding radial 'bloom' circle gives the panel a soft analog feel",
      "A single speed control rescales every timeline duration and offset together, so the whole sequence stays in sync",
    ],
    controls: [
      { key: "overlayColor", label: "Overlay Color", type: "color", default: "#7b70f5", description: "Background color of the menu panel." },
      { key: "bloomColor", label: "Bloom Color", type: "color", default: "#beb9f9", description: "Color of the soft circular bloom behind the tapes." },
      { key: "accentColor", label: "Button Color", type: "color", default: "#f5e089", description: "Background color of the logo and menu toggle buttons." },
      { key: "heroText", label: "Hero Text", type: "text", default: "Slide One Out", description: "Heading shown behind the menu." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-google-sans-flex)", description: "Typeface used for the hero heading." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the hero heading." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 40, max: 220, step: 10, description: "Playback speed of the open/close timelines, as a percentage of the base rate." },
    ],
  },
  {
    key: "circular-gallery",
    name: "Circular Gallery",
    category: "Gallery",
    blurb: "A ring of photos tilts into an oval and spins on scroll, easing toward an idle drift and dimming everything but the hovered frame.",
    features: [
      "Ring position is computed per-frame from a tilted oval projection, not a CSS transform chain",
      "Scroll velocity accelerates the spin and decays back to an idle rate via simple easing, no ScrollTrigger needed",
      "Hover detection uses elementFromPoint against the live pointer position so it stays correct as the ring rotates under the cursor",
    ],
    controls: [
      { key: "centerLabel", label: "Center Label", type: "text", default: "origin", description: "Text in the badge at the centre of the ring." },
      { key: "speed", label: "Idle Speed", type: "slider", default: 100, min: 20, max: 250, step: 10, description: "Baseline rotation speed the ring eases back to." },
      { key: "tiltAngle", label: "Tilt Angle", type: "slider", default: -20, min: -45, max: 45, step: 5, description: "Tilt of the oval the images travel around." },
      { key: "hoverScale", label: "Hover Scale (%)", type: "slider", default: 110, min: 100, max: 140, step: 5, description: "Scale applied to the frame under the cursor." },
      { key: "dimStrength", label: "Dim Strength (%)", type: "slider", default: 65, min: 0, max: 90, step: 5, description: "How much non-hovered frames darken and desaturate." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-dm-sans), sans-serif", description: "Typeface used for the caption." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the caption." },
    ],
  },
  {
    key: "list-hover-cards",
    name: "List Hover Preview Cards",
    category: "Animations",
    blurb: "Hovering a line in a vertical list pops four polaroid-style images into view around it, following the cursor and nudging neighboring rows.",
    features: [
      "Neighboring row heights redistribute using inverse-distance weighting, so the whole list breathes around the hovered line",
      "Preview cards get a fresh random jitter position and rotation on every hover for a hand-scattered feel",
      "A default/alt label pair cross-fades with a blur + scale flourish instead of a plain opacity swap",
    ],
    controls: [
      { key: "bgColor", label: "Background", type: "color", default: "#0f0f0f", description: "Panel background color." },
      { key: "textColor", label: "Text Color", type: "color", default: "#ffffff", description: "Label and card border color." },
      { key: "growth", label: "Row Growth (%)", type: "slider", default: 50, min: 10, max: 100, step: 10, description: "How much the hovered row grows relative to its neighbors." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-host-grotesk), sans-serif", description: "Typeface used for the list labels." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the list labels." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 40, max: 200, step: 10, description: "Playback speed of every hover transition." },
    ],
  },
  {
    key: "grid-reveal-hero",
    name: "Grid Reveal Hero",
    category: "Animations",
    blurb: "A tile grid fades in with a progress marker hopping across it, then the whole grid collapses upward to reveal a headline built from sliding characters.",
    features: [
      "Grid density is computed from the container's own size, not the viewport, so it tiles cleanly at any preview size",
      "The progress marker uses GSAP Flip to hop between tiles instead of manually tweening position and size",
      "Title characters and subtitle lines use SplitText masks so they slide up from fully clipped, not just faded",
    ],
    controls: [
      { key: "accentColor", label: "Accent Color", type: "color", default: "#c4d600", description: "Tile and progress-marker accent color." },
      { key: "bgColor", label: "Backdrop", type: "color", default: "#e1e1e1", description: "Color behind the tile grid." },
      { key: "title", label: "Title", type: "text", default: "Frme", description: "Big headline revealed after the grid collapses." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-dm-sans), sans-serif", description: "Typeface used for all text." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of every text element." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 50, max: 200, step: 10, description: "Playback speed of the whole reveal sequence." },
    ],
  },
  {
    key: "inline-hover-image",
    name: "Inline Hover Image",
    category: "Text",
    blurb: "A tiny dot sitting inline in a heading expands into an image card that tilts and drifts toward the cursor while hovered.",
    features: [
      "The card eases toward the pointer with its own lerp loop rather than snapping directly to cursor position",
      "3D tilt is derived from cursor offset within the card bounds and clamped to a max angle",
      "Collapses back to a single inline character width on mouse leave, so it never disturbs the surrounding text layout",
    ],
    controls: [
      { key: "images", label: "Images", type: "imageList", default: ["/inline-hover/img1.jpg", "/inline-hover/img2.jpg", "/inline-hover/img3.jpg"], description: "Images revealed by the inline spots." },
      { key: "textColor", label: "Text Color", type: "color", default: "#0f0f0f", description: "Heading and card border color." },
      { key: "tiltMax", label: "Max Tilt (deg)", type: "slider", default: 20, min: 5, max: 40, step: 5, description: "Maximum 3D tilt angle applied to the expanded card." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-barlow-condensed), sans-serif", description: "Typeface used for the heading." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the heading text." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 40, max: 200, step: 10, description: "Speed of the expand/collapse transitions." },
    ],
  },
  {
    key: "split-flicker-menu",
    name: "Split Flicker Menu",
    category: "Navigation",
    blurb: "A fullscreen nav list reveals itself with SplitText character masks staggered per row, while the toggle label flickers between Menu and Close.",
    features: [
      "Every label uses a SplitText character mask so each row unveils letter-by-letter instead of fading in as a block",
      "The toggle button's text swap plays a randomized per-character opacity flicker instead of a plain swap",
      "One shared timeline drives every row's index, divider, and label together, then just plays or reverses on toggle",
    ],
    controls: [
      { key: "brand", label: "Brand", type: "text", default: "Obscura", description: "Wordmark in the top bar." },
      { key: "menuLabel", label: "Menu Label", type: "text", default: "Menu", description: "Label on the menu toggle." },
      { key: "items", label: "Menu Items", type: "textList", default: ["Work", "Portfolio", "Retrospective", "Lens", "Selected", "Enquire"], description: "Links listed in the menu." },
      { key: "textColor", label: "Text Color", type: "color", default: "#e0e0ca", description: "Menu label and index color." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-dm-sans), sans-serif", description: "Typeface used for the menu labels." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the menu labels." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 40, max: 220, step: 10, description: "Playback speed of the open/close timeline." },
    ],
  },
  {
    key: "orbit-slider",
    name: "3D Orbit Slider",
    category: "Gallery",
    blurb: "A ring of photo panels orbits in 3D space, driven by scroll and gently auto-rotating, with the whole stage tilting toward the cursor.",
    features: [
      "Panels are placed with rotateY + translateZ around a shared orbit, so perspective handles the sizing for free",
      "Scroll input and idle auto-rotation both feed the same eased rotation target, so they blend without conflict",
      "A single active-slide title/preview pair updates only when the nearest panel index actually changes",
    ],
    controls: [
      { key: "autoRotate", label: "Auto Rotate", type: "toggle", default: true, description: "Keep the ring gently spinning when idle." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Auto-rotation and scroll sensitivity multiplier." },
      { key: "tiltMax", label: "Stage Tilt (deg)", type: "slider", default: 30, min: 0, max: 45, step: 5, description: "How far the whole stage tilts toward the cursor." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-commit-mono), monospace", description: "Typeface used for the title tag." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the title tag." },
    ],
  },
  {
    key: "gooey-text-reveal",
    name: "Gooey Text Reveal",
    category: "Text",
    blurb: "A heading's lines blur in from a heavy soft focus to fully sharp, run through an SVG gooey filter so the blur clumps rather than smears evenly.",
    features: [
      "An SVG feColorMatrix filter sharpens the alpha channel so the CSS blur reads as gooey clumps instead of a flat haze",
      "SplitText breaks the heading into masked lines so each line's blur layer can animate independently",
      "Pure CSS filter animation once split, with no canvas or WebGL involved",
    ],
    controls: [
      { key: "text", label: "Text", type: "text", default: "The Weight of Old Light", description: "Heading text that blurs into focus." },
      { key: "color", label: "Text Color", type: "color", default: "#f5f5f0", description: "Heading text color." },
      { key: "bgColor", label: "Background", type: "color", default: "#0f0f0f", description: "Panel background color." },
      { key: "gooey", label: "Gooey Filter", type: "toggle", default: true, description: "Toggle the SVG gooey filter on the blur." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-de-fonte-plus)", description: "Typeface used for the heading." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the heading." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 40, max: 220, step: 10, description: "Speed of the blur-to-sharp reveal." },
    ],
  },
  {
    key: "counter-reveal-hero",
    name: "Counter Reveal Hero",
    category: "Animations",
    blurb: "A loading screen counts to 100 while cycling a word and an image, then wipes away as the hero headline slides in from both sides and the thumbnail grows to fill the frame.",
    features: [
      "Counter, word cycle, and image cycle all ride the same timeline progress value instead of separate timers, so they stay in lockstep",
      "The thumbnail's fullscreen expansion is computed from its live bounding box, so it grows from wherever it actually sits",
      "Headline words are SplitText-masked and slide in from opposite edges depending on their row",
    ],
    controls: [
      { key: "eyebrow", label: "Eyebrow", type: "text", default: "Currently Developing", description: "Small label above the counter." },
      { key: "words", label: "Words", type: "textList", default: ["Studios", "Season", "Chamber", "Archive", "Vision"], description: "Words cycled by the counter." },
      { key: "accentColor", label: "Preloader Color", type: "color", default: "#272d2d", description: "Background color of the loading screen." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-neue-montreal)", description: "Typeface used for all text." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of every text element." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 50, max: 200, step: 10, description: "Playback speed of the whole reveal sequence." },
    ],
  },
  {
    key: "dual-column-slider",
    name: "Dual Column Infinite Slider",
    category: "Gallery",
    blurb: "Two columns of images scroll in opposite directions, each slide wiping in and out with a clip-path reveal driven by wheel input.",
    features: [
      "Slides are created and destroyed on demand around the current scroll position, so the DOM stays small no matter how far you scroll",
      "Each column's reveal shape is a clip-path polygon animated purely by scroll offset, no per-slide tween needed",
      "An idle auto-drift keeps the columns moving gently until the first real scroll input takes over",
    ],
    controls: [
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Scroll sensitivity and auto-drift speed." },
      { key: "autoPlay", label: "Auto Drift", type: "toggle", default: true, description: "Keep the columns drifting when idle." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-inter), sans-serif", description: "Typeface used for the slide titles." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the slide titles." },
    ],
  },
  {
    key: "confetti-reveal",
    name: "Confetti Burst Reveal",
    category: "Animations",
    blurb: "A circular preloader wipes open, food photos burst outward and float, then fling off-screen as the hero fades in behind them.",
    features: [
      "A single timeline drives the circular wipe, the burst-out, the idle float loop, and the fling-off exit in sequence",
      "Each photo gets its own randomized float tween started only once it reaches its resting position",
      "The nav mark and hero accent circle scale in sync with the photos so the whole reveal reads as one gesture",
    ],
    controls: [
      { key: "bgColor", label: "Background", type: "color", default: "#17100a", description: "Preloader and canvas background color." },
      { key: "revealColor", label: "Accent Color", type: "color", default: "#f75828", description: "Color of the logo marks and hero accent circle." },
      { key: "heroText", label: "Hero Text", type: "text", default: "The table you will keep coming back to every week", description: "Headline shown once the preloader clears.", multiline: true },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-instrument-sans), sans-serif", description: "Typeface used for all text." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of every text element." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 50, max: 200, step: 10, description: "Playback speed of the whole reveal sequence." },
    ],
  },
  {
    key: "perpetual-slider",
    name: "Perpetual Motion Slider",
    category: "Gallery",
    blurb: "An infinite drag/scroll slider where each panel's width grows exponentially with distance from center, so panels stream past faster the further they travel.",
    features: [
      "Panel edges are positioned with an exponential growth curve, not fixed widths, so the stream naturally accelerates outward",
      "Slide DOM nodes are recycled and reindexed every frame rather than created per scroll position",
      "Responds to wheel, touch drag, and pointer drag with the same eased scroll-target model",
    ],
    controls: [
      { key: "title", label: "Title", type: "text", default: "Perpetual Motion", description: "Headline shown over the slider." },
      { key: "autoPlay", label: "Auto Drift", type: "toggle", default: true, description: "Keep the stream drifting when idle." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-neue-montreal)", description: "Typeface used for the title." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the title." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Scroll and drag sensitivity multiplier." },
    ],
  },
  {
    key: "grid-deform-video",
    name: "Grid Deformation Video",
    category: "Background",
    blurb: "A looping video is rendered through a WebGL shader that displaces pixels around the cursor and splits color channels, like a heat-warped CRT feed.",
    features: [
      "Cursor velocity is written into a low-res data texture each frame, which a fragment shader reads to displace and chromatically split the video",
      "The displacement field relaxes back to zero on its own, so the ripple trails naturally without any manual decay loop",
      "The video plane always fills its container via a cover-fit computed from the video's real aspect ratio",
    ],
    controls: [
      { key: "strength", label: "Displacement Strength", type: "slider", default: 100, min: 20, max: 250, step: 10, description: "How far the cursor's motion pushes pixels around." },
      { key: "aberration", label: "Chromatic Split", type: "slider", default: 100, min: 0, max: 250, step: 10, description: "Strength of the RGB channel split at the displaced edges." },
      { key: "gridSize", label: "Grid Resolution", type: "slider", default: 25, min: 10, max: 50, step: 5, description: "Resolution of the displacement field grid." },
    ],
  },
  {
    key: "ascii-hand-footer",
    name: "ASCII Hand Footer",
    category: "Text",
    blurb: "Two hand photos are re-rendered as monospaced ASCII glyphs on canvas, with a hover trail that lights up clusters of characters as the cursor passes.",
    features: [
      "Each image is sampled into a low-res pixel grid once, mapping brightness to a ramp of ASCII characters",
      "Hovering finds the nearest character cell and lights up a short random walk of neighboring cells for a spreading trail effect",
      "Heading and link text reveal with SplitText masks while the hands drift gently with the cursor via a parallax loop",
    ],
    controls: [
      { key: "charColor", label: "Glyph Color", type: "color", default: "#803500", description: "Color of the resting ASCII characters." },
      { key: "hoverColor", label: "Hover Color", type: "color", default: "#ff6a00", description: "Highlight color for the hovered character trail." },
      { key: "headingLeft", label: "Left Heading", type: "text", default: "Blank", description: "Left-side footer headline." },
      { key: "headingRight", label: "Right Heading", type: "text", default: "Canvas", description: "Right-side footer headline." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-instrument-sans), sans-serif", description: "Typeface used for all text." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of every text element." },
    ],
  },
  {
    key: "magnetic-marquee",
    name: "Magnetic Spotlight Marquee",
    category: "Animations",
    blurb: "A background image marquee follows the cursor vertically with a soft lag, drifting between the top and bottom edges of the panel like a magnetized strip.",
    features: [
      "The marquee strip is cloned enough times to tile seamlessly, then scrolled with a wrapping modifier so the loop point is invisible",
      "Vertical position eases toward the cursor with its own lerp loop, independent of the horizontal scroll tween",
      "Foreground text sits in mix-blend-mode difference so it stays legible over the moving strip regardless of image brightness",
    ],
    controls: [
      { key: "images", label: "Marquee Images", type: "imageList", default: ["/magnetic-marquee/marquee-img-1.jpg", "/magnetic-marquee/marquee-img-2.jpg", "/magnetic-marquee/marquee-img-3.jpg", "/magnetic-marquee/marquee-img-4.jpg", "/magnetic-marquee/marquee-img-5.jpg", "/magnetic-marquee/marquee-img-6.jpg"], description: "Images tiled across the moving strip." },
      { key: "title", label: "Title", type: "text", default: "Spark Studio", description: "Main studio name." },
      { key: "subtitle", label: "Subtitle", type: "text", default: "Making stuff others try to copy", description: "Supporting tagline." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-instrument-serif), Georgia, serif", description: "Typeface used for the title and subtitle." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the title and subtitle." },
      { key: "speed", label: "Marquee Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Horizontal scroll speed of the image strip." },
    ],
  },
  {
    key: "clip-mask-page-transition",
    name: "Clip Mask Page Transition",
    category: "Navigation",
    blurb: "Switching between pages sweeps four horizontal bands across the screen, lifts a wordmark up through them, then peels the bands away to reveal the next full-bleed image.",
    features: [
      "Four bands scale in from their left edge on a 0.075s stagger, then out toward their right edge, so the cover and the reveal read as opposite sweeps",
      "Page content is swapped at the exact moment the bands have the screen covered, so the swap is never seen",
      "Each word of the overlay wordmark rides up out of its own mask on a stagger, overlapping the band sweep rather than following it",
    ],
    controls: [
      { key: "images", label: "Page Images", type: "imageList", default: ["/clip-mask-transition/img1.jpg", "/clip-mask-transition/img2.jpg", "/clip-mask-transition/img3.jpg"], description: "Background image for each page." },
      { key: "brand", label: "Brand Name", type: "text", default: "Emberfall", description: "Wordmark shown in the nav bar." },
      { key: "overlayText", label: "Overlay Text", type: "text", default: "Your Brand Name", description: "Words that rise up while the bands cover the page." },
      { key: "overlayColor", label: "Overlay Color", type: "color", default: "#f2f0e6", description: "Colour of the bands that sweep across." },
      { key: "fontFamily", label: "Display Font", type: "font", default: "var(--font-instrument-serif), serif", description: "Typeface for the page title and the overlay wordmark." },
      { key: "navFont", label: "Nav Font", type: "font", default: "var(--font-instrument-sans), sans-serif", description: "Typeface used for the nav bar." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the nav and page title." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 50, max: 200, step: 10, description: "Playback speed of each page transition." },
      { key: "autoPlay", label: "Auto Play", type: "toggle", default: true, description: "Automatically cycle through pages." },
    ],
  },
  {
    key: "grid-wipe-transition",
    name: "Grid Wipe Transition",
    category: "Navigation",
    blurb: "A row of horizontal blocks sweeps across the screen from alternating edges to mask each page swap, with a wordmark unmasking in sync at the covered moment.",
    features: [
      "Blocks scale from zero width with alternating transform origins, so the sweep visually reverses direction between cover and uncover",
      "The brand wordmark uses a SplitText word mask timed to peek out only while the blocks fully cover the screen",
      "Each word of the overlay wordmark rides up out of its own mask on a stagger, overlapping the band sweep rather than following it",
    ],
    controls: [
      { key: "images", label: "Page Images", type: "imageList", default: ["/grid-wipe-transition/img1.jpg", "/grid-wipe-transition/img2.jpg", "/grid-wipe-transition/img3.jpg"], description: "Background image for each page." },
      { key: "brand", label: "Brand Name", type: "text", default: "Your Brand", description: "Wordmark revealed mid-transition." },
      { key: "gridColor", label: "Grid Color", type: "color", default: "#f2f0e6", description: "Fill color of the sweeping blocks." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-dm-sans), sans-serif", description: "Typeface used for the page title and wordmark." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the page title and wordmark." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 50, max: 200, step: 10, description: "Playback speed of each page transition." },
      { key: "autoPlay", label: "Auto Play", type: "toggle", default: true, description: "Automatically cycle through pages." },
    ],
  },
  {
    key: "outfit-reveal",
    name: "Archive Landing Reveal",
    category: "Animations",
    blurb: "A preloader cross-fades six clipped photos in and out around a counting-up percentage, then peels away as the giant headline and nav split-text in.",
    features: [
      "Photos animate both clip-path and scale together, so they iris open into full frames rather than just fading in",
      "The counter is a plain tweened number rather than a setInterval loop, so it can share easing with the rest of the timeline",
      "Nav links, headline, and footer labels all use SplitText masks so every reveal clips cleanly instead of just fading",
    ],
    controls: [
      { key: "images", label: "Preloader Images", type: "imageList", default: ["/outfit-reveal/img1.jpg", "/outfit-reveal/img2.jpg", "/outfit-reveal/img3.jpg", "/outfit-reveal/img4.jpg", "/outfit-reveal/img5.jpg", "/outfit-reveal/img6.jpg"], description: "Photos that fan out during the preloader." },
      { key: "brand", label: "Brand Name", type: "text", default: "Archive", description: "Wordmark used in the nav, hero, and preloader." },
      { key: "accentColor", label: "Ink Color", type: "color", default: "#141414", description: "Preloader background and hero text color." },
      { key: "bgColor", label: "Hero Background", type: "color", default: "#e0e2db", description: "Background color of the hero section." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-neue-montreal)", description: "Typeface used for all text." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of every text element." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 50, max: 200, step: 10, description: "Playback speed of the whole reveal sequence." },
    ],
  },
  {
    key: "starfield-scroll",
    name: "Starfield Scroll",
    category: "Background",
    blurb: "A canvas starfield accelerates its streaks outward from a central hole as progress advances, while three headlines cross-fade and scale through the same timeline.",
    features: [
      "Each star is a gradient line stroke whose length, opacity, and travel distance are all derived from one shared progress value",
      "Star colors are drawn from a weighted palette so cooler hues dominate while warmer ones stay rare accents",
      "Headline words fade in and out with SplitText, staged so only one heading is legible at a time",
    ],
    controls: [
      { key: "headers", label: "Headlines", type: "textList", default: ["The whole galaxy opens up", "Leaving the known world behind", "And then everything goes still"], description: "The three cross-fading headlines.", max: 3 },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-dm-sans), sans-serif", description: "Typeface used for the headlines." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the headlines." },
      { key: "autoPlay", label: "Auto Play", type: "toggle", default: true, description: "Sweep the timeline automatically back and forth." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Auto-play and scroll sensitivity multiplier." },
    ],
  },
  {
    key: "name-reveal-scroll",
    name: "Name Mask Reveal Scroll",
    category: "Text",
    blurb: "Project wordmarks unroll and roll back up via a vertical scale mask as progress advances, each one handing off to the next while a matching photo scales in and drifts away.",
    features: [
      "Every name and photo shares one continuous progress value, so handoffs between steps never desync",
      "The scale-mask reveal uses a different transform origin on the way in versus the way out, producing an unroll/reroll feel instead of a plain fade",
      "Photos scale up then drift upward on exit rather than simply disappearing, adding a sense of forward motion",
    ],
    controls: [
      { key: "images", label: "Project Images", type: "imageList", default: ["/name-reveal-scroll/project_img_1.jpg", "/name-reveal-scroll/project_img_2.jpg", "/name-reveal-scroll/project_img_3.jpg", "/name-reveal-scroll/project_img_4.jpg", "/name-reveal-scroll/project_img_5.jpg", "/name-reveal-scroll/project_img_6.jpg"], description: "One image per project step." },
      { key: "labels", label: "Names", type: "textList", default: ["INDEX", "AR-0472", "VX-2210", "KL-8834", "TN-1197", "MR-6650", "SC-3389"], description: "One label per name/step, first is the header." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-dm-sans), sans-serif", description: "Typeface used for the names." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the names." },
      { key: "autoPlay", label: "Auto Play", type: "toggle", default: true, description: "Sweep through the sequence automatically." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Auto-play and scroll sensitivity multiplier." },
    ],
  },
  {
    key: "spotlight-zoom-scroll",
    name: "Spotlight Zoom Scroll",
    category: "Gallery",
    blurb: "A three-column photo collage zooms out and a corner logo scales down into place as progress advances, while a headline fades in word by word underneath.",
    features: [
      "Gallery scale, logo scale, and per-word headline opacity are all driven from the same 0-1 progress value with independently mapped ranges",
      "The logo's scale-down anchors from its own bottom-left corner, so it settles precisely into its resting nav position",
      "Headline words and the CTA button share one staggered fade window instead of separate timelines",
    ],
    controls: [
      { key: "images", label: "Gallery Images", type: "imageList", default: ["/spotlight-zoom-scroll/img1.jpg", "/spotlight-zoom-scroll/img2.jpg", "/spotlight-zoom-scroll/img3.jpg", "/spotlight-zoom-scroll/img4.jpg", "/spotlight-zoom-scroll/img5.jpg", "/spotlight-zoom-scroll/img6.jpg", "/spotlight-zoom-scroll/img7.jpg", "/spotlight-zoom-scroll/img8.jpg", "/spotlight-zoom-scroll/img9.jpg"], description: "Photos laid out across the three columns." },
      { key: "headline", label: "Headline", type: "text", default: "A living catalogue of images that shouldn't exist, collected frame by frame from the edge of the real.", description: "Copy revealed word by word.", multiline: true },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-plus-jakarta-sans), sans-serif", description: "Typeface used for the headline." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of the headline." },
      { key: "autoPlay", label: "Auto Play", type: "toggle", default: true, description: "Sweep the zoom automatically." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Auto-play and scroll sensitivity multiplier." },
    ],
  },
  {
    key: "slit-reveal-scroll",
    name: "Slit Reveal Scroll",
    category: "Animations",
    blurb: "A full-bleed hero pinches into a thin vertical slit, rotates and scales away to reveal a two-column background, then an outro wipes in from top and bottom with a masked closing line.",
    features: [
      "Four distinct phases share one progress value, each mapped to its own sub-range so they chain without gaps or overlaps",
      "The closing slit is a clip-path polygon animated on two edges independently, not a single width tween",
      "The outro's two images wipe in from opposite edges via independent clip-path bands, meeting in the middle",
    ],
    controls: [
      { key: "accentColor", label: "Accent Color", type: "color", default: "#e12c1a", description: "Overlay wash and heading accent color." },
      { key: "outroText", label: "Outro Text", type: "text", default: "You become the shape that the light finally learns to find.", description: "Closing line revealed at the end.", multiline: true },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-neue-montreal)", description: "Typeface used for all text." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of every text element." },
      { key: "autoPlay", label: "Auto Play", type: "toggle", default: false, description: "Off matches the reference, which only moves with the scroll. Sweep through the phases automatically." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Auto-play and scroll sensitivity multiplier." },
    ],
  },
  {
    key: "stroke-draw-reveal",
    name: "Stroke Draw Reveal",
    category: "Text",
    blurb: "A field of thick curved strokes draws itself on out of sequence to fully cover a message, holds, then draws off again in reverse order to reveal the payoff line: with sparkles popping as the cover completes.",
    features: [
      "Each stroke is drawn using a stroke-dashoffset tween, with the draw order deliberately non-linear so the cover feels organic rather than mechanical",
      "A darker outline copy sits beneath each colored stroke, giving every curve a hand-inked edge without an SVG filter",
      "Sparkles pop in with a back-out ease exactly as the covering strokes finish, timed off the same shared timeline",
    ],
    controls: [
      { key: "beforeTitle", label: "Before Headline", type: "text", default: "Wait for it", description: "Headline shown while the strokes cover the message." },
      { key: "beforeBody", label: "Before Body", type: "text", default: "The good part is closer, just one scroll away.", description: "Supporting line shown before the reveal." },
      { key: "afterTitle", label: "After Headline", type: "text", default: "There it is", description: "Headline revealed once the strokes draw off." },
      { key: "afterBody", label: "After Body", type: "text", default: "Clean, sharp, and right when you needed it.", description: "Supporting line shown after the reveal." },
      { key: "strokeColor", label: "Stroke Color", type: "color", default: "#fff280", description: "Fill color of the drawn strokes." },
      { key: "bgFrom", label: "Background Start", type: "color", default: "#ff668c", description: "Left side of the background gradient." },
      { key: "bgTo", label: "Background End", type: "color", default: "#fff280", description: "Right side of the background gradient." },
      { key: "fontFamily", label: "Font", type: "font", default: "var(--font-barlow-condensed), sans-serif", description: "Typeface used for the headline." },
      { key: "textScale", label: "Text Scale", type: "fontScale", default: 100, min: 50, max: 200, step: 10, description: "Relative size of every text element." },
      { key: "autoPlay", label: "Auto Play", type: "toggle", default: true, description: "Sweep the cover/reveal automatically." },
      { key: "speed", label: "Speed", type: "slider", default: 100, min: 30, max: 220, step: 10, description: "Auto-play and scroll sensitivity multiplier." },
    ],
  },
];

export function getOriginal(key: string): OriginalEntry | undefined {
  return ORIGINALS.find((o) => o.key === key);
}

export function getOriginalDefaults(key: string): Params {
  const o = getOriginal(key);
  return o ? defaultsFrom(o.controls) : {};
}
