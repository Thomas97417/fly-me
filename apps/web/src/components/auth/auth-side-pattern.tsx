const VIEWBOX = 1200;
const CX = VIEWBOX / 2;
const CY = VIEWBOX / 2;
const R = 520;
const TILT_DEG = 22;
const TILT = (TILT_DEG * Math.PI) / 180;

const PARALLEL_LATS_DEG = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
const MERIDIAN_LONS_DEG = [-60, -30, 0, 30, 60];

const SAMPLE_FLIGHTS: Array<{
  lat: number;
  lon: number;
  name: string;
  date: string;
}> = [
  { lat: -10, lon: 30, name: "Chamonix", date: "12 avril 2026" },
  { lat: 20, lon: 10, name: "Gorges du Verdon", date: "28 mars 2026" },
  { lat: -55, lon: -25, name: "Mont Saint-Michel", date: "5 mai 2026" },
];

function projectWaypoint(latDeg: number, lonDeg: number) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const x = R * Math.cos(lat) * Math.sin(lon);
  const y =
    R * Math.sin(lat) * Math.cos(TILT) +
    R * Math.cos(lat) * Math.cos(lon) * Math.sin(TILT);
  return { x: CX + x, y: CY + y };
}

function meridianPath(longitudeDeg: number): string {
  const lon = (longitudeDeg * Math.PI) / 180;
  const STEPS = 48;
  const points: string[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const phi = -Math.PI / 2 + (i / STEPS) * Math.PI;
    const x = R * Math.sin(lon) * Math.cos(phi);
    const y =
      R * Math.sin(phi) * Math.cos(TILT) +
      R * Math.cos(lon) * Math.cos(phi) * Math.sin(TILT);
    points.push(`${(CX + x).toFixed(2)} ${(CY + y).toFixed(2)}`);
  }
  return "M " + points.join(" L ");
}

const PIN_R = 16;
const PIN_BORDER = 2;
const TAIL_H = 10;
const POPUP_W = 200;
const POPUP_H = 56;
const POPUP_GAP = 14;

function FlightMarker({
  x,
  y,
  name,
  date,
}: {
  x: number;
  y: number;
  name: string;
  date: string;
}) {
  // (x, y) is the tail tip — the pin sits above it.
  const pinCY = y - TAIL_H - PIN_R;
  // Popup centered horizontally on the pin, sitting above it.
  const popupX = x - POPUP_W / 2;
  const popupY = pinCY - PIN_R - POPUP_GAP - POPUP_H;

  return (
    <g>
      {/* Ground shadow */}
      <ellipse
        cx={x}
        cy={y + 4}
        rx={10}
        ry={2.5}
        fill="black"
        fillOpacity={0.18}
      />

      {/* Tail */}
      <path
        d={`M ${x - 7} ${pinCY + PIN_R - 4} L ${x + 7} ${pinCY + PIN_R - 4} L ${x} ${y} Z`}
        fill="url(#auth-pin-gradient)"
      />

      {/* Pin */}
      <circle cx={x} cy={pinCY} r={PIN_R + PIN_BORDER} fill="white" />
      <circle cx={x} cy={pinCY} r={PIN_R} fill="url(#auth-pin-gradient)" />
      <circle cx={x} cy={pinCY} r={4} fill="white" />

      {/* Popup card */}
      <g transform={`translate(${popupX}, ${popupY})`}>
        <rect
          width={POPUP_W}
          height={POPUP_H}
          rx={10}
          ry={10}
          fill="var(--popover)"
          stroke="var(--border)"
          strokeWidth={1}
          filter="url(#auth-popup-shadow)"
        />
        {/* Tip — drawn over the bottom edge so it merges with the rect. */}
        <path
          d={`M ${POPUP_W / 2 - 7} ${POPUP_H - 1} L ${POPUP_W / 2 + 7} ${POPUP_H - 1} L ${POPUP_W / 2} ${POPUP_H + 8} Z`}
          fill="var(--popover)"
          stroke="var(--border)"
          strokeWidth={1}
        />
        {/* Mask the stroke segment where the tip joins the rect bottom edge. */}
        <line
          x1={POPUP_W / 2 - 7}
          y1={POPUP_H}
          x2={POPUP_W / 2 + 7}
          y2={POPUP_H}
          stroke="var(--popover)"
          strokeWidth={1.5}
        />
        <text
          x={16}
          y={24}
          fontSize={15}
          fontWeight={600}
          fill="var(--popover-foreground)"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {name}
        </text>
        <text
          x={16}
          y={42}
          fontSize={12}
          fill="var(--muted-foreground)"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {date}
        </text>
      </g>
    </g>
  );
}

export default function AuthSidePattern() {
  return (
    <div className="relative size-full overflow-hidden bg-gradient-to-r from-background via-muted/15 to-muted/40 text-foreground">
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 95% at center, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 95% at center, black 30%, transparent 85%)",
        }}
      >
        <svg
          className="absolute inset-0 size-full"
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <defs>
            <radialGradient id="auth-atmosphere" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.10" />
              <stop offset="60%" stopColor="currentColor" stopOpacity="0.04" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <linearGradient
              id="auth-pin-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <filter
              id="auth-popup-shadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
              <feOffset dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.18" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={CX} cy={CY} r={R * 1.3} fill="url(#auth-atmosphere)" />

          <g
            stroke="currentColor"
            strokeWidth={1}
            strokeOpacity={0.18}
            strokeDasharray="3 6"
            strokeLinecap="round"
          >
            {PARALLEL_LATS_DEG.map((latDeg) => {
              const lat = (latDeg * Math.PI) / 180;
              const cy = CY + R * Math.sin(lat) * Math.cos(TILT);
              const rx = R * Math.cos(lat);
              const ry = Math.max(0.5, R * Math.cos(lat) * Math.sin(TILT));
              const d = `M ${CX - rx} ${cy} A ${rx} ${ry} 0 0 1 ${CX + rx} ${cy}`;
              return (
                <path
                  key={`p${latDeg}`}
                  d={d}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {MERIDIAN_LONS_DEG.map((lonDeg) => (
              <path
                key={`m${lonDeg}`}
                d={meridianPath(lonDeg)}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          <g>
            {SAMPLE_FLIGHTS.map((flight) => {
              const { x, y } = projectWaypoint(flight.lat, flight.lon);
              return (
                <FlightMarker
                  key={`${flight.lat}-${flight.lon}`}
                  x={x}
                  y={y}
                  name={flight.name}
                  date={flight.date}
                />
              );
            })}
          </g>
        </svg>
      </div>

      <div className="absolute bottom-10 left-10 flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">
          Documente tes vols. Partage tes horizons.
        </span>
      </div>
    </div>
  );
}
