const VIEWBOX = 1200;
const CX = VIEWBOX / 2;
const CY = VIEWBOX / 2;
const R = 520;
const TILT_DEG = 22;
const TILT = (TILT_DEG * Math.PI) / 180;

const PARALLEL_LATS_DEG = [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75];
const MERIDIAN_LONS_DEG = [-60, -30, 0, 30, 60];

// A few stylized waypoints scattered on the visible hemisphere. They project
// from (lat, lon) onto the same hemisphere as the visible parallel arcs
// (same `+` sign on the cos(λ) term as `meridianPath`).
const WAYPOINTS_DEG: Array<{ lat: number; lon: number }> = [
  { lat: 35, lon: -38 },
  { lat: -22, lon: 28 },
  { lat: 8, lon: 55 },
  { lat: -48, lon: -12 },
  { lat: 52, lon: 18 },
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

export default function MapLinesBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 text-foreground"
      style={{
        maskImage:
          "radial-gradient(ellipse at center, black 30%, transparent 95%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 30%, transparent 95%)",
      }}
    >
      <svg
        className="size-full"
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <radialGradient id="map-atmosphere" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor="currentColor"
              stopOpacity="0.06"
            />
            <stop
              offset="60%"
              stopColor="currentColor"
              stopOpacity="0.025"
            />
            <stop
              offset="100%"
              stopColor="currentColor"
              stopOpacity="0"
            />
          </radialGradient>
          <radialGradient id="map-waypoint-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft atmospheric halo */}
        <circle cx={CX} cy={CY} r={R * 1.3} fill="url(#map-atmosphere)" />

        {/* Graticule — dashed, subtle */}
        <g
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.11}
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

        {/* Waypoint pins */}
        <g>
          {WAYPOINTS_DEG.map(({ lat, lon }) => {
            const { x, y } = projectWaypoint(lat, lon);
            return (
              <g key={`w${lat}-${lon}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={16}
                  fill="url(#map-waypoint-glow)"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={2.2}
                  fill="currentColor"
                  fillOpacity={0.5}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
