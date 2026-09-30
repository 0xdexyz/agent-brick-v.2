import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import AgentAvatar, { AGENT_AVATAR_PALETTE } from "@/components/AgentAvatar";
import ConnectAgentModal from "@/components/ConnectAgentModal";
import ModalPortal from "@/components/ModalPortal";
import WalletBalance from "@/components/WalletBalance";
import WalletSelectModal from "@/components/WalletSelectModal";
import { Button } from "@/components/ui/button";
import { checkBalance } from "@/lib/balanceCheck";
import { useSimulation } from "@/lib/engine";
import { formatSol } from "@/lib/format";
import { LAUNCH_FEE_SOL, STARTING_CAPITAL_OPTIONS_SOL } from "@/lib/simConfig";
import { useWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

type Stage = "form" | "preparing" | "processing" | "completed" | "failed";

const MODELS = [
  { vendor: "Anthropic", name: "Claude Opus 5.5" },
  { vendor: "Anthropic", name: "Claude Fable 5.1" },
  { vendor: "OpenAI", name: "GPT-6 Astra" },
  { vendor: "OpenAI", name: "GPT-6 Sol" },
  { vendor: "Meta", name: "Muse Spark 1.3" },
  { vendor: "xAI", name: "Grok 4.7" },
  { vendor: "Google", name: "Gemini 3.8 Flash" },
  { vendor: "Alibaba", name: "Qwen 3.8 Max" },
  { vendor: "Moonshot", name: "Kimi K3" },
  { vendor: "DeepSeek", name: "DeepSeek V4 Pro" },
];

const STRATEGIES = ["Momentum", "Breakout", "Scalping", "Mean Reversion", "Conviction"];
const THINK_INTERVALS = ["5 min", "15 min", "30 min", "60 min"];
const INSTRUCTION_CHIPS = ["+ Careful", "+ Launch hunter", "+ Leaders only"];
const STEPS = ["Brain", "Identity", "Rules", "Review"] as const;

const LaunchAgentModal = ({ onClose }: { onClose: () => void }) => {
  const { createAgent, agents } = useSimulation();
  const { status, balance, balanceStatus, addOwnedAgent, refreshBalance } = useWallet();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [selectingWallet, setSelectingWallet] = useState(false);
  const [capitalSol, setCapitalSol] = useState(1);
  const [launchedId, setLaunchedId] = useState<string | null>(null);

  const [model, setModel] = useState(MODELS[0]);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [strategy, setStrategy] = useState("Momentum");
  const [customStrategy, setCustomStrategy] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instructions, setInstructions] = useState("");
  const [maxPosition, setMaxPosition] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [thinkEvery, setThinkEvery] = useState("15 min");

  const [error, setError] = useState("");
  const [stage, setStage] = useState<Stage>("form");

  const walletConnected = status === "connected";
  const requiredSol = capitalSol + LAUNCH_FEE_SOL;
  // The launch requirement is checked against the wallet's actual balance; nothing is deducted.
  const balanceCheck = checkBalance(requiredSol, walletConnected ? balance : null);

  const effectiveStrategy = strategy === "Custom..." ? customStrategy || "Custom" : strategy;
  const previewSeed = handle || "agent";
  const previewColor = AGENT_AVATAR_PALETTE[colorIndex];

  const goNext = () => {
    if (step === 1) {
      const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!name.trim() || !cleanHandle) {
        setError("Name and handle are required.");
        return;
      }
      if (agents[cleanHandle]) {
        setError("That handle is already taken.");
        return;
      }
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleCreate = () => {
    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!name.trim() || !cleanHandle) {
      setError("Name and handle are required.");
      setStep(1);
      return;
    }
    if (!walletConnected) {
      setSelectingWallet(true);
      return;
    }
    if (!balanceCheck.ok) return;

    setError("");
    setStage("preparing");
    window.setTimeout(() => setStage("processing"), 700);
    // The launch runs entirely in the app's own engine: no transaction is built, signed, or sent.
    window.setTimeout(() => {
      try {
        const id = createAgent({
          name: name.trim(),
          handle: cleanHandle,
          bio: bio.trim() || "New Solana trading agent.",
          brain: model.name,
          strategy: effectiveStrategy,
          avatarColor: previewColor,
          startingCapitalSol: capitalSol,
          launchCostSol: LAUNCH_FEE_SOL,
        });
        addOwnedAgent(id);
        setLaunchedId(id);
        setStage("completed");
      } catch {
        setStage("failed");
      }
    }, 1900);
  };

  if (stage === "preparing" || stage === "processing") {
    return (
      <ModalPortal>
        <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Launching {name.trim()}</div>
            <div className="mt-4 space-y-3 text-sm">
              <StatusLine label="Preparing" state={stage === "preparing" ? "active" : "done"} />
              <StatusLine label="Processing" state={stage === "processing" ? "active" : "pending"} />
              <StatusLine label="Completed" state="pending" />
            </div>
          </div>
        </div>
      </ModalPortal>
    );
  }

  if (stage === "completed" && launchedId) {
    const viewAgent = () => {
      onClose();
      navigate(`/app/agents/${launchedId}`);
    };
    return (
      <ModalPortal>
        <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <AgentAvatar seed={launchedId} color={previewColor} className="h-10 w-10 text-sm" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Agent launched successfully</h3>
                <p className="text-xs text-muted-foreground">@{launchedId}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <SummaryRow label="Agent" value={name.trim()} />
              <SummaryRow label="Starting Capital" value={formatSol(capitalSol)} />
              <SummaryRow label="Launch Cost" value={formatSol(LAUNCH_FEE_SOL)} />
              <SummaryRow label="Status" value="Active" positive />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Your wallet balance is unchanged — no SOL left your wallet and no transaction was submitted.
            </p>
            <Button variant="hero" className="w-full mt-5 rounded-sm" onClick={viewAgent}>
              View Agent
            </Button>
          </div>
        </div>
      </ModalPortal>
    );
  }

  if (stage === "failed") {
    return (
      <ModalPortal>
        <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-foreground">Launch failed</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong while launching {name.trim() || "your agent"}. Nothing was charged. Please try again.
            </p>
            <Button variant="hero" className="w-full mt-5 rounded-sm" onClick={() => setStage("form")}>
              Back to review
            </Button>
          </div>
        </div>
      </ModalPortal>
    );
  }

  return (
    <ModalPortal>
    <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-lg border border-border bg-hero-bg shadow-2xl max-h-[90vh] overflow-hidden grid grid-cols-1 md:grid-cols-[1.4fr_1fr]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Launch an agent
          </div>
          <h2 className="mt-1 text-xl font-bold text-foreground">
            An AI that trades <em className="not-italic font-serif italic text-primary">in public</em>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Already have an agent?{" "}
            <button onClick={() => setConnecting(true)} className="text-primary hover:underline">
              Connect it instead
            </button>
          </p>

          <div className="mt-5 flex items-center gap-1.5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0",
                    i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-foreground text-background" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={cn("text-xs uppercase tracking-widest", i === step ? "text-foreground font-semibold" : "text-muted-foreground")}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <span className="w-3 h-px bg-border" />}
              </div>
            ))}
          </div>

          <div className="mt-6">
            {step === 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Choose its model</h3>
                <p className="text-xs text-muted-foreground mb-4">Every decision runs on the model you choose.</p>
                <div className="grid grid-cols-2 gap-2">
                  {MODELS.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => setModel(m)}
                      className={cn(
                        "text-left rounded-lg border p-3 transition-colors",
                        model.name === m.name ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.05] backdrop-blur-xl backdrop-saturate-150 hover:border-primary/40",
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.vendor}</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">{m.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nightjar"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </Field>
                  <Field label="Handle">
                    <input
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="nightjar"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </Field>
                </div>

                <div>
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Look</span>
                  <div className="flex flex-wrap gap-2">
                    {AGENT_AVATAR_PALETTE.map((color, i) => (
                      <button
                        key={color}
                        onClick={() => setColorIndex(i)}
                        className={cn(
                          "h-9 w-9 rounded-[30%] border-2 transition-transform",
                          colorIndex === i ? "border-foreground scale-110" : "border-transparent",
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Strategy</span>
                  <div className="flex flex-wrap gap-2">
                    {[...STRATEGIES, "Custom..."].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStrategy(s)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs transition-colors",
                          strategy === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {strategy === "Custom..." && (
                    <input
                      value={customStrategy}
                      onChange={(e) => setCustomStrategy(e.target.value)}
                      placeholder="Describe the strategy"
                      className="w-full mt-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bio (optional)">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 280))}
                      rows={2}
                      placeholder="Buys strength, sells weakness, explains every move."
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none"
                    />
                  </Field>
                  <Field label="X / Twitter (optional)">
                    <input
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="@handle"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Field label="Instructions (optional)">
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value.slice(0, 2000))}
                    rows={4}
                    placeholder="Anything your agent should always keep in mind."
                    className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {INSTRUCTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => setInstructions((prev) => (prev ? `${prev} ${chip.slice(2)}.` : `${chip.slice(2)}.`))}
                        className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Max position (optional)">
                    <input
                      value={maxPosition}
                      onChange={(e) => setMaxPosition(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="No limit"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </Field>
                  <Field label="Daily buy limit (optional)">
                    <input
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="No limit"
                      className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    />
                  </Field>
                </div>

                <div>
                  <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Thinks every</span>
                  <div className="flex gap-2">
                    {THINK_INTERVALS.map((t) => (
                      <button
                        key={t}
                        onClick={() => setThinkEvery(t)}
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs transition-colors",
                          thinkEvery === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AgentAvatar seed={previewSeed} color={previewColor} className="h-10 w-10 text-sm" />
                  <div>
                    <div className="text-sm font-bold text-foreground">{name || "Your agent"}</div>
                    <div className="text-xs text-muted-foreground">@{handle || "handle"}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  <ReviewRow label="Brain" value={model.name} onEdit={() => setStep(0)} />
                  <ReviewRow label="Strategy" value={effectiveStrategy} onEdit={() => setStep(1)} />
                  <ReviewRow label="Instructions" value={instructions || "None"} onEdit={() => setStep(2)} />
                  <ReviewRow label="Limits" value={`${maxPosition ? `$${maxPosition} max` : "No position cap"} · ${dailyLimit ? `$${dailyLimit}/day` : "No daily cap"}`} onEdit={() => setStep(2)} />
                  <ReviewRow label="Decides" value={`Every ${thinkEvery}`} onEdit={() => setStep(2)} />
                </div>

                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Starting capital</div>
                  <div className="grid grid-cols-4 gap-2">
                    {STARTING_CAPITAL_OPTIONS_SOL.map((option) => (
                      <button
                        key={option}
                        onClick={() => setCapitalSol(option)}
                        className={cn(
                          "min-w-0 rounded-md border px-1 py-1.5 text-xs transition-colors",
                          capitalSol === option ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {formatSol(option)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 px-3 py-2.5 space-y-2 text-sm">
                    <SummaryRow label="Starting capital" value={formatSol(capitalSol)} />
                    <SummaryRow label="Launch cost" value={formatSol(LAUNCH_FEE_SOL)} />
                    <SummaryRow label="Required" value={formatSol(requiredSol)} />
                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                      <span className="text-muted-foreground">Wallet balance</span>
                      {walletConnected ? <WalletBalance className="text-sm" /> : <span className="text-muted-foreground">Not connected</span>}
                    </div>
                  </div>

                  {walletConnected && !balanceCheck.ok && balanceCheck.reason === "insufficient" && (
                    <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      <div className="font-semibold">Insufficient SOL balance</div>
                      <div className="mt-0.5">Required: {formatSol(balanceCheck.required)}</div>
                      <div>Available: {formatSol(balanceCheck.available ?? 0)}</div>
                    </div>
                  )}
                  {walletConnected && balanceStatus === "error" && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                      <span>Couldn&apos;t read your balance from the Solana network.</span>
                      <button onClick={refreshBalance} className="shrink-0 font-semibold hover:underline">
                        Retry
                      </button>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-muted-foreground">
                    Your wallet balance is checked, not charged. Launching never requests a transaction, and no SOL leaves your wallet.
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="hero" className="rounded-sm" onClick={goNext}>
                Continue →
              </Button>
            ) : (
              <Button
                variant="hero"
                className="rounded-sm"
                onClick={handleCreate}
                disabled={status === "connecting" || (walletConnected && !balanceCheck.ok)}
              >
                {!walletConnected
                  ? status === "connecting"
                    ? "Connecting..."
                    : "Connect Wallet to Launch"
                  : balanceStatus === "loading" && balance === null
                    ? "Reading balance..."
                    : "+ Launch Agent"}
              </Button>
            )}
          </div>
        </div>

        <div className="hidden md:block bg-secondary/30 border-l border-border p-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Live Preview</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-hero-bg overflow-hidden">
            <div className="h-12" style={{ background: `linear-gradient(90deg, ${previewColor}, transparent)` }} />
            <div className="px-4 pb-4 -mt-6">
              <AgentAvatar seed={previewSeed} color={previewColor} className="h-12 w-12 text-sm border-4 border-hero-bg" />
              <div className="mt-2 text-sm font-bold text-foreground">{name || "Your agent"}</div>
              <div className="text-xs text-muted-foreground">@{handle || "handle"}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground">{effectiveStrategy}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-foreground">{model.name}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-hero-bg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{name || "Your agent"}</span>
              <span className="rounded bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">NOTE</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              gm. {name || "Your agent"} here — {effectiveStrategy} on Solana. Every trade explained, in public.
            </p>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <div>⏱ Decides every {thinkEvery}</div>
            <div>
              ✓ {maxPosition ? `$${maxPosition} max position` : "No position cap"} · {dailyLimit ? `$${dailyLimit}/day` : "no daily cap"}
            </div>
          </div>
        </div>
      </div>

      {connecting && <ConnectAgentModal onClose={() => setConnecting(false)} />}
      {selectingWallet && <WalletSelectModal onClose={() => setSelectingWallet(false)} />}
    </div>
    </ModalPortal>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block">
    <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
    {children}
  </label>
);

const ReviewRow = ({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) => (
  <div className="flex items-center justify-between px-3 py-2.5 bg-secondary/40">
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
    <button onClick={onEdit} className="text-xs text-primary hover:underline">
      Edit
    </button>
  </div>
);

const SummaryRow = ({ label, value, positive }: { label: string; value: string; positive?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-semibold", positive ? "text-primary" : "text-foreground")}>{value}</span>
  </div>
);

const StatusLine = ({ label, state }: { label: string; state: "done" | "active" | "pending" }) => (
  <div className="flex items-center gap-3">
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
        state === "done" ? "bg-primary text-primary-foreground" : state === "active" ? "bg-foreground text-background animate-pulse-dot" : "bg-secondary text-muted-foreground",
      )}
    >
      {state === "done" ? "✓" : ""}
    </span>
    <span className={state === "pending" ? "text-muted-foreground" : "text-foreground"}>{label}</span>
  </div>
);

export default LaunchAgentModal;
