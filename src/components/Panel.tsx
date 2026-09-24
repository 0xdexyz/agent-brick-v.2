import type { ReactNode } from "react";

const Panel = ({
  index,
  title,
  icon,
  badge,
  children,
  headerExtra,
}: {
  index: string;
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  headerExtra?: ReactNode;
}) => (
  <div className="pointer-events-auto rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col lg:sticky lg:top-[108px] lg:h-[calc(100vh-124px)]">
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span className="text-primary font-mono">{index}</span>
        {icon}
        <span className="font-semibold text-foreground">{title}</span>
      </div>
      {badge}
    </div>
    {headerExtra}
    <div className="flex-1 overflow-y-auto">{children}</div>
  </div>
);

export default Panel;
