export type BalanceCheck =
  | { ok: true; required: number; available: number }
  | { ok: false; reason: "insufficient" | "unavailable"; required: number; available: number | null };

/**
 * Gate for any simulated action with a SOL cost: the cost must fit within the wallet's actual balance.
 * Passing only allows the simulation to proceed — nothing is deducted from the wallet.
 * Pass null when the balance couldn't be read, so a failed network read never counts as "enough".
 */
export function checkBalance(requiredSol: number, availableSol: number | null): BalanceCheck {
  if (availableSol === null) return { ok: false, reason: "unavailable", required: requiredSol, available: null };
  if (requiredSol > availableSol) return { ok: false, reason: "insufficient", required: requiredSol, available: availableSol };
  return { ok: true, required: requiredSol, available: availableSol };
}
