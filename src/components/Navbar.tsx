import { useState } from "react";
import { NavLink } from "react-router-dom";
import WalletButton from "@/components/WalletButton";
import LaunchAgentModal from "@/components/LaunchAgentModal";
import { openCommandPalette } from "@/lib/commandPalette";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Pulse", to: "/app" },
  { label: "Leaderboard", to: "/app/leaderboard" },
  { label: "Launches", to: "/app/launches" },
  { label: "Activity", to: "/app/activity" },
];

const X_URL = "https://x.com/TryAgentBlock";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const XLink = ({ className }: { className?: string }) => (
  <a
    href={X_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="AgentBlock on X"
    className={cn(
      "flex items-center justify-center h-10 w-10 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors shrink-0",
      className,
    )}
  >
    <XIcon className="h-4 w-4" />
  </a>
);

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [launching, setLaunching] = useState(false);

  return (
    <nav className="pointer-events-auto sticky top-0 z-50 bg-hero-bg/95 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-6 md:px-8 lg:px-16 py-4 gap-4">
        <NavLink to="/app" className="flex items-center gap-2 text-foreground text-xl font-semibold tracking-tight shrink-0" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
          <span className="hidden sm:inline">
            AGENT<span className="text-primary">BLOCK</span>
          </span>
        </NavLink>

        <div className="hidden xl:flex items-center gap-7 shrink-0">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/app"}
              className={({ isActive }) =>
                cn(
                  "text-sm uppercase tracking-widest transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <button
          onClick={openCommandPalette}
          onMouseEnter={() => setSearchOpen(true)}
          onMouseLeave={() => setSearchOpen(false)}
          className={cn(
            "hidden md:flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors flex-1 max-w-xs",
            searchOpen && "border-primary/40 text-foreground",
          )}
        >
          Find agents, tickers...
          <kbd className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            onClick={() => setLaunching(true)}
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-widest px-4 py-2.5 font-bold hover:brightness-110 active:scale-[0.97] transition-all"
          >
            + Launch Agent
          </button>
          <XLink className="hidden md:flex" />
          <WalletButton className="hidden md:flex" />
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            className="xl:hidden flex items-center justify-center h-10 w-10 rounded-lg border border-border text-foreground shrink-0"
          >
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-1.5">
              <span className={cn("block h-0.5 w-5 bg-foreground transition-transform", menuOpen && "translate-y-2 rotate-45")} />
              <span className={cn("block h-0.5 w-5 bg-foreground transition-opacity", menuOpen && "opacity-0")} />
              <span className={cn("block h-0.5 w-5 bg-foreground transition-transform", menuOpen && "-translate-y-2 -rotate-45")} />
            </div>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="xl:hidden border-t border-border px-6 py-4 space-y-4 animate-fade-in">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/app"}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "text-sm uppercase tracking-widest transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <button
            onClick={() => {
              setMenuOpen(false);
              openCommandPalette();
            }}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground"
          >
            Search
            <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Follow on X
          </a>
          <button
            onClick={() => {
              setMenuOpen(false);
              setLaunching(true);
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs uppercase tracking-widest px-4 py-2.5 font-bold w-full"
          >
            + Launch Agent
          </button>
          <WalletButton className="w-full [&>button]:flex-1 md:hidden" />
        </div>
      )}

      {launching && <LaunchAgentModal onClose={() => setLaunching(false)} />}
    </nav>
  );
};

export default Navbar;
