'use client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Cookies from 'js-cookie';
import LastsAnalitycs from './lasts/lasts';
import InfoSvg from '../resources/info-icon.svg';
import editSvg from '../resources/edit-icon.svg';   
import {DetailItem,   getFrequencyLabel} from '@/app/utils/createDitailsComponent';
interface Plan {
 categories: [], 
 name: string,
 gainPlan: number,
 lossPlan: number, 
 planFor: string,
 id: number,
 type: string,
 totalAmount: number,
 frequency: string
}
interface ActivePlan {
  id: number;
  isActive: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
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
  ChartJS.register(CategoryScale, LinearScale, PointElement, ArcElement, LineElement, Title, Tooltip, Legend);

  const { 
    trans, 
    setTrans,
    plans,
    setPlans,
    login,
    activeBank,
    activePlansStatus,
    setActivePlansStatus,
    storagePlans,
    setStoragePlans,
    isLoading,
    setIsLoading,
    error,
    setError,
    loadingSending,
    setLoadingSending,
    planIsSending,
    setPlanIsSending
  } = useApp();

  const [activeTab, setActiveTab] = useState('lasts');
  const [activeForm, setActiveForm] = useState(false);
  const [activecateghoryForm, setActiveCateghoryForm] = useState(false);
  const [activeTargetForm, setActiveTargetForm] = useState(false);
  const [categorys, setCategorys] = useState([]);
  const [typeOfPlan, setTypeOfPlan] = useState('expense');
  const [category, setCategory] = useState('food');
  const [amount, setAmount] = useState<number>(0);
  const [frequency, setFrequency] = useState('once');
  const [date, setDate] = useState([]);
  const [notes, setNotes] = useState('');
  const [planName, setPlanName] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [activePlansShow, setActivePlansShow] = useState(false);
  const [activePlanWindow, setActivePlanWindow] = useState(false);
  const [activePlan, setActivePlan] = useState<object>({});
  const [editPlanStatus, setEditPlanStatus] = useState(false);
  const [editedPlan, setEditedPlan] = useState({});
  const [newPlan, setNewPlan] = useState({});
  const [lastsPlan, setLastsPlan] = useState({})
  const [doublePlansError, setDoublePlansError] = useState(false)
  const [targets, setTargets] = useState([]);
  const [target, setTarget] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [activeAddTargetForm, setActiveAddTargetForm] = useState(false);
  const [activeAddCategoryForm, setActiveAddCategoryForm] = useState(false);

  useEffect(()=>{
    const filteredPlans = plans.filter((item)=> item.frequency === 'monthly' && storagePlans.includes(item.id));
    setLastsPlan(filteredPlans[0] || {});
  },[plans, storagePlans])

  const getActivePlans = () => {
    const storedPlans = localStorage.getItem('activePlans');
    return storedPlans ? JSON.parse(storedPlans) : [];
  };

