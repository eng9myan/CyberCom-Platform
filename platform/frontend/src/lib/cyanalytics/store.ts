/**
 * Drill-down state for the CyAnalytics Command Center.
 * Zustand gives per-slice subscriptions -- a component reading only
 * `drillPath` doesn't re-render when a KPI hook updates unrelated data,
 * and a component reading one department's numbers doesn't re-render when
 * another department's poll ticks.
 */
import { create } from "zustand";

import type { DrillLevel, DrillNode, DrillPath } from "./types";

interface CyAnalyticsState {
  drillPath: DrillPath;
  drillInto: (node: DrillNode) => void;
  drillToLevel: (level: DrillLevel) => void;
  reset: () => void;
}

const ROOT_NODE: DrillNode = { level: "network", id: "root", label: "CyberCom Health Network" };
const ROOT: DrillPath = [ROOT_NODE];

export const useCyAnalyticsStore = create<CyAnalyticsState>((set) => ({
  drillPath: ROOT,
  drillInto: (node) =>
    set((state) => ({ drillPath: [...state.drillPath, node] })),
  drillToLevel: (level) =>
    set((state) => {
      const idx = state.drillPath.findIndex((n) => n.level === level);
      if (idx === -1) return state;
      return { drillPath: state.drillPath.slice(0, idx + 1) };
    }),
  reset: () => set({ drillPath: ROOT }),
}));

export function currentNode(drillPath: DrillPath): DrillNode {
  return drillPath[drillPath.length - 1] ?? ROOT_NODE;
}
