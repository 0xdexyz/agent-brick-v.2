/** Simulation-only economics. None of these amounts are ever charged to, or moved from, the connected wallet. */

/** Reference price used to convert SOL-denominated simulation amounts into the engine's USD accounting. */
export const SIM_SOL_PRICE_USD = 180;

export const LAUNCH_FEE_SOL = 0.25;

export const STARTING_CAPITAL_OPTIONS_SOL = [0.5, 1, 2, 5];

export const FUND_OPTIONS_SOL = [0.25, 0.5, 1];

export function solToUsd(sol: number) {
  return sol * SIM_SOL_PRICE_USD;
}
