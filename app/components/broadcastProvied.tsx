"use client";

import { useBroadcastChannel } from "@/app/hooks/useBroadcastChannel";
import { useAuthContext } from "../context/AuthContext";
import { useBankTransaction } from "../context/BankTransactionContext";
import { usePlan } from "../context/PlanContext";
import broadcastEventBus from "../lib/broadcastEventBus";
export function BroadcastProvider({ children: children }: any) {
  const bankTransactionContext = useBankTransaction();
  const planContext = usePlan();
  const authContext = useAuthContext();

  useBroadcastChannel("app", event =>
    broadcastEventBus(event, { bankTransactionContext, planContext, authContext })
  );
  return children;
}