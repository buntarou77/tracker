"use client";

import { useBroadcastChannel } from "@/app/hooks/useBroadcastChannel";
import broadcastEventBus from "../lib/broadcastEventBus";
export function BroadcastProvider({ children: children }: any) {
  useBroadcastChannel("app", broadcastEventBus);
  return children;
}