  const changeActivePlan = (planId: number, isActive: boolean) => {
    const activePlans = getActivePlans();
    if (isActive) {
      if (!activePlans.includes(planId)) {
        activePlans.push(planId);
        setStoragePlans([...storagePlans, planId]);
      }
    } else {
      const index = activePlans.indexOf(planId);
      if (index > -1) {
        activePlans.splice(index, 1);
        setStoragePlans(storagePlans.filter((id: number) => id !== planId));
      }
    }
    localStorage.setItem('activePlans', JSON.stringify(activePlans));
  };

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>, frequency: keyof ActivePlansStatus, itemId: number) => {
    const isChecked = e.target.checked;
    

    setActivePlansStatus((prev: ActivePlansStatus) => ({
      ...prev,
      [frequency]: {
        status: isChecked,
        id: isChecked ? itemId : 0
      }
    }));

    changeActivePlan(itemId, isChecked);
  };

  useEffect(() => {
    if (activePlanWindow) {
      setEditedPlan({...activePlan});
    }
  }, [activePlanWindow]);

  useEffect(()=>{
    setNewPlan({...editedPlan})
  },[editedPlan])
  
  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSending(true)
    if(planName === ''){
      alert('Enter plan name');
      return
    }else if(totalAmount === 0){
      alert('Enter total amount');
      return 
    }
    const login = Cookies.get('info_token');
    const newPlan = {
      frequency,
      categorys: categorys,
      name: planName,
      totalAmount,
      type: typeOfPlan,
      targets: targets,
      date,
      login,
      notes,
      id: Date.now()
    };
    try{
      await fetch('api/addPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPlan)
      })
    }catch(e){
    }
    setPlanIsSending(true)
    setLoadingSending(false)
  }

    const handleChange = (field: string, value: any)=>{
      setNewPlan({...newPlan, [field]: value})
  }
  const delPlan = async (id: number) => {
    const login = Cookies.get('info_token');
    try{
      const res = await fetch(`api/deletePlan?id=${id}&login=${login}`, {
        method: 'DELETE'
      })
      if(res.ok){
        setActivePlanWindow(false)
      }
    }catch(e){
    }
  }

  const addPlanButton = async(id: number) => {
    const login = Cookies.get('info_token');
    try{
      const res = await fetch(`api/rewritePlan?login=${login}&id=${id}`, {
        method: 'POST',
         body: JSON.stringify(newPlan)}
    )
    if(res.ok){
      setPlans((prev: any[]) => prev.map((item: any) => item.id === id ? newPlan : item))
      setActivePlan(newPlan)
    }else{
    }
    }catch(e){
    }
    setEditPlanStatus(false);
  };
  const addCateghoryButton = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveCateghoryForm((m) => !m);
  };
  const removeCategory = (e: React.MouseEvent, id: number)=>{
    e.preventDefault()

    setEditedPlan(prev => ({
      ...prev, 
      categorys: prev.categorys?.filter((item: any) => item.id !== id) || []  
    }))
  }

  const removeTarget = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.preventDefault();
    setEditedPlan(prev => ({
      ...prev,                                                 
      targets: prev.targets?.filter((item: any) => item.id !== id) || [] 
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    setActiveForm(false);
  };
  useEffect(() => {
    setTimeout(() => {
      setPlanIsSending(false)
    }, 5000)
  },[planIsSending])
  const addCategory = (e) => {
    e.preventDefault()
    const newCategory = {
      category, 
      amount,
      id: Date.now()
    }
    setEditedPlan(prev => ({
      ...prev,
      categorys: [...(prev.categorys || []), newCategory]
    }))
  }

  const addTargetToEditedPlan = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!target.trim() || targetAmount <= 0) {
      alert('Please enter both target name and amount')
      return
    }
    const newTarget = {
      target: target.trim(),
      amount: targetAmount,
      id: Date.now()
    }
    setEditedPlan(prev => ({
      ...prev,
      targets: [...(prev.targets || []), newTarget]
    }))
    // Очистить поля после добавления
    setTarget('')
    setTargetAmount(0)
    setActiveAddTargetForm(false)
  }
  useEffect(()=>{
  if(doublePlansError){
  const time = setTimeout(()=>{
  setDoublePlansError(false)
  return ()=> clearTimeout(time)
  }, 50000)
  }

  }, [doublePlansError])
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  
  // Создаем пустые массивы для совместимости с LastsAnalitycs
  const gainTrans: any[] = [];
  const lossTrans: any[] = [];
    const addDoublePlansError = (e: React.ChangeEvent<HTMLInputElement>)=>{
    e.preventDefault();
    setDoublePlansError(true)

  }
  const addTargetButton = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTargetForm((prev) => !prev);
  };

  const addTarget = (e: React.MouseEvent) => {
    e.preventDefault();
    const newTarget = {
      target,
      amount: targetAmount,
      id: Date.now()
    };
    setTargets(prev => [...(prev || []), newTarget]);
    setTarget('');
    setTargetAmount(0);
  };

  return (
    <div style={{'z-index': 1}} className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Modern Header */}
      <div className="sticky top-0 z-49 backdrop-blur-lg bg-gray-900/70 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActivePlansShow(!activePlansShow)}  
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    activePlansShow 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/25' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Plans
                  </span>
                </button>
                <button
                  onClick={() => setActiveForm(prev => !prev)}
                  className="px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg shadow-green-500/25"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Plan
                  </span>
                </button>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification Toast */}
        {planIsSending && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Plan created successfully!
            </div>
          </div>
        )}

        {/* Error Toast */}
        {doublePlansError && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className="bg-red-500/90 backdrop-blur-lg text-white p-4 rounded-xl shadow-2xl max-w-sm">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm">Cannot create multiple active plans with the same frequency.</p>
                </div>
                <button 
                  onClick={() => setDoublePlansError(false)}
                  className="ml-4 text-white/80 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plans Section */}
        {activePlansShow && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Your Plans
              </h2>
              <div className="space-y-3">
                {plans?.map((item) => (
                  <div 
                    key={item.id} 
                    className="group bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          getActivePlans().includes(item.id) ? 'bg-green-400' : 'bg-gray-600'
                        }`} />
                        <div>
                          <h3 className="text-white font-medium">{item.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-sm font-semibold ${
                              item.type === 'income' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.type === 'income' ? '+' : '-'}${item.totalAmount}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-sm text-blue-400 capitalize">{item.frequency}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {activePlansStatus[item.frequency]?.status && activePlansStatus[item.frequency]?.id !== item.id ? (
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
                              onChange={(e) => handleToggleActive(e, item.frequency, item.id)}
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
                          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                        >
                          <img src={InfoSvg.src} alt="" className="w-4 h-4 opacity-70" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Plan Details Modal */}
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
              className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex justify-between items-center">
                  {editPlanStatus ? (
                    <input
                      type="text"
                      defaultValue={editedPlan.name || ''}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="text-2xl font-bold bg-white/20 backdrop-blur px-3 py-1 rounded-lg w-full text-white placeholder-white/70"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-white">{activePlan.name}</h2>
                  )}
                  <div className="flex gap-2">
                    {editPlanStatus ? (
                      <>
                        <button 
                          onClick={() => addPlanButton(editedPlan.id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditPlanStatus(false)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setEditPlanStatus(true)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <img src={editSvg.src} alt="" className="w-5 h-5 invert" />
                      </button>
                    )}
                    <button 
                      onClick={() => delPlan(activePlan.id)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Type</label>
                      {editPlanStatus ? (
                        <select
                          defaultValue={editedPlan.type || 'expense'}
                          onChange={(e) => handleChange('type', e.target.value)}
                          className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      ) : (
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            activePlan.type === 'income' 
                              ? 'bg-green-900/50 text-green-300 border border-green-700' 
                              : 'bg-red-900/50 text-red-300 border border-red-700'
                          }`}>
                            {activePlan.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Amount</label>
                      {editPlanStatus ? (
                        <input
                          type="number"
                          defaultValue={editedPlan.totalAmount || 0}
                          onChange={(e) => handleChange('totalAmount', Number(e.target.value))}
                          className={`mt-1 w-full text-2xl font-bold bg-gray-700 px-3 py-2 rounded-lg ${
                            editedPlan.type === 'income' ? 'text-green-400' : 'text-red-400'
                          }`}
                        />
                      ) : (
                        <p className={`mt-1 text-2xl font-bold ${
                          activePlan.type === 'income' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${activePlan.totalAmount}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Frequency</label>
                      {editPlanStatus ? (
                        <select
                          defaultValue={editedPlan.frequency || 'monthly'}
                          onChange={(e) => handleChange('frequency', e.target.value)}
                          className="mt-1 w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      ) : (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                            {getFrequencyLabel(activePlan.frequency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Created</label>
                      <p className="mt-1 text-white">
                        {activePlan.createdAt ? new Date(activePlan.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Notes</label>
                      {editPlanStatus ? (
                        <textarea
                          defaultValue={editedPlan.notes || ''}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          className="mt-1 w-full bg-gray-700 text-white p-3 rounded-lg h-24 resize-none"
                          placeholder="Add notes..."
                        />
                      ) : (
                        <p className="mt-1 text-white bg-gray-700/50 p-3 rounded-lg min-h-[6rem]">
                          {activePlan.notes || 'No notes'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Categories Section */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white">Categories</h3>
                    {editPlanStatus && (
                      <button 
                        onClick={() => setActiveAddCategoryForm(!activeAddCategoryForm)}
                        className="text-blue-400 text-sm hover:text-blue-300"
                      >
                        + Add Category
                      </button>
                    )}
                  </div>
                    
                    {activeAddCategoryForm && editPlanStatus && (
                      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select 
                            className="bg-gray-700 text-white px-3 py-2 rounded-lg"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            <option value="housing">🏠 Housing</option>
                            <option value="utilities">⚡ Utilities</option>
                            <option value="food">🍽️ Food</option>
                            <option value="transport">🚗 Transportation</option>
                            <option value="health">🏥 Health</option>
                            <option value="clothing">👕 Clothing</option>
                            <option value="personal_care">🧴 Personal Care</option>
                            <option value="entertainment">🎬 Entertainment</option>
                            <option value="travel">✈️ Travel</option>
                            <option value="hobbies">🎨 Hobbies</option>
                            <option value="communication">📱 Phone/Internet</option>
                            <option value="subscriptions">📺 Subscriptions</option>
                            <option value="savings">💰 Savings</option>
                            <option value="investments">📈 Investments</option>
                            <option value="insurance">🛡️ Insurance</option>
                            <option value="family">👨‍👩‍👧‍👦 Family</option>
                            <option value="gifts">🎁 Gifts</option>
                            <option value="charity">❤️ Charity</option>
                            <option value="education">📚 Education</option>
                            <option value="taxes">🏛️ Taxes</option>
                            <option value="other">📦 Other</option>
                          </select>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="bg-gray-700 text-white px-3 py-2 rounded-lg placeholder-gray-400"
                            placeholder="Amount"
                          />
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={addCategory}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                          >
                            Add Category
                          </button>
                          <button 
                            onClick={() => setActiveAddCategoryForm(false)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {!editPlanStatus ? (
                        // Режим просмотра
                        activePlan.categorys?.length > 0 ? (
                          activePlan.categorys.map((cat: any) => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                              <span className="text-white capitalize">{cat.category}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-green-400 font-medium">${cat.amount}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p>No categories added to this plan</p>
                          </div>
                        )
                      ) : (
                        // Режим редактирования
                        editedPlan.categorys?.length > 0 ? (
                          editedPlan.categorys.map((cat: any) => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                              <span className="text-white capitalize">{cat.category}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-green-400 font-medium">${cat.amount}</span>
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
                            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <p>No categories added yet. Click "Add Category" to start.</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                {/* Targets Section */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-white">Targets</h3>
                    {editPlanStatus && (
                      <button 
                        onClick={() => setActiveAddTargetForm(!activeAddTargetForm)}
                        className="text-purple-400 text-sm hover:text-purple-300"
                      >
                        + Add Target
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
                          className="bg-gray-700 text-white px-3 py-2 rounded-lg placeholder-gray-400"
                          placeholder="🎯 Target name (e.g., Emergency Fund, Vacation)"
                        />
                        <input
                          type="number"
                          value={targetAmount}
                          onChange={(e) => setTargetAmount(Number(e.target.value))}
                          className="bg-gray-700 text-white px-3 py-2 rounded-lg placeholder-gray-400"
                          placeholder="Target amount"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button 
                          onClick={addTargetToEditedPlan}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Add Target
                        </button>
                        <button 
                          onClick={() => setActiveAddTargetForm(false)}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {!editPlanStatus ? (
                      // Режим просмотра
                      activePlan.targets?.length > 0 ? (
                        activePlan.targets.map((target: any) => (
                          <div key={target.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <span className="text-white">{target.target}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-purple-400 font-medium">${target.amount}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p>No targets set for this plan</p>
                        </div>
                      )
                    ) : (
                      // Режим редактирования
                      editedPlan.targets?.length > 0 ? (
                        editedPlan.targets.map((target: any) => (
                          <div key={target.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <span className="text-white">{target.target}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-purple-400 font-medium">${target.amount}</span>
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
                          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p>No targets added yet. Click "Add Target" to start.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Plan Form */}
        {activeForm && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-6">Create New Plan</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                    <input 
                      type="text" 
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="Enter plan name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Amount</label>
                    <input 
                      type="number" 
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="income"
                          checked={typeOfPlan === 'income'}
                          onChange={() => setTypeOfPlan('income')}
                          className="mr-2 text-blue-500"
                        />
                        <span className="text-gray-300">Income</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="expense"
                          checked={typeOfPlan === 'expense'}
                          onChange={() => setTypeOfPlan('expense')}
                          className="mr-2 text-blue-500"
                        />
                        <span className="text-gray-300">Expense</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="once">One-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {frequency === 'once' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                      <input
                        type="date"
                        onChange={(e) => setDate(prev => [e.target.value, ...prev])}
                        className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                      <input
                        type="date"
                        onChange={(e) => setDate(prev => [...prev, e.target.value])}
                        className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={addCateghoryButton} 
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    + Add Category
                  </button>
                  <button 
                    type="button"
                    onClick={addTargetButton} 
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    + Add Target
                  </button>
                </div>

                {activecateghoryForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium mb-3">Categories</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {categorys.map((category) => (
                          <div key={category.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                            <span className="text-gray-300">{category.category}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">${category.amount}</span>
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
                      <h3 className="text-white font-medium mb-3">Add Category</h3>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full mb-3 bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600"
                      >
                        <option value="housing">Housing</option>
                        <option value="utilities">Utilities</option>
                        <option value="food">Food</option>
                        <option value="transport">Transportation</option>
                        <option value="health">Health</option>
                        <option value="clothing">Clothing</option>
                        <option value="personal_care">Personal Care</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="travel">Travel</option>
                        <option value="hobbies">Hobbies</option>
                        <option value="communication">Phone/Internet</option>
                        <option value="subscriptions">Subscriptions</option>
                        <option value="savings">Savings</option>
                        <option value="investments">Investments</option>
                        <option value="insurance">Insurance</option>
                        <option value="family">Family</option>
                        <option value="gifts">Gifts</option>
                        <option value="charity">Charity</option>
                        <option value="education">Education</option>
                        <option value="taxes">Taxes</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full mb-3 bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600"
                        placeholder="Amount"
                      />
                      <button 
                        type="button"
                        onClick={addCategory}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {activeTargetForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-700/30 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium mb-3">Targets</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {targets.map((target) => (
                          <div key={target.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                            <span className="text-gray-300">{target.target}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">${target.amount}</span>
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
                      <h3 className="text-white font-medium mb-3">Add Target</h3>
                      <input
                        type="text"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full mb-3 bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600"
                        placeholder="Target name"
                      />
                      <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(Number(e.target.value))}
                        className="w-full mb-3 bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600"
                        placeholder="Target amount"
                      />
                      <button 
                        type="button"
                        onClick={addTarget}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    rows={3}
                    placeholder="Additional information..."
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setActiveForm(false)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    onClick={submitPlan}
                    disabled={loadingSending}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingSending ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Analytics Content - Only Lasts */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <LastsAnalitycs gainTrans={gainTrans} lossTrans={lossTrans} trans={[]} transObj={trans} lastsPlan={lastsPlan} />
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
