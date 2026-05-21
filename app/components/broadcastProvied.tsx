"use client";

import { useBroadcastChannel } from "@/app/hooks/useBroadcastChannel";
import { useBankTransaction } from "../context/BankTransactionContext";
import { useAuthContext } from '../context/AuthContext'
import { usePlan } from "../context/PlanContext";
import { useLogout } from "../services/logout";
import broadcastEventBus from "../lib/broadcastEventBus";
export function BroadcastProvider({ children: children }: any) {
  const bankTransactionContext = useBankTransaction();
  const planContext = usePlan();
  const authContext = useAuthContext();
  const logout = useLogout();

  useBroadcastChannel("app", event =>
    broadcastEventBus(event, { bankTransactionContext, planContext, authContext, logout })
  );
  return children;
}