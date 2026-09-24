import { cn } from "@/lib/utils";

const PALETTE = [
  "#22c55e",
  "#f472b6",
  "#38bdf8",
  "#facc15",
  "#a78bfa",
  "#fb923c",
  "#2dd4bf",
  "#f87171",
  "#84cc16",
  "#60a5fa",
];

const BG_TINTS = ["#0f172a", "#1c1917", "#111827", "#082f49", "#1a2e05", "#3b0764"];

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export { PALETTE as AGENT_AVATAR_PALETTE };

/** Deterministic identicon: a symmetric 5x5 pixel grid, unique per seed, no external image needed. An explicit `color` overrides the hash-derived tint (used by the avatar color picker). */
const AgentAvatar = ({ seed, className, color: colorOverride }: { seed: string; className?: string; color?: string }) => {
  const hash = hashSeed(seed);
  const color = colorOverride ?? PALETTE[hash % PALETTE.length];
  const bg = BG_TINTS[Math.floor(hash / PALETTE.length) % BG_TINTS.length];

  let bits = hash;
  const cols = 3;
  const rows = 5;
  const cells: boolean[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < cols; x++) {
      row.push((bits & 1) === 1);
      bits = (bits >>> 1) ^ (bits << 13);
      bits >>>= 0;
    }
    cells.push(row);
  }

  const size = 5;
  const cell = 20;

  return (
    <svg
      viewBox={`0 0 ${size * cell} ${size * cell}`}
      className={cn("rounded-[30%] shrink-0", className)}
      style={{ backgroundColor: bg }}
    >
      {cells.map((row, y) =>
        row.map((filled, x) => {
          if (!filled) return null;
          const mirroredX = size - 1 - x;
          return (
            <g key={`${x}-${y}`}>
              <rect x={x * cell} y={y * cell} width={cell} height={cell} fill={color} />
              {mirroredX !== x && <rect x={mirroredX * cell} y={y * cell} width={cell} height={cell} fill={color} />}
            </g>
          );
        }),
      )}
    </svg>
  );
};

export default AgentAvatar;
