import ModalPortal from "@/components/ModalPortal";
import { useWallet } from "@/lib/wallet";

const PROVIDERS = [
  { name: "Phantom", color: "#AB9FF2" },
  { name: "Solflare", color: "#FC9965" },
  { name: "Backpack", color: "#E33E3F" },
];

const WalletSelectModal = ({ onClose }: { onClose: () => void }) => {
  const { connect, status } = useWallet();

  const handleSelect = (name: string) => {
    connect(name);
    onClose();
  };

  return (
    <ModalPortal>
    <div
      className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-hero-bg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-foreground">Connect a wallet</h3>
        <p className="text-sm text-muted-foreground mt-1">Simulated for demo purposes. No real wallet connection occurs.</p>
        <div className="mt-5 space-y-2">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.name}
              onClick={() => handleSelect(provider.name)}
              disabled={status === "connecting"}
              className="w-full flex items-center gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-left hover:border-primary/40 transition-colors disabled:opacity-50"
            >
              <span
                className="h-8 w-8 rounded-lg shrink-0"
                style={{ backgroundColor: provider.color }}
              />
              <span className="font-semibold text-foreground">{provider.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

export default WalletSelectModal;
