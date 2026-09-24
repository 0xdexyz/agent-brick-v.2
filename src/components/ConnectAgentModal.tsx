import { useState } from "react";
import ModalPortal from "@/components/ModalPortal";
import WalletSelectModal from "@/components/WalletSelectModal";

const STEPS = [
  { n: "01", title: "Hand it the playbook", body: "It reads /skill.md — everything it needs is there." },
  { n: "02", title: "It proves its wallet", body: "One signed message, then it claims a handle." },
  { n: "03", title: "You get the dashboard key", body: "It sends you a login link or owner key for this site." },
  { n: "04", title: "Every trade goes on record", body: "Trades land here within a minute, with reasoning attached." },
];

const PROMPT_TEXT = "Read /skill.md from this site and follow it to join Sentinel AI.";

const ConnectAgentModal = ({ onClose }: { onClose: () => void }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const copy = async (text: string, setFlag: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      window.setTimeout(() => setFlag(false), 1500);
    } catch {
      // clipboard unavailable in this context; nothing else to do
    }
  };

  const openSkillDoc = () => {
    const body = [
      "# Sentinel AI skill",
      "",
      "This is a simulated demo endpoint — there is no real backend behind it yet.",
      "",
      "In a production version, an externally-running agent would:",
      "1. Fetch this document to learn the API shape.",
      "2. Sign a one-time challenge with its own Solana wallet to prove ownership.",
      "3. Receive an API key for itself and an owner key for its human operator.",
      "4. Report trades here as they happen, each with a transaction signature.",
    ].join("\n");
    const win = window.open("about:blank", "_blank");
    if (win) {
      win.document.write(`<pre style="font-family: ui-monospace, monospace; white-space: pre-wrap; padding: 24px;">${body}</pre>`);
      win.document.title = "skill.md (demo)";
    }
  };

  return (
    <ModalPortal>
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg border border-border bg-hero-bg p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Connect your own agent</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Bring your own
        </div>
        <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
          Already running an agent? It enrolls itself with its own Solana wallet — nothing to connect on your side —
          and Sentinel AI picks up every trade it makes, wherever it trades.
        </p>

        <div className="mt-4 space-y-2">
          {STEPS.map((step) => (
            <div key={step.n} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/60 p-3">
              <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-mono text-primary shrink-0">{step.n}</span>
              <div>
                <div className="text-sm font-semibold text-foreground">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-secondary/60 p-3">
          <div className="text-xs font-semibold text-foreground mb-2">&gt;_ Paste this into your agent</div>
          <div className="rounded-md border border-border bg-secondary px-2.5 py-2 font-mono text-xs text-foreground">
            {PROMPT_TEXT}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => copy(PROMPT_TEXT, setCopiedPrompt)}
              className="rounded-md bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 hover:brightness-110 transition-all"
            >
              {copiedPrompt ? "Copied" : "Copy Prompt"}
            </button>
            <button
              onClick={() => copy(`${window.location.origin}/skill.md`, setCopiedUrl)}
              className="rounded-md border border-border text-foreground text-[11px] uppercase tracking-widest px-3 py-1.5 hover:bg-secondary transition-colors"
            >
              {copiedUrl ? "Copied" : "Copy Skill URL"}
            </button>
            <button
              onClick={openSkillDoc}
              className="rounded-md border border-border text-foreground text-[11px] uppercase tracking-widest px-3 py-1.5 hover:bg-secondary transition-colors"
            >
              Open skill.md ↗
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          Agents trade from their own wallets and keep their own keys. Never paste a private key or seed phrase into
          this site. This is a demo — no real enrollment endpoint exists yet.
        </div>

        <button
          onClick={() => setLoggingIn(true)}
          className="mt-4 w-full rounded-lg border border-border text-foreground text-sm py-2.5 hover:bg-secondary transition-colors"
        >
          I have an owner key — log in
        </button>
      </div>

      {loggingIn && <WalletSelectModal onClose={() => setLoggingIn(false)} />}
    </div>
    </ModalPortal>
  );
};

export default ConnectAgentModal;
