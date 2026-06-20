"use client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useState, useEffect } from "react";
import { usePlan } from "../../context/PlanContext";
import { useUI } from "../../context/UIContext";
import { useBankTransaction } from "../../context/BankTransactionContext";
import { useAuthContext } from "../../context/AuthContext";
import { sendEvent } from "../../services/broadcastChannel";
import Cookies from "js-cookie";
import LastsAnalitycs from "./latest/latest";
import InfoSvg from "../../../public/info-icon.svg";
import editSvg from "../../../public/edit-icon.svg";
import {
  DetailItem,
  getFrequencyLabel,
} from "@/app/utils/createDitailsComponent";
import { useTranslations } from "next-intl";
import { authFetch } from "../../services/authFetch";
interface Plan {
  categories: [];
  name: string;
  gainPlan: number;
  lossPlan: number;
  planFor: string;
  id: number;
  type: string;
  totalAmount: number;
  frequency: string;
}
interface ActivePlan {
  id: number;
  isActive: boolean;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
}

interface PlanStatus {
  status: boolean;
  id: number;
}

interface ActivePlansStatus {
  daily: PlanStatus;
  weekly: PlanStatus;
  monthly: PlanStatus;
  yearly: PlanStatus;
}

export default function Analytics() {
  const t = useTranslations("analytics");
  const errT = useTranslations("analyticsErrors");

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    ArcElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  );

  const {
    plans,
    setPlans,
    activePlansStatus,
    setActivePlansStatus,
    storagePlans,
    setStoragePlans,
  } = usePlan();
  const {
    loadingSending,
    setLoadingSending,
    planIsSending,
    error,
    setError,
    setPlanIsSending,
  } = useUI();
  const { login, setLogin } = useAuthContext();
  const {
    trans,
    currency,
    setCurrency,
    setTrans,
    activeBank,
    setActiveBank,
    banks,
  } = useBankTransaction();
  const [editedPlan, setEditedPlan] = useState<any>({});
  const [activeForm, setActiveForm] = useState(false);
  const [activecateghoryForm, setActiveCateghoryForm] = useState(false);
  const [activeTargetForm, setActiveTargetForm] = useState(false);
  const [typeOfPlan, setTypeOfPlan] = useState("expense");
  const [category, setCategory] = useState("food");
  const [amount, setAmount] = useState<string>("");
  const [frequency, setFrequency] = useState("once");
  const [date, setDate] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [planName, setPlanName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [activePlansShow, setActivePlansShow] = useState(false);
  const [activePlanWindow, setActivePlanWindow] = useState(false);
  const [activePlan, setActivePlan] = useState<any>({});
  const [editPlanStatus, setEditPlanStatus] = useState(false);
  const [newPlan, setNewPlan] = useState<any>({});
  const [lastsPlan, setLastsPlan] = useState<any>({});
  const [doublePlansError, setDoublePlansError] = useState(false);
  const [targets, setTargets] = useState<any[]>([]);
  const [newBankCurrency, setNewBankCurrnecy] = useState<
    | "RUB"
    | "USD"
    | "EUR"
    | "GBP"
    | "JPY"
    | "CNY"
    | "CAD"
    | "AUD"
    | "CHF"
    | "KRW"
    | "INR"
    | "BRL"
    | ""
  >("");
  const [target, setTarget] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [activeAddTargetForm, setActiveAddTargetForm] = useState(false);
  const [activeAddCategoryForm, setActiveAddCategoryForm] = useState(false);
  const [canShowAnalytics, setCanShowAnalytics] = useState(false);
  useEffect(() => {
    const filteredPlans = plans.filter(
      (item) => item.frequency === "monthly" && storagePlans.includes(item.id),
    );
    setLastsPlan(filteredPlans[0] || {});
  }, [plans, storagePlans]);

  const getActivePlans = () => {
    const storedPlans = localStorage.getItem("activePlans");
    return storedPlans ? JSON.parse(storedPlans) : [];
  };

  const changeActivePlan = (planId: number, isActive: boolean) => {
    const activePlans = getActivePlans();
    if (isActive) {
      if (!activePlans.includes(planId)) {
        activePlans.push(planId);
        setStoragePlans([...storagePlans, planId]);
        sendEvent({
          type: "SYNC_STORAGE_PLANS",
          payload: [...storagePlans, planId],
        });
      }
    } else {
      const index = activePlans.indexOf(planId);
      if (index > -1) {
        activePlans.splice(index, 1);
        const updated = storagePlans.filter((id: number) => id !== planId);
        setStoragePlans(updated);
        sendEvent({ type: "SYNC_STORAGE_PLANS", payload: updated });
      }
    }
    localStorage.setItem("activePlans", JSON.stringify(activePlans));
  };

  const handleToggleActive = (
    e: React.ChangeEvent<HTMLInputElement>,
    frequency: keyof ActivePlansStatus,
    itemId: number,
  ) => {
    const isChecked = e.target.checked;
    if (
      activePlansStatus[frequency].status &&
      activePlansStatus[frequency].id !== itemId
    ) {
      alert(errT("error"));
      return;
    }
    const updated = {
      ...activePlansStatus,
      [frequency]: {
        status: isChecked,
        id: isChecked ? itemId : 0,
      },
    };
    setActivePlansStatus(updated);
    sendEvent({ type: "SYNC_ACTIVE_PLANS_STATUS", payload: updated });

    changeActivePlan(itemId, isChecked);
    let activePlansIds: number[] = JSON.parse(
      localStorage.getItem("activePlansIds") ?? "[]",
    );
    if (isChecked) {
      if (!activePlansIds.includes(itemId)) {
        activePlansIds = [...activePlansIds, itemId];
      }
    } else {
      activePlansIds = activePlansIds.filter((id) => id !== itemId);
    }
    localStorage.setItem("activePlansIds", JSON.stringify(activePlansIds));
  };

  useEffect(() => {
    if (activePlanWindow) {
      setEditedPlan({ ...activePlan });
    }
  }, [activePlanWindow]);

  useEffect(() => {
    setNewPlan({ ...editedPlan });
  }, [editedPlan]);

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSending(true);
    if (planName === "") {
      alert(errT("enterPlanName"));
      setLoadingSending(false);
      return;
    } else if (Number(totalAmount) === 0) {
      alert(errT("enterTotalAmount"));
      setLoadingSending(false);
      return;
    } else if (isNaN(Number(totalAmount))) {
      alert(errT("totalAmountNumber"));
      setLoadingSending(false);
      return;
    }
    const newPlanData = {
      frequency,
      categorys: editedPlan.categorys || [],
      currency: newBankCurrency,
      name: planName,
      amount: Number(totalAmount),
      type: typeOfPlan,
      targets: editedPlan.targets || [],
      date,
      notes,
    };
    try {
      const request = await authFetch("/api/addPlan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlanData),
      });
      if (!request.ok) throw new Error(errT("failedToAddPlan"));
      const data = await request.json();

      const updatedPlans = [...plans, data.plan];
      setPlans(updatedPlans);
      sendEvent({ type: "ADD_PLAN", payload: data.plan });

      setPlanIsSending(true);
      setLoadingSending(false);
      setActiveForm(false);
      setNewBankCurrnecy("");
      setEditedPlan({});
      setPlanName("");
      setTotalAmount("");
      setNotes("");
      setFrequency("once");
    } catch (error) {
      setLoadingSending(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setNewPlan({ ...newPlan, [field]: value });
  };

  const delPlan = async (id: number) => {
    try {
      const res = await authFetch(`/api/deletePlan?planId=${id}`, {
        method: "DELETE",
        body: JSON.stringify({ planId: id }),
      });
      if (res.ok) {
        setActivePlanWindow(false);
        const updatedPlans = plans.filter((item) => item.id !== id);
        setPlans(updatedPlans);
        sendEvent({ type: "DELETE_PLAN", payload: id });
      }
    } catch (e) {}
  };

  const addPlanButton = async (id: number) => {
    const login = Cookies.get("info_token");
    try {
      const res = await authFetch(`/api/rewritePlan?login=${login}&id=${id}`, {
        method: "POST",
        body: JSON.stringify(newPlan),
      });
      if (res.ok) {
        const updatedPlans = plans.map((item: any) =>
          item.id === id ? newPlan : item,
        );
        setPlans(updatedPlans);
        sendEvent({ type: "UPDATE_PLAN", payload: newPlan });
        setActivePlan(newPlan);
      } else {
      }
    } catch (e) {}
    setEditPlanStatus(false);
  };

  const addCateghoryButton = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveCateghoryForm((m) => !m);
  };

  const removeCategory = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    const updated = {
      ...editedPlan,
      categorys:
        editedPlan.categorys?.filter((item: any) => item.id !== id) || [],
    };
    setEditedPlan(updated);
  };

  const removeTarget = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.preventDefault();
    const updated = {
      ...editedPlan,
      targets: editedPlan.targets?.filter((item: any) => item.id !== id) || [],
    };
    setEditedPlan(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveForm(false);
  };

  useEffect(() => {
    setTimeout(() => {
      setPlanIsSending(false);
    }, 5000);
  }, [planIsSending]);

  const addCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNaN(Number(amount))) {
      alert(errT("amountNumber"));
      return;
    }
    const newCategory = {
      category,
      amount: Number(amount),
      id: Date.now(),
    };
    const updated = {
      ...editedPlan,
      categorys: [...(editedPlan.categorys || []), newCategory],
    };
    setEditedPlan(updated);
    setAmount("");
    setCategory("food");
  };

  const addTargetToEditedPlan = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!target.trim() || Number(targetAmount) <= 0) {
      alert(errT("enterTargetNameAndAmount"));
      return;
    }
    if (isNaN(Number(targetAmount))) {
      alert(errT("targetAmountNumber"));
      return;
    }
    const newTarget = {
      target: target.trim(),
      amount: Number(targetAmount),
      id: Date.now(),
    };
    const updated = {
      ...editedPlan,
      targets: [...(editedPlan.targets || []), newTarget],
    };
    setEditedPlan(updated);
    setTarget("");
    setTargetAmount("");
    setActiveAddTargetForm(false);
  };

  useEffect(() => {
    if (doublePlansError) {
      const time = setTimeout(() => {
        setDoublePlansError(false);
      }, 50000);
      return () => clearTimeout(time);
    }
  }, [doublePlansError]);

  if (error)
    return <div className="text-red-500 text-center p-4">{errT("error")}</div>;

  const gainTrans: any[] = [];
  const lossTrans: any[] = [];

  const addDoublePlansError = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDoublePlansError(true);
  };

  const addTargetButton = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTargetForm((prev) => !prev);
  };

  const addTarget = (e: React.MouseEvent) => {
    e.preventDefault();
    const newTarget = {
      target,
      amount: targetAmount,
      id: Date.now(),
    };
    const updated = {
      ...editedPlan,
      targets: [...(editedPlan.targets || []), newTarget],
    };
    setEditedPlan(updated);
    setTarget("");
    setTargetAmount("");
  };

  return (
    <div style={{ zIndex: 1 }} className="min-h-screen bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_40%)] pointer-events-none" />
      <div className="sticky top-0 z-49 backdrop-blur-lg bg-[#050816]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {t("title")}
              </h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActivePlansShow(!activePlansShow)}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    activePlansShow
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] border border-white/10"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    {t("plansButton")}
                  </span>
                </button>
                <button
                  onClick={() => setActiveForm((prev) => !prev)}
                  className="px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/25"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    {t("addPlanButton")}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {planIsSending && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {t("planCreated")}
            </div>
          </div>
        )}

        {doublePlansError && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className="bg-red-500/90 backdrop-blur-lg text-white p-4 rounded-xl shadow-2xl max-w-sm">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-sm">{t("doublePlansError")}</p>
                </div>
                <button
                  onClick={() => setDoublePlansError(false)}
                  className="ml-4 text-white/80 hover:text-white"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {activePlansShow && (
          <div className="mb-8 animate-fade-in">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                {t("yourPlans")}
              </h2>
              <div className="space-y-3">
                {plans?.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-white/5 bg-white/[0.03] p-4 hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            getActivePlans().includes(item.id)
                              ? "bg-green-400"
                              : "bg-gray-600"
                          }`}
                        />
                        <div>
                          <h3 className="text-white font-medium">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className={`text-sm font-semibold ${
                                item.type === "income"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {item.type === "income" ? "+" : "-"}${item.amount}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-sm text-blue-400 capitalize">
                              {t(`frequency.${item.frequency}`)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {activePlansStatus[item.frequency]?.status &&
                        activePlansStatus[item.frequency]?.id !== item.id ? (
                          <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={addDoublePlansError}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        ) : (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={getActivePlans().includes(item.id)}
                              onChange={(e) =>
                                handleToggleActive(e, item.frequency, item.id)
                              }
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
                          </label>
                        )}

                        <button
                          onClick={() => {
                            setActivePlanWindow(!activePlanWindow);
                            setActivePlan(item);
                          }}
                          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-colors"
                        >
                          <img
                            src={InfoSvg.src}
                            alt=""
                            className="w-4 h-4 opacity-70"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePlanWindow && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setActivePlanWindow(false);
              setActivePlan({});
              setEditPlanStatus(false);
            }}
          >
            <div
              className="w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-[#101827] to-[#0b1220] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex justify-between items-center">
                  {editPlanStatus ? (
                    <input
                      type="text"
                      defaultValue={editedPlan.name || ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="text-2xl font-bold bg-white/20 backdrop-blur px-3 py-1 rounded-lg w-full text-white placeholder-white/70"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-white">
                      {activePlan.name}
                    </h2>
                  )}
                  <div className="flex gap-2">
                    {editPlanStatus ? (
                      <>
                        <button
                          onClick={() => addPlanButton(editedPlan.id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          {t("planDetails.save")}
                        </button>
                        <button
                          onClick={() => setEditPlanStatus(false)}
                          className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white transition-colors"
                        >
                          {t("planDetails.cancel")}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditPlanStatus(true)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <img
                          src={editSvg.src}
                          alt=""
                          className="w-5 h-5 invert"
                        />
                      </button>
                    )}
                    <button
                      onClick={() => delPlan(activePlan.id)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">
                        {t("planDetails.type")}
                      </label>
                      {editPlanStatus ? (
                        <select
                          defaultValue={editedPlan.type || "expense"}
                          onChange={(e) => handleChange("type", e.target.value)}
                          className="mt-1 w-full bg-white/[0.05] border border-white/10 text-white px-3 py-2.5 rounded-xl"
                        >
                          <option value="income">{t("income")}</option>
                          <option value="expense">{t("expense")}</option>
                        </select>
                      ) : (
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              activePlan.type === "income"
                                ? "bg-green-900/50 text-green-300 border border-green-700"
                                : "bg-red-900/50 text-red-300 border border-red-700"
                            }`}
                          >
                            {activePlan.type === "income"
                              ? t("income")
                              : t("expense")}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">
                        {t("planDetails.amount")}
                      </label>
                      {editPlanStatus ? (
                        <input
                          type="number"
                          defaultValue={editedPlan.totalAmount || 0}
                          onChange={(e) =>
                            handleChange("totalAmount", Number(e.target.value))
                          }
                          className={`mt-1 w-full text-2xl font-bold bg-white/[0.05] border border-white/10 px-3 py-2.5 rounded-xl ${
                            editedPlan.type === "income"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        />
                      ) : (
                        <p
                          className={`mt-1 text-2xl font-bold ${
                            activePlan.type === "income"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          ${activePlan.totalAmount}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">
                        {t("planDetails.frequency")}
                      </label>
                      {editPlanStatus ? (
                        <select
                          defaultValue={editedPlan.frequency || "monthly"}
                          onChange={(e) =>
                            handleChange("frequency", e.target.value)
                          }
                          className="mt-1 w-full bg-white/[0.05] border border-white/10 text-white px-3 py-2.5 rounded-xl"
                        >
                          <option value="daily">{t("frequency.daily")}</option>
                          <option value="weekly">
                            {t("frequency.weekly")}
                          </option>
                          <option value="monthly">
                            {t("frequency.monthly")}
                          </option>
                          <option value="yearly">
                            {t("frequency.yearly")}
                          </option>
                        </select>
                      ) : (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                            {t(`frequency.${activePlan.frequency}`)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">
                        {t("planDetails.created")}
                      </label>
                      <p className="mt-1 text-white">
                        {activePlan.createdAt
                          ? new Date(activePlan.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">
                        {t("planDetails.notes")}
                      </label>
                      {editPlanStatus ? (
                        <textarea
                          defaultValue={editedPlan.notes || ""}
                          onChange={(e) =>
                            handleChange("notes", e.target.value)
                          }
                          className="mt-1 w-full bg-white/[0.05] border border-white/10 text-white p-3 rounded-xl h-24 resize-none"
                          placeholder={t("form.notesPlaceholder")}
                        />
                      ) : (
                        <p className="mt-1 text-white bg-white/[0.03] border border-white/5 p-3 rounded-xl min-h-[6rem]">
                          {activePlan.notes || t("planDetails.noNotes")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {t("planDetails.categories")}
                    </h3>
                    {editPlanStatus && (
                      <button
                        onClick={() =>
                          setActiveAddCategoryForm(!activeAddCategoryForm)
                        }
                        className="text-blue-400 text-sm hover:text-blue-300"
                      >
                        {t("planDetails.addCategory")}
                      </button>
                    )}
                  </div>

                  {activeAddCategoryForm && editPlanStatus && (
                    <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          className="bg-white/[0.05] border border-white/10 text-white px-3 py-2.5 rounded-xl"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="housing">
                            {t("categoryOptions.housing")}
                          </option>
                          <option value="utilities">
                            {t("categoryOptions.utilities")}
                          </option>
                          <option value="food">
                            {t("categoryOptions.food")}
                          </option>
                          <option value="transport">
                            {t("categoryOptions.transport")}
                          </option>
                          <option value="health">
                            {t("categoryOptions.health")}
                          </option>
                          <option value="clothing">
                            {t("categoryOptions.clothing")}
                          </option>
                          <option value="personal_care">
                            {t("categoryOptions.personal_care")}
                          </option>
                          <option value="entertainment">
                            {t("categoryOptions.entertainment")}
                          </option>
                          <option value="travel">
                            {t("categoryOptions.travel")}
                          </option>
                          <option value="hobbies">
                            {t("categoryOptions.hobbies")}
                          </option>
                          <option value="communication">
                            {t("categoryOptions.communication")}
                          </option>
                          <option value="subscriptions">
                            {t("categoryOptions.subscriptions")}
                          </option>
                          <option value="savings">
                            {t("categoryOptions.savings")}
                          </option>
                          <option value="investments">
                            {t("categoryOptions.investments")}
                          </option>
                          <option value="insurance">
                            {t("categoryOptions.insurance")}
                          </option>
                          <option value="family">
                            {t("categoryOptions.family")}
                          </option>
                          <option value="gifts">
                            {t("categoryOptions.gifts")}
                          </option>
                          <option value="charity">
                            {t("categoryOptions.charity")}
                          </option>
                          <option value="education">
                            {t("categoryOptions.education")}
                          </option>
                          <option value="taxes">
                            {t("categoryOptions.taxes")}
                          </option>
                          <option value="other">
                            {t("categoryOptions.other")}
                          </option>
                        </select>
                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="bg-white/[0.05] border border-white/10 text-white px-3 py-2.5 rounded-xl placeholder-gray-500"
                          placeholder={t("form.categoryPlaceholder")}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={addCategory}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          {t("form.addCategorySection")}
                        </button>
                        <button
                          onClick={() => setActiveAddCategoryForm(false)}
                          className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white transition-colors text-sm"
                        >
                          {t("planDetails.cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {!editPlanStatus ? (
                      activePlan.categorys?.length > 0 ? (
                        activePlan.categorys.map((cat: any) => (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.03]"
                          >
                            <span className="text-white capitalize">
                              {cat.category}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-green-400 font-medium">
                                ${cat.amount}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg
                            className="w-12 h-12 mx-auto mb-3 opacity-50"
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
                          <p>{t("planDetails.noCategories")}</p>
                        </div>
                      )
                    ) : editedPlan.categorys?.length > 0 ? (
                      editedPlan.categorys.map((cat: any) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.03]"
                        >
                          <span className="text-white capitalize">
                            {cat.category}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-green-400 font-medium">
                              ${cat.amount}
                            </span>
                            <button
                              onClick={(e) => removeCategory(e, cat.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg
                          className="w-12 h-12 mx-auto mb-3 opacity-50"
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
                        <p>{t("planDetails.noCategoriesEdit")}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {t("planDetails.targets")}
                    </h3>
                    {editPlanStatus && (
                      <button
                        onClick={() =>
                          setActiveAddTargetForm(!activeAddTargetForm)
                        }
                        className="text-purple-400 text-sm hover:text-purple-300"
                      >
                        {t("planDetails.addTarget")}
                      </button>
                    )}
                  </div>

                  {activeAddTargetForm && editPlanStatus && (
                    <div className="mb-4 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          className="bg-white/[0.05] border border-white/10 text-white px-3 py-2.5 rounded-xl placeholder-gray-500"
                          placeholder={t("form.targetNamePlaceholder")}
                        />
                        <input
                          type="number"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(e.target.value)}
                          className="bg-white/[0.05] border border-white/10 text-white px-3 py-2.5 rounded-xl placeholder-gray-500"
                          placeholder={t("form.targetAmountPlaceholder")}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={addTargetToEditedPlan}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                        >
                          {t("form.addTargetSection")}
                        </button>
                        <button
                          onClick={() => setActiveAddTargetForm(false)}
                          className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white transition-colors text-sm"
                        >
                          {t("planDetails.cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {!editPlanStatus ? (
                      activePlan.targets?.length > 0 ? (
                        activePlan.targets.map((target: any) => (
                          <div
                            key={target.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.03]"
                          >
                            <span className="text-white">{target.target}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-purple-400 font-medium">
                                ${target.amount}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg
                            className="w-12 h-12 mx-auto mb-3 opacity-50"
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
                          <p>{t("planDetails.noTargets")}</p>
                        </div>
                      )
                    ) : editedPlan.targets?.length > 0 ? (
                      editedPlan.targets.map((target: any) => (
                        <div
                          key={target.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.03]"
                        >
                          <span className="text-white">{target.target}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-purple-400 font-medium">
                              ${target.amount}
                            </span>
                            <button
                              onClick={(e) => removeTarget(e, target.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <svg
                          className="w-12 h-12 mx-auto mb-3 opacity-50"
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
                        <p>{t("planDetails.noTargetsEdit")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeForm && (
          <div className="mb-8 animate-fade-in">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-6">
                {t("form.title")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("form.planName")}
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      placeholder={t("form.planNamePlaceholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("form.totalAmount")}
                    </label>
                    <input
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className="w-full bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("form.currency")}
                    </label>
                    <select
                      onChange={(e) => setNewBankCurrnecy(e.target.value)}
                      value={newBankCurrency}
                      className="w-full bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    >
                      <option value="EUR">{t("currencyOptions.EUR")}</option>
                      <option value="USD">{t("currencyOptions.USD")}</option>
                      <option value="GBP">{t("currencyOptions.GBP")}</option>
                      <option value="JPY">{t("currencyOptions.JPY")}</option>
                      <option value="CNY">{t("currencyOptions.CNY")}</option>
                      <option value="CAD">{t("currencyOptions.CAD")}</option>
                      <option value="AUD">{t("currencyOptions.AUD")}</option>
                      <option value="CHF">{t("currencyOptions.CHF")}</option>
                      <option value="KRW">{t("currencyOptions.KRW")}</option>
                      <option value="INR">{t("currencyOptions.INR")}</option>
                      <option value="BRL">{t("currencyOptions.BRL")}</option>
                      <option value="RUB">{t("currencyOptions.RUB")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("form.type")}
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="income"
                          checked={typeOfPlan === "income"}
                          onChange={() => setTypeOfPlan("income")}
                          className="mr-2 text-blue-500"
                        />
                        <span className="text-gray-300">
                          {t("form.income")}
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="expense"
                          checked={typeOfPlan === "expense"}
                          onChange={() => setTypeOfPlan("expense")}
                          className="mr-2 text-blue-500"
                        />
                        <span className="text-gray-300">
                          {t("form.expense")}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {t("form.frequency")}
                    </label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    >
                      <option value="once">{t("frequency.once")}</option>
                      <option value="daily">{t("frequency.daily")}</option>
                      <option value="weekly">{t("frequency.weekly")}</option>
                      <option value="monthly">{t("frequency.monthly")}</option>
                      <option value="yearly">{t("frequency.yearly")}</option>
                    </select>
                  </div>
                </div>

                {frequency === "once" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t("form.startDate")}
                      </label>
                      <input
                        type="date"
                        onChange={(e) =>
                          setDate((prev) => [e.target.value, ...prev])
                        }
                        className="w-full bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t("form.endDate")}
                      </label>
                      <input
                        type="date"
                        onChange={(e) =>
                          setDate((prev) => [...prev, e.target.value])
                        }
                        className="w-full bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={addCateghoryButton}
                    className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white transition-colors"
                  >
                    {t("form.addCategory")}
                  </button>
                  <button
                    type="button"
                    onClick={addTargetButton}
                    className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white transition-colors"
                  >
                    {t("form.addTarget")}
                  </button>
                </div>

                {activecateghoryForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl border border-white/5 bg-white/[0.03]">
                    <div>
                      <h3 className="text-white font-medium mb-3">
                        {t("form.categories")}
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {editedPlan?.categorys?.map((category) => (
                          <div
                            key={category.id}
                            className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.03]"
                          >
                            <span className="text-gray-300">
                              {category.category}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">
                                ${category.amount}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => removeCategory(e, category.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-3">
                        {t("form.addCategorySection")}
                      </h3>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full mb-3 bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10"
                      >
                        <option value="housing">
                          {t("categoryOptions.housing")}
                        </option>
                        <option value="utilities">
                          {t("categoryOptions.utilities")}
                        </option>
                        <option value="food">
                          {t("categoryOptions.food")}
                        </option>
                        <option value="transport">
                          {t("categoryOptions.transport")}
                        </option>
                        <option value="health">
                          {t("categoryOptions.health")}
                        </option>
                        <option value="clothing">
                          {t("categoryOptions.clothing")}
                        </option>
                        <option value="personal_care">
                          {t("categoryOptions.personal_care")}
                        </option>
                        <option value="entertainment">
                          {t("categoryOptions.entertainment")}
                        </option>
                        <option value="travel">
                          {t("categoryOptions.travel")}
                        </option>
                        <option value="hobbies">
                          {t("categoryOptions.hobbies")}
                        </option>
                        <option value="communication">
                          {t("categoryOptions.communication")}
                        </option>
                        <option value="subscriptions">
                          {t("categoryOptions.subscriptions")}
                        </option>
                        <option value="savings">
                          {t("categoryOptions.savings")}
                        </option>
                        <option value="investments">
                          {t("categoryOptions.investments")}
                        </option>
                        <option value="insurance">
                          {t("categoryOptions.insurance")}
                        </option>
                        <option value="family">
                          {t("categoryOptions.family")}
                        </option>
                        <option value="gifts">
                          {t("categoryOptions.gifts")}
                        </option>
                        <option value="charity">
                          {t("categoryOptions.charity")}
                        </option>
                        <option value="education">
                          {t("categoryOptions.education")}
                        </option>
                        <option value="taxes">
                          {t("categoryOptions.taxes")}
                        </option>
                        <option value="other">
                          {t("categoryOptions.other")}
                        </option>
                      </select>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full mb-3 bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10"
                        placeholder={t("form.categoryPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={(e) => addCategory(e)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {t("form.addCategorySection")}
                      </button>
                    </div>
                  </div>
                )}

                {activeTargetForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl border border-white/5 bg-white/[0.03]">
                    <div>
                      <h3 className="text-white font-medium mb-3">
                        {t("form.targets")}
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {editedPlan?.targets?.map((target) => (
                          <div
                            key={target.id}
                            className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.03]"
                          >
                            <span className="text-gray-300">
                              {target.target}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">
                                ${target.amount}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => removeTarget(e, target.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-3">
                        {t("form.addTargetSection")}
                      </h3>
                      <input
                        type="text"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full mb-3 bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10"
                        placeholder={t("form.targetName")}
                      />
                      <input
                        type="text"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full mb-3 bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10"
                        placeholder={t("form.targetAmountPlaceholder")}
                      />
                      <button
                        type="button"
                        onClick={addTarget}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        {t("form.addTargetSection")}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("form.notes")}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white/[0.05] text-white px-4 py-2.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                    rows={3}
                    placeholder={t("form.notesPlaceholder")}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveForm(false)}
                    className="px-6 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white transition-colors"
                  >
                    {t("form.cancel")}
                  </button>
                  <button
                    type="submit"
                    onClick={submitPlan}
                    disabled={loadingSending}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingSending ? t("form.creating") : t("form.create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-xl">
          <LastsAnalitycs />
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
