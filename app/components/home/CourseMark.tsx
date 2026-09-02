/**
 * Brand marks for the placeholder course cards. Inline SVG so no asset or
 * icon dependency is needed; replace with the real logos when course content
 * comes from Sanity.
 */

const tile = "flex h-[74px] w-[74px] items-center justify-center rounded-[16px]";

export function NextjsMark() {
  return (
    <div className={`${tile} bg-neutral-900`} aria-hidden="true">
      <span className="font-display text-[34px] leading-none text-white">N</span>
    </div>
  );
}

export function TypeScriptMark() {
  return (
    <div className={`${tile} bg-[#3178C6]`} aria-hidden="true">
      <span className="text-[26px] font-bold leading-none tracking-tight text-white">
        TS
      </span>
    </div>
  );
}

const containers = [
  { x: 16, y: 27 },
  { x: 27, y: 27 },
  { x: 38, y: 27 },
  { x: 27, y: 16 },
  { x: 38, y: 16 },
  { x: 38, y: 5 },
];

export function DockerMark() {
  return (
    <div className={tile} aria-hidden="true">
      <svg viewBox="0 0 74 56" className="h-[62px] w-[74px]" fill="none">
        {/* tail fin */}
        <path
          d="M55 36c2.6-3.4 7.6-4.2 11-1.8 2.4 1.7 3.2 4.8 2.2 7.5-3.2 1.6-7.2 1.2-10-1"
          fill="#3FA9F5"
          stroke="#0F3D63"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* body */}
        <path
          d="M5 38h52v3.5C57 48.4 51 53 42.6 53H24C13.5 53 5 46.6 5 39.5V38z"
          fill="#3FA9F5"
          stroke="#0F3D63"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* containers */}
        {containers.map((c) => (
          <rect
            key={`${c.x}-${c.y}`}
            x={c.x}
            y={c.y}
            width="11"
            height="11"
            rx="1"
            fill="#3FA9F5"
            stroke="#0F3D63"
            strokeWidth="1.4"
          />
        ))}
        {/* wake */}
        <path d="M14 46c4 0 7 2.2 7.8 5.6-3.6.4-6.6-1-7.8-5.6z" fill="#fff" />
      </svg>
    </div>
  );
}
