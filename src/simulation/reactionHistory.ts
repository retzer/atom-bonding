import type { ReactionHistoryEntry, ReactionStep, SimulationState } from "../types";

export type ReactionTimeJumpTarget = string | "start";

export type ReactionTimeJumpResult = {
  past: ReactionHistoryEntry[];
  future: ReactionHistoryEntry[];
  activeSteps: ReactionStep[];
  state: SimulationState;
};

export function planReactionTimeJump(
  pastNewestFirst: ReactionHistoryEntry[],
  futureChronological: ReactionHistoryEntry[],
  targetId: ReactionTimeJumpTarget,
  limit = 48
): ReactionTimeJumpResult | null {
  const activeChronological = [...pastNewestFirst].reverse();
  const timeline = [...activeChronological, ...futureChronological];
  if (!timeline.length) return null;

  if (targetId === "start") {
    return {
      past: [],
      future: timeline.slice(0, limit),
      activeSteps: [],
      state: timeline[0].before
    };
  }

  const targetIndex = timeline.findIndex((entry) => entry.id === targetId);
  if (targetIndex < 0) return null;

  const pastChronological = timeline.slice(0, targetIndex + 1);
  const future = timeline.slice(targetIndex + 1);
  const past = [...pastChronological].reverse().slice(0, limit);
  return {
    past,
    future: future.slice(0, limit),
    activeSteps: past.map((entry) => entry.step),
    state: timeline[targetIndex].after
  };
}
