import { cn } from "@/lib/utils";

const Sparkline = ({ data, positive, className }: { data: number[]; positive: boolean; className?: string }) => {
  if (data.length < 2) return <div className={className} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={cn("overflow-visible", className)}>
      <polyline
        points={points}
        fill="none"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
        className={positive ? "stroke-primary" : "stroke-destructive"}
      />
    </svg>
  );
};

export default Sparkline;
