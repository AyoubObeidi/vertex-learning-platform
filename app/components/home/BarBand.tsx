/**
 * Decorative bar-chart band at the foot of the home page. Widths, heights and
 * the gap in the middle are measured from .agents/design/vertex-home.png,
 * expressed as fractions of the 960px-wide reference so the band scales with
 * the viewport.
 */
const REFERENCE_WIDTH = 960;
const BAND_HEIGHT = 190;

const bars: { left: number; width: number; height: number }[] = [
  { left: 0, width: 72, height: 88 },
  { left: 72, width: 56, height: 122 },
  { left: 128, width: 48, height: 152 },
  { left: 176, width: 54, height: 185 },
  { left: 230, width: 90, height: 133 },
  { left: 320, width: 48, height: 97 },
  { left: 472, width: 32, height: 64 },
  { left: 504, width: 80, height: 84 },
  { left: 584, width: 80, height: 115 },
  { left: 664, width: 48, height: 152 },
  { left: 712, width: 64, height: 185 },
  { left: 776, width: 56, height: 94 },
  { left: 832, width: 32, height: 132 },
  { left: 864, width: 96, height: 170 },
];

/**
 * Converts a pixel value from the design reference to a responsive percentage.
 *
 * @param value - Pixel value from the 960px-wide reference
 * @returns CSS percentage string
 */
const pct = (value: number) => `${(value / REFERENCE_WIDTH) * 100}%`;

/**
 * Renders a decorative bar-chart visualization at the bottom of the home page.
 * Bar dimensions are measured from the design reference and scale responsively.
 */
export function BarBand() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full overflow-hidden"
      style={{ height: BAND_HEIGHT }}
    >
      {bars.map((bar) => (
        <span
          key={bar.left}
          className="absolute bottom-0 bg-gradient-to-t from-accent/40 via-accent/18 to-transparent"
          style={{
            left: pct(bar.left),
            width: `calc(${pct(bar.width)} - 2px)`,
            height: bar.height,
          }}
        />
      ))}
    </div>
  );
}
