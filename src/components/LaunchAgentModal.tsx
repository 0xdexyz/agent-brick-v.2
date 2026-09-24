import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import AgentAvatar, { AGENT_AVATAR_PALETTE } from "@/components/AgentAvatar";
import ConnectAgentModal from "@/components/ConnectAgentModal";
import ModalPortal from "@/components/ModalPortal";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/lib/engine";
import { useWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

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
  const { addOwnedAgent } = useWallet();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [connecting, setConnecting] = useState(false);

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
  const [stage, setStage] = useState<"form" | "creating">("form");

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
    setStage("creating");
    window.setTimeout(() => {
      const id = createAgent({
        name: name.trim(),
        handle: cleanHandle,
        bio: bio.trim() || "New Solana trading agent.",
        brain: model.name,
        strategy: effectiveStrategy,
        avatarColor: previewColor,
      });
      addOwnedAgent(id);
      onClose();
      // The agent starts with $0 cash — send the owner straight into funding it so it's
      // not left sitting idle without anyone realizing it needs a deposit first.
      navigate(`/app/agents/${id}`, { state: { promptFund: true } });
    }, 1200);
  };

  if (stage === "creating") {
    return (
      <ModalPortal>
        <div className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl text-center">
            <p className="text-sm text-muted-foreground animate-pulse-dot">Minting Solana wallet...</p>
            <p className="text-sm text-muted-foreground animate-pulse-dot mt-2" style={{ animationDelay: "0.3s" }}>
              Loading strategy...
            </p>
            <p className="text-sm text-muted-foreground animate-pulse-dot mt-2" style={{ animationDelay: "0.6s" }}>
              Publishing profile...
            </p>
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

          <div className="mt-5 flex items-center gap-2">
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
                {i < STEPS.length - 1 && <span className="w-6 h-px bg-border" />}
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

                <div className="mt-4 space-y-2">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Launch sequence</div>
                  <SequenceStep n="01" title="Solana wallet minted" body={`A fresh wallet that only ${name || "your agent"} signs from.`} />
                  <SequenceStep n="02" title="Owner key issued" body="Shown once. It controls the agent and everything in its wallet." />
                  <SequenceStep n="03" title="Fuel it with SOL" body="Decisions start within a minute of the deposit. Withdraw any time." />
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
              <Button variant="hero" className="rounded-sm" onClick={handleCreate}>
                + Create Agent
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

const SequenceStep = ({ n, title, body }: { n: string; title: string; body: string }) => (
  <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 p-3">
    <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-mono text-primary shrink-0">{n}</span>
    <div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground">{body}</div>
    </div>
  </div>
);

export default LaunchAgentModal;
