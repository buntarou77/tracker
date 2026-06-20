"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "../../context/AuthContext";
import { useBankTransaction } from "../../context/BankTransactionContext";
import { usePlan } from "../../context/PlanContext";
import { sendEvent } from "../../services/broadcastChannel";
import { authFetch } from "../../services/authFetch";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

interface Target {
  id: number;
  target: string;
  amount: number;
  achieved?: boolean;
  achievedDate?: Date;
  progress?: number;
}

interface Plan {
  id: number;
  name: string;
  type: string;
  totalAmount: number;
  frequency: string;
  categorys: Array<{
    category: string;
    amount: number;
    id: number;
  }>;
  targets?: Target[];
}

export default function BudgetPage() {
  const t = useTranslations("budget");
  const err = useTranslations("budgetErrors");

  const { login } = useAuthContext();
  const { trans, activeBank, currency, balance, setTrans } =
    useBankTransaction();
  const { plans, activePlansStatus, activePlans, setActivePlans, setPlans } =
    usePlan();

  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [categoryProgress, setCategoryProgress] = useState<
    Record<string, number>
  >({});
  const [targetsProgress, setTargetsProgress] = useState<
    Record<number, number>
  >({});
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [budgetStatus, setBudgetStatus] = useState({
    totalSaved: 0,
    monthlyBalance: 0,
    canAffordTargets: {} as Record<number, boolean>,
  });
  const [claimingTarget, setClaimingTarget] = useState<number | null>(null);

  useEffect(() => {
    if (plans && plans.length > 0 && !activePlan) {
      const storedActivePlans = localStorage.getItem("activePlans");
      const activePlansIds = storedActivePlans
        ? JSON.parse(storedActivePlans)
        : [];

      if (activePlansIds.length > 0) {
        const firstActivePlan = plans.find((plan) =>
          activePlansIds.includes(plan.id),
        );
        if (firstActivePlan) {
          setActivePlan(firstActivePlan);
        }
      } else if (plans.length > 0) {
        setActivePlan(plans[0]);
      }
    }
    setIsLoading(false);
  }, [plans, activePlan, setActivePlan]);

  useEffect(() => {
    if (!activePlan || !trans) return;

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthTransactions = trans.filter((t: any) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    });

    const categorySpending: Record<string, number> = {};

    monthTransactions.forEach((transaction: any) => {
      if (transaction.type === "loss") {
        categorySpending[transaction.category] =
          (categorySpending[transaction.category] || 0) + transaction.amount;
      }
    });

    const progress: Record<string, number> = {};
    if (activePlan.categorys) {
      activePlan.categorys.forEach((cat: any) => {
        const spent = categorySpending[cat.category] || 0;
        const percentage = (spent / cat.amount) * 100;
        progress[cat.category] = percentage;
      });
    }
    setCategoryProgress(progress);
  }, [activePlan, trans]);

  useEffect(() => {
    if (!activePlan || !trans) return;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const monthTransactions = trans.filter((t: any) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    });

    const monthlySaved = monthTransactions
      .filter((t: any) => t.type === "gain")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const monthlyIncome = monthTransactions
      .filter((t: any) => t.type === "gain")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const monthlyExpenses = monthTransactions
      .filter((t: any) => t.type === "loss")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const monthlyBalance = monthlyIncome - monthlyExpenses;

    const progress: Record<number, number> = {};
    const canAffordTargets: Record<number, boolean> = {};

    if (activePlan.targets) {
      activePlan.targets.forEach((target: Target) => {
        if (!target.achieved) {
          progress[target.id] = (balance / target.amount) * 100;
          canAffordTargets[target.id] = balance >= target.amount;
        }
      });
    }
    setTargetsProgress(progress);
    setBudgetStatus({
      totalSaved: monthlySaved,
      monthlyBalance,
      canAffordTargets,
    });
  }, [activePlan, trans]);

  useEffect(() => {
    const recommendations: string[] = [];

    Object.entries(categoryProgress).forEach(([category, progress]) => {
      if (progress > 100) {
        recommendations.push(
          `⚠️ Budget exceeded in category "${category}" by ${Math.round(progress - 100)}%. Consider reducing expenses.`,
        );
      } else if (progress > 80) {
        recommendations.push(
          `⚡ Almost at limit in "${category}" (${Math.round(progress)}%). Monitor spending carefully.`,
        );
      }
    });

    if (activePlan?.targets) {
      const affordableTargets = activePlan.targets.filter(
        (target: Target) => target && budgetStatus.canAffordTargets[target.id],
      ).length;

      if (affordableTargets > 0) {
        recommendations.push(
          `🎯 You can afford ${affordableTargets} goal${affordableTargets > 1 ? "s" : ""}! Consider claiming them.`,
        );
      }

      const lowProgressTargets = Object.entries(targetsProgress).filter(
        ([_, progress]) => progress < 25,
      ).length;
      if (lowProgressTargets > 0) {
        recommendations.push(
          `💡 ${lowProgressTargets} goal${lowProgressTargets > 1 ? "s have" : " has"} low progress. Increase savings to reach them faster.`,
        );
      }
    }

    if (budgetStatus.monthlyBalance < 0) {
      recommendations.push(
        `📉 Monthly expenses exceed income by $${Math.abs(budgetStatus.monthlyBalance)}. Review your spending.`,
      );
    } else if (budgetStatus.monthlyBalance > budgetStatus.totalSaved * 0.1) {
      recommendations.push(
        `💰 Great monthly balance of $${budgetStatus.monthlyBalance}! Consider increasing savings goals.`,
      );
    }

    if (budgetStatus.totalSaved < 1000) {
      recommendations.push(
        `🚨 Build emergency fund: You have $${budgetStatus.totalSaved} saved. Aim for at least $1,000.`,
      );
    }

    setAiRecommendations(recommendations);
  }, [categoryProgress, targetsProgress, budgetStatus, activePlan]);

  const claimTarget = async (
    planId: number,
    targetId: number,
    targetAmount: number,
  ) => {
    setClaimingTarget(targetId);

    try {
      const expenseResponse = await authFetch("/api/addTrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login,
          bankName: activeBank.name,
          bankId: activeBank.id,
          amount: targetAmount,
          category: "savings",
          type: "loss",
          date: new Date().toISOString().split("T")[0],
          note: `Target claimed: ${activePlan?.targets?.find((t: any) => t.id === targetId)?.target}`,
        }),
      });

      if (!expenseResponse.ok) {
        throw new Error("Failed to record expense");
      }

      const expenseData = await expenseResponse.json();

      sendEvent({ type: "ADD_TRANSACTION", payload: expenseData.data });

      const updatedPlan = {
        ...activePlan,
        targets: activePlan?.targets?.filter(
          (target: Target) => target.id !== targetId,
        ),
      };

      const updateResponse = await authFetch(
        `/api/rewritePlan?login=${login}&id=${planId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPlan),
        },
      );

      if (updateResponse.ok) {
        const updatedPlans = plans.map((plan: Plan) =>
          plan.id === planId
            ? {
                ...plan,
                targets: plan.targets?.filter(
                  (target: Target) => target.id !== targetId,
                ),
              }
            : plan,
        );
        setPlans(updatedPlans);
        // Send event for plan update
        sendEvent({ type: "UPDATE_PLAN", payload: updatedPlan });

        if (activePlan?.id === planId) {
          setActivePlan(updatedPlan as Plan);
        }

        const newTrans = await authFetch(
          `/api/transactions?bankId=${activeBank.id}`,
        );
        if (newTrans.ok) {
          const transData = await newTrans.json();
          setTrans(transData.value);
          // Send event for transactions sync
          sendEvent({ type: "SYNC_TRANSACTIONS", payload: transData.value });
        }
      } else {
        throw new Error("Failed to update plan");
      }
    } catch (error) {
      alert(err("claimFailed"));
    } finally {
      setClaimingTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-6">
        {activePlan && (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101827] to-[#0b1220] p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">{t("activePlan")}</p>
                <h1 className="text-3xl font-bold">{activePlan.name}</h1>
                <p className="text-gray-400 capitalize">
                  {t(`frequency.${activePlan.frequency}`)} ·{" "}
                  {t(`type.${activePlan.type}`)}
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 backdrop-blur-md">
                  <p className="text-xs text-emerald-300 mb-1">
                    {t("budgetStatus")}
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {balance}
                    <span className="text-sm text-gray-300 ml-1">
                      {currency}
                    </span>
                  </p>
                </div>
                <div
                  className={`rounded-2xl border p-4 backdrop-blur-md ${budgetStatus.monthlyBalance >= 0 ? "border-emerald-500/20 bg-emerald-500/10" : "border-red-500/20 bg-red-500/10"}`}
                >
                  <p className="text-xs text-gray-300 mb-1">{t("saved")}</p>
                  <p
                    className={`text-2xl font-bold ${budgetStatus.monthlyBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {budgetStatus.monthlyBalance >= 0 ? "+" : ""}
                    {budgetStatus.monthlyBalance}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">
          <div className="mb-6">
            <p className="text-sm text-gray-400">{t("selectPlan")}</p>
            <h2 className="text-2xl font-bold mt-1">Plans</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan: any) => (
              <div
                key={plan.id}
                onClick={() => {
                  setActivePlan(plan);
                  sendEvent({
                    type: "CHANGE_ACTIVE_MONTH_PLAN",
                    payload: plan.id,
                  });
                }}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
                  activePlan?.id === plan.id
                    ? "border-blue-400/40 bg-blue-500/10"
                    : "border-white/5 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                }`}
              >
                <h3 className="text-white font-medium mb-2">{plan.name}</h3>
                <div className="flex justify-between items-center">
                  <span
                    className={`text-sm font-semibold ${plan.type === "income" ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {plan.amount} {currency}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">
                    {t(`frequency.${plan.frequency}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">
          <div className="mb-6">
            <p className="text-sm text-gray-400">Tracking</p>
            <h2 className="text-2xl font-bold mt-1">{t("categoryProgress")}</h2>
          </div>
          {activePlan?.categorys && activePlan.categorys.length > 0 ? (
            <div className="space-y-4">
              {activePlan.categorys.map((category: any) => {
                const progress = categoryProgress[category.category] || 0;
                const overAmount = (
                  (category.amount * (progress - 100)) /
                  100
                ).toFixed(0);
                const progressColor =
                  progress > 100
                    ? "bg-gradient-to-r from-red-500 to-red-400"
                    : progress > 80
                      ? "bg-gradient-to-r from-yellow-500 to-orange-400"
                      : "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300";

                return (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-white font-medium capitalize">
                        {category.category}
                      </h3>
                      <div className="text-right">
                        <span
                          className={`font-bold ${progress > 100 ? "text-red-400" : "text-white"}`}
                        >
                          {progress.toFixed(1)}%
                        </span>
                        <div className="text-sm text-gray-400">
                          {((category.amount * progress) / 100).toFixed(0)} /{" "}
                          {category.amount} {currency}
                        </div>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    {progress > 100 && (
                      <p className="text-red-400 text-sm mt-2">
                        {t("overBudget", {
                          amount: `${overAmount} ${currency}`,
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-gray-400">{t("noCategories")}</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">
          <div className="mb-6">
            <p className="text-sm text-gray-400">Goals</p>
            <h2 className="text-2xl font-bold mt-1">{t("savingsGoals")}</h2>
          </div>
          {activePlan?.targets && activePlan.targets.length > 0 ? (
            <div className="space-y-4">
              {activePlan.targets.map((target: Target) => (
                <div
                  key={target.id}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-white font-medium">
                        {target.target}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {t("goalLabel", {
                          amount: `${target.amount} ${currency}`,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      {target.achieved ? (
                        <span className="text-emerald-400 font-medium">
                          {t("achieved")}
                        </span>
                      ) : (
                        <div>
                          <span className="text-blue-400 font-bold text-lg">
                            {Math.round(targetsProgress[target.id] || 0)}%
                          </span>
                          <div className="text-sm text-gray-400">
                            {(
                              (target.amount *
                                (targetsProgress[target.id] || 0)) /
                              100
                            ).toFixed(0)}{" "}
                            {t("saved")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-gray-800 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, targetsProgress[target.id] || 0)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      {budgetStatus.canAffordTargets[target.id] ? (
                        <span className="text-emerald-400">
                          {t("canAfford")}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          {t("needMore", {
                            amount: `${(target.amount - balance).toFixed(0)} ${currency}`,
                          })}
                        </span>
                      )}
                    </div>
                    {budgetStatus.canAffordTargets[target.id] && (
                      <button
                        onClick={() =>
                          claimTarget(activePlan.id, target.id, target.amount)
                        }
                        disabled={claimingTarget === target.id}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {claimingTarget === target.id
                          ? t("claimingButton")
                          : t("claimButton")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-400">{t("noTargets")}</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">
          <div className="mb-6">
            <p className="text-sm text-gray-400">Insights</p>
            <h2 className="text-2xl font-bold mt-1">
              {t("aiRecommendations")}
            </h2>
          </div>
          {aiRecommendations.length > 0 ? (
            <div className="space-y-3">
              {aiRecommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-4"
                >
                  <p className="text-gray-300">{recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-emerald-300">{t("aiAllGood")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
