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
import Cookies from 'js-cookie';
import GlobalsAnalytics from './globals/globals';
import MonthAnalitycs from './month/month';
import YearAnalitycs from './year/year';
import CustomAnalitycs from './custom/weak';
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

  const [trans, setTrans] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('lasts');
  const [isLoading, setIsLoading] = useState(true);
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
  const [loadingSending, setLoadingSending] = useState(false);
  const [planIsSending, setPlanIsSending] = useState(false);
  const [activePlansShow, setActivePlansShow] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanWindow, setActivePlanWindow] = useState(false);
  const [activePlan, setActivePlan] = useState<object>({});
  const [editPlanStatus, setEditPlanStatus] = useState(false);
  const [editedPlan, setEditedPlan] = useState({});
  const [newPlan, setNewPlan] = useState({});
  const [activePlansStatus, setActivePlansStatus] = useState<ActivePlansStatus>({
    daily: { status: false, id: 0 },
    weekly: { status: false, id: 0 },
    monthly: { status: false, id: 0 },
    yearly: { status: false, id: 0 }
  });
  const [lastsPlan, setLastsPlan] = useState({})
  const [doublePlansError, setDoublePlansError] = useState(false)
  const [storagePlans, setStoragePlans] = useState([]);
  const [targets, setTargets] = useState([]);
  const [target, setTarget] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [activeAddTargetForm, setActiveAddTargetForm] = useState(false);
  const [activeAddCategoryForm, setActiveAddCategoryForm] = useState(false);
  useEffect(()=>{
    async function getRedis(){
      try{
    const res = await fetch('api/getTransRedis?login='+ Cookies.get('info_token'), {
      method: 'GET'
    })
    if(res.ok){
      const data = await res.json();
      const upatedTransactions = [Object.values(data.value).flat()]
      console.log(upatedTransactions[0]);
      setTrans(upatedTransactions[0])
    }
  }catch(e){
    console.log(e)
  }finally{
    setIsLoading(false) 
  }
  }
  getRedis()
  },[])
  useEffect(()=>{
    const filteredPlans = plans.filter((item)=> item.frequency === 'monthly' && storagePlans.includes(item.id));
    setLastsPlan(filteredPlans[0] || {});
  },[plans, storagePlans])
  const getActivePlans = () => {
    const activePlans = localStorage.getItem('activePlans');
    return activePlans ? JSON.parse(activePlans) : [];
  };
  const changeActivePlan = (planId: number, isActive: boolean) => {
    const activePlans = getActivePlans();
    if (isActive) {
      if (!activePlans.includes(planId)) {
        activePlans.push(planId);
        setStoragePlans((prev)=> [...prev, planId])
      }
    } else {
      const index = activePlans.indexOf(planId);
      if (index > -1) {
        activePlans.splice(index, 1);
        setStoragePlans((prev)=> prev.splice(index, 1))
      }
    }
    localStorage.setItem('activePlans', JSON.stringify(activePlans));
  };

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>, frequency: keyof ActivePlansStatus, itemId: number) => {
    const isChecked = e.target.checked;
    

    setActivePlansStatus(prev => ({
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
  useEffect(() => {
    async function getPlans(){
    const login = Cookies.get('info_token');
    try{
      const res = await fetch(`api/getPlans?login=${login}`, {
        method: 'GET'
      })
      if(res.ok){
        const data = await res.json();
        const activePlans = getActivePlans();
        
        const activePlansStatus = data.plans.reduce((acc: ActivePlansStatus, plan: Plan) => {
          if (activePlans.includes(plan.id)) {
            acc[plan.frequency as keyof ActivePlansStatus] = {
              status: true,
              id: plan.id
            };
          }
          return acc;
        }, {
          daily: { status: false, id: 0 },
          weekly: { status: false, id: 0 },
          monthly: { status: false, id: 0 },
          yearly: { status: false, id: 0 }
        });

        setActivePlansStatus(activePlansStatus);
        setPlans(data.plans);
      }
    }catch(e){
      console.log(e)
    }
    }
    getPlans()
  }, [])
  useEffect(()=>{
    setNewPlan({...editedPlan})
  },[editedPlan])
  const submitPlan = async (e) => {
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
      console.log(e)
    }
    setPlanIsSending(true)
    setLoadingSending(false)
  }

    const handleChange = (field, value)=>{
      setNewPlan({...newPlan, [field]: value})
  }
  const delPlan = async (id) => {
    const login = Cookies.get('info_token');
    try{
      const res = await fetch(`api/deletePlan?id=${id}&login=${login}`, {
        method: 'DELETE'
      })
      if(res.ok){
        console.log('plan deleted')
        setActivePlanWindow(false)
      }
    }catch(e){
      console.log(e)
    }
  }

  const addPlanButton = async(id) => {
    const login = Cookies.get('info_token');
    try{
      const res = await fetch(`api/rewritePlan?login=${login}&id=${id}`, {
        method: 'POST',
         body: JSON.stringify(newPlan)}
    )
    if(res.ok){
      setPlans(prev => prev.map((item) => item.id === id ? newPlan : item))
      setActivePlan(newPlan)
      console.log('ok')
    }else{
      console.log('not ok xdddd')
    }
    }catch(e){
      console.log(e)
    }
    setEditPlanStatus(false);
  };

  const addCateghoryButton = (e) => {
    e.preventDefault();
    setActiveCateghoryForm((m) => !m);
  };

  const removeCategory = (e, id)=>{
    e.preventDefault()
    console.log(id)
    setCategorys(prev => prev.filter((item) => item.id !== id))
  }

  const removeTarget = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.preventDefault();
    setTargets(prev => prev.filter((item) => item.id !== id));
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
    setCategorys(prev => [...(prev || []),newCategory])
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
  if (isLoading) return <div className="text-center p-4">Loading...</div>;
  
  const gainTrans = trans.filter((item) => item.type === 'gain');
  const lossTrans = trans.filter((item) => item.type === 'loss');
    const addDoublePlansError = (e)=>{
    e.preventDefault();
    setDoublePlansError(true)

  }
  const addTargetButton = (e) => {
    e.preventDefault();
    setActiveTargetForm((prev) => !prev);
  };

  const addTarget = (e) => {
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

    <div className="bg-dark min-h-screen p-4 md:p-8">

      {
        activePlanWindow && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center"
            onClick={() => {
              setActivePlanWindow(false);
              setActivePlan({});
              setEditPlanStatus(false);
            }}
          >
            <div 
              className="w-[90%] md:w-[70%] lg:w-[40%] bg-gray-800 border-2 border-gray-600 rounded-xl shadow-2xl overflow-hidden h-[60vh] max-h-[600px] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gray-700 p-4 border-b border-gray-600 flex justify-between items-center">
                {editPlanStatus ? (
                  <input
                    type="text"
                    defaultValue={editedPlan.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="text-xl font-bold text-white bg-gray-600 px-2 py-1 rounded w-full"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-white truncate" >{activePlan.name}</h2>
                )}
                <div className="flex gap-2">
                  {editPlanStatus ? (
                    <>
                      <button 
                        onClick={()=>addPlanButton(editedPlan.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Сохранить
                      </button>
                      <button 
                        onClick={() => setEditPlanStatus(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    null
                  )}
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div className="space-y-4">
                    <DetailItem 
                      label="type" 
                      value={
                        editPlanStatus ? (
                          <select
                            defaultValue={editedPlan.type || 'expense'}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="bg-gray-700 text-white px-2 py-1 rounded"
                          >
                            <option value="income">Доход</option>
                            <option value="expense">Расход</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activePlan.type === 'income' 
                              ? 'bg-green-900 text-green-100' 
                              : 'bg-red-900 text-red-100'
                          }`}>
                            {activePlan.type === 'income' ? 'income' : 'expense'}
                          </span>
                        )
                      }
                    />
                          <button className="text-blue-400 text-sm" onClick={() => setActiveAddCategoryForm((prev)=> !prev)}>
                          + add type
                        </button>
                    <DetailItem 
                      label="Сумма" 
                      value={
                        editPlanStatus ? (
                          <input
                            type="number"
                            defaultValue={editedPlan.totalAmount || 0}
                            onChange={(e) => handleChange('totalAmount', Number(e.target.value))}
                            className={`text-lg font-bold bg-gray-700 px-2 py-1 rounded w-full ${
                              editedPlan.type === 'income' ? 'text-green-400' : 'text-red-400'
                            }`}
                          />
                        ) : (
                          <span className={`text-lg font-bold ${
                            activePlan.type === 'income' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {activePlan.totalAmount}$
                          </span>
                        )
                      }
                    />

                    <DetailItem 
                      label="Периодичность" 
                      value={
                        editPlanStatus ? (
                          <select
                            defaultValue={editedPlan.frequency || 'monthly'}
                            onChange={(e) => handleChange('frequency', e.target.value)}
                            className="bg-gray-700 text-white px-2 py-1 rounded"
                          >
                            <option value="daily">daily</option>
                            <option value="weekly">weekly</option>
                            <option value="monthly">monthly</option>
                            <option value="yearly">yearly</option>
                          </select>
                        ) : (
                          <span className="bg-blue-900 text-blue-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            {getFrequencyLabel(activePlan.frequency)}
                          </span>
                        )
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <DetailItem 
                      label="Дата создания" 
                      value={new Date(activePlan.createdAt).toLocaleDateString()}
                    />

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Примечания</h4>
                      {editPlanStatus ? (
                        <textarea
                          defaultValue={editedPlan.notes || ''}
                          onChange={(e) => handleChange('notes', e.target.value)}
                          className="text-white bg-gray-700 p-3 rounded-lg w-full h-24"
                        />
                      ) : (
                        <p className="text-white bg-gray-700 p-3 rounded-lg">
                          {activePlan.notes || 'Нет примечаний'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {activePlan.categorys?.length > 0 && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-white">Категории</h3>
                      {editPlanStatus && (
                        <button className="text-blue-400 text-sm" onClick={() => setActiveAddCategoryForm((prev)=> !prev)}>
                          + add Cathegory
                        </button>
                      )}
                    </div>
                    {activeAddCategoryForm && editPlanStatus && (
                      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                        <div className="flex gap-4">
                          <select 
                            className="bg-gray-600 text-white px-2 py-1 rounded"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
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
                            className="bg-gray-600 text-white px-2 py-1 rounded w-24"
                            placeholder="Amount"
                          />
                          <button 
                            onClick={() => {
                              const newCategory = {
                                category,
                                amount,
                                id: Date.now()
                              };
                              const newCategories = [...(editedPlan.categorys || []), newCategory];
                              handleChange('categorys', newCategories);
                              setCategory('housing');
                              setAmount(0);
                              setActiveAddCategoryForm(false);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {activePlan.categorys.map((cat, index) => (
                        <span 
                          key={index} 
                          className={`inline-flex items-center px-3 py-1 rounded-full ${
                            editPlanStatus ? 'bg-gray-600' : 'bg-gray-700'
                          } text-gray-200 text-sm font-medium`}
                        >
                          {editPlanStatus ? (
                            <>
                              <select name="" id=""  onChange={(e) => {
                                  const newCategories = [...editedPlan.categorys];
                                  newCategories[index].category = e.target.value;
                                  handleChange('categorys', newCategories);
                                }} className="bg-gray-500 px-1 rounded w-20"> 
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
                                  <option value="another">Another</option>
                                </select>
                              <input
                                type="number"
                                defaultValue={cat.amount}
                                onChange={(e) => {
                                  const newCategories = [...editedPlan.categorys];
                                  newCategories[index].amount = Number(e.target.value);
                                  handleChange('categorys', newCategories);
                                }}
                                className="bg-gray-500 px-1 rounded w-16"
                              />
                              $
                            </>
                          ) : (
                            `${cat.category}: ${cat.amount}$`
                          )}
                        </span>
                      ))}
                      
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white w-[20%]">your targets</h3>
                        {editPlanStatus && (
                          <button className="text-blue-400 text-sm" onClick={() => setActiveAddTargetForm((prev)=> !prev)}>
                            + add Target
                          </button>
                        )}
                      </div>
                      {activeAddTargetForm && editPlanStatus && (
                        <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                          <div className="flex gap-4">
                            <input
                              type="text"
                              value={target}
                              onChange={(e) => setTarget(e.target.value)}
                              className="bg-gray-600 text-white px-2 py-1 rounded w-48"
                              placeholder="Название цели"
                            />
                            <input
                              type="number"
                              value={targetAmount}
                              onChange={(e) => setTargetAmount(Number(e.target.value))}
                              className="bg-gray-600 text-white px-2 py-1 rounded w-24"
                              placeholder="Сумма"
                            />
                            <button 
                              onClick={() => {
                                const newTarget = {
                                  target,
                                  amount: targetAmount,
                                  id: Date.now()
                                };
                                const newTargets = [...(editedPlan.targets || []), newTarget];
                                handleChange('targets', newTargets);
                                setTarget('');
                                setTargetAmount(0);
                                setActiveAddTargetForm(false);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Добавить
                            </button>
                          </div>
                        </div>
                      )}
                      { !editPlanStatus ?
                        activePlan.targets?.map((target: {target: string, amount: number, id: number}) => (
                          <div key={target.id} className="flex items-center justify-between px-4 py-2 border-b border-gray-400">
                            <span className="text-white">{target.target}</span>
                            <span className='text-white'>{`${target.amount}$`}</span>
                          </div>
                        )) 
                        :
                        activePlan.targets?.map((target: {target: string, amount: number, id: number}) => (
                          <div key={target.id} className="flex items-center justify-between px-4 py-2 border-b border-gray-400">
                            <input 
                              type="text" 
                              defaultValue={target.target} 
                              onChange={(e) => {
                                const newTargets = [...editedPlan.targets];
                                const index = newTargets.findIndex(t => t.id === target.id);
                                if (index !== -1) {
                                  newTargets[index].target = e.target.value;
                                  handleChange('targets', newTargets);
                                }
                              }}
                              className="bg-gray-500 px-2 py-1 rounded text-white w-32"
                            />
                            <input 
                              type="number" 
                              defaultValue={target.amount} 
                              onChange={(e) => {
                                const newTargets = [...editedPlan.targets];
                                const index = newTargets.findIndex(t => t.id === target.id);
                                if (index !== -1) {
                                  newTargets[index].amount = Number(e.target.value);
                                  handleChange('targets', newTargets);
                                }
                              }}
                              className="bg-gray-500 px-2 py-1 rounded text-white w-20"
                            />
                          </div>
                          
                        )) 
                        
                        
                      }
                      
                    </div>
                  </div>
                )}
                
              </div>
              <div className="bg-gray-700 p-4 border-t border-gray-600 flex justify-end gap-4">
              <button className='  text-white rounded-lg transition-colors flex hover:opacity-100 opacity-60' onClick={() => setEditPlanStatus((prev)=> !prev)}>
                <img src={editSvg.src} alt="" />
              </button>
              <button className='text-white rounded-lg transition-colors flex hover:scale-108 transition-transform  bg-red-600 p-2' onClick={() => delPlan(activePlan.id)}>
                delete
              </button>
              <button
                onClick={() => setActivePlanWindow(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                close
              </button>
            </div>
            </div>
          </div>
        )
      }
      
      <div className="max-w-6xl mx-auto">
      {
        planIsSending ? 
        <div className='w-[100%] flex justify-center'>
          <p className='text-[green] font-[900] '>Plan is sending</p>
        </div>
        : null
        
      }

        <div className="flex flex-wrap justify-center gap-4 mb-8 p-4 bg-gray-800 rounded-lg">
{
  doublePlansError && (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className="w-72 bg-white rounded-lg shadow-xl border-l-4 border-blue-300 overflow-hidden">
        <div className="flex items-center justify-between bg-gray-300 px-4 py-3">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-blue-700">Ошибка плана</h3>
          </div>
          <button
            onClick={() => setDoublePlansError(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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

        <div className="px-4 py-3 text-sm text-white-700 bg-gray-700">
          <p>Нельзя создать несколько активных планов с одинаковой периодичностью.</p>

        </div>


      </div>
    </div>
  )
}
          <button className={activePlansShow ? `btn-primary` : `btn-secondary`} onClick={() => setActivePlansShow(!activePlansShow)}>
            Plans
          </button>
          <button
            className={`btn-primary`}
            onClick={()=> setActiveForm((prev)=>!prev)}
          >
            Add Plan
          </button>

          <button 
            onClick={() => setActiveTab('lasts')} 
            className={`tab-btn ${activeTab === 'lasts' ? 'active' : ''}`}
          >
            Lasts
          </button>
          <button 
            onClick={() => setActiveTab('global')} 
            className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
          >
            Global
          </button>
          <button 
            onClick={() => setActiveTab('year')} 
            className={`tab-btn ${activeTab === 'year' ? 'active' : ''}`}
          >
            Year
          </button>
          <button 
            onClick={() => setActiveTab('month')} 
            className={`tab-btn ${activeTab === 'month' ? 'active' : ''}`}
          >
            Month
          </button>
          <button 
            onClick={() => setActiveTab('custom')} 
            className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
          >
            Custom
          </button>

        </div>
          {activePlansShow && (

          <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg max-w-4xl mx-auto transition-all duration-300">
            <div>
              {
                  plans  ? 
                  plans.map((item) => (

                    (
                      
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-6">

                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          {item.name}
                          
                        </span>
                        <span className={`text-lg font-semibold ${
                          item.type === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}{item.totalAmount}$
                        </span>
                        <div className='text-[#5048f0]'>

                        {item.frequency}
                        </div>
                        
                      </div>
                    </div>
                    <div className='flex gap-4'>
                    { activePlansStatus[item.frequency].status && !(activePlansStatus[item.frequency].id === item.id)  ?
                       <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          onChange={(e) => addDoublePlansError(e)}
                          className="form-checkbox h-5 w-5 rounded-[20px] focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 opacity-[0.5]"
                        />
                      </label>
                      :
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked={getActivePlans().includes(item.id)}
                          onChange={(e) => handleToggleActive(e, item.frequency, item.id)}
                          className="form-checkbox h-5 w-5 rounded-[20px] focus:ring-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
                      </label>
                    }

                    <button
                      onClick={() => {
                        setActivePlanWindow((prev)=> !prev)
                        setActivePlan(item)
                      }}
                      className="flex items-center justify-center p-2 text-sm font-medium text-white  rounded-lg opacity-50 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
                      aria-label="View details"
                    >
                      <img src={InfoSvg.src} alt="" className='w-5 h-5 '/>  
                    </button>
                    </div>
                  </div>
                    )

                ))
                : null

              }
            </div>
          </div>
          )}


{activeForm && (
  <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg max-w-2xl mx-auto">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="planName" className='opacity-50'>Name Of Plan</label>
        <input 
          type="text" 
          id="planName"
          name="planName"
          className="form-input w-full"
          onChange={(e) => setPlanName(e.target.value)}
        />
      </div>
      <div className='flex gap-20'>
      <div className="form-group">
        <label className="form-label">Transaction Type</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="transactionType"
              value="income"
              className="form-radio"
              checked={typeOfPlan === 'income'}
              onChange={() => setTypeOfPlan('income')}
            />
            <span className="ml-2">Income</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="transactionType"
              value="expense"
              className="form-radio"
              checked={typeOfPlan === 'expense'}
              onChange={() => setTypeOfPlan('expense')}
            />
            <span className="ml-2">Expense</span>
          </label>
        </div>
      </div>
        <div>
        <label htmlFor="planName" className=''>Total Amount</label>
        <input 
          type="number" 
          id="planName"
          name="planName"
          onChange={(e) => setTotalAmount(e.target.value)}
          className="form-input w-full"
        />
        </div>
        <div className="form-group w-[200px]">
        <label className="form-label">Frequency</label>
        <select
          className="form-input w-full"
          name="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="once">One-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      
      </div>
      {frequency == 'once' && ( 
        <div>
          <div className="form-group">
        <label className="form-label">Date start plan</label>
        <input
          type="date"
          name="date"
          onChange={(e) => setDate(prev=>[e.target.value,...prev])}
          className="form-input"
        />
      </div>
        <div className="form-group">
        <label className="form-label">Date end plan</label>
        <input
          type="date"
          name="date"
          onChange={(e) => setDate(prev=>[...prev,e.target.value])}
          className="form-input"
        />
      </div>
      </div>
      )}
      <div>
        <label htmlFor="">add category plan </label>
        <button 
        onClick={addCateghoryButton} 
        className="btn-secondary"
      >
        + Add Category
      </button>
      <button 
        onClick={addTargetButton} 
        className="btn-secondary ml-2"
      >
        + Add Target
      </button>
      {activecateghoryForm && (
        
        <div className='flex justify-between gap-20'>
          <div className='w-1/2'>
          <label htmlFor="">cathegorys</label>
          <div className='flex flex-col border-1 border-gray-400 h-[90%] rounded-lg bg-[#444459]'>
          {categorys.map((category) => (
            <div key={category.id} className="flex items-center justify-between px-4 py-2 border-b border-gray-400">
              <span className="text-white">{category.category}</span>
              <span className='text-white'>{`${category.amount}$`}</span>
              <button className="text-red-500" onClick={(e) => removeCategory(e,category.id)}>X</button>
            </div>
          ))}
          </div>
          </div>
          <div className='w-1/2'>
        <div className="form-group">
        <label className="form-label">Category</label>
        <select 
          className="form-input w-full"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
          <option value="another">Another</option>

        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label">Amount</label>
        <input
          type="number"
          name="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="form-input"
          placeholder="Enter amount"
        />
      </div>
      <div className="form-group mt-[20px] !mb-[0px] justify-end flex w-[100%]">
        <button className='btn-primary hover:!bg-[blue]' onClick={addCategory}>
        add
        </button>
      </div>
      
      </div>
        </div>
      )

      }
      {
        activeTargetForm && (
          <div className='flex justify-between gap-20'>
            <div className='w-1/2'>
              <label htmlFor="">Цели</label>
              <div className='flex flex-col border-1 border-gray-400 h-[90%] rounded-lg bg-[#444459]'>
                {targets.map((target) => (
                  <div key={target.id} className="flex items-center justify-between px-4 py-2 border-b border-gray-400">
                    <span className="text-white">{target.target}</span>
                    <span className='text-white'>{`${target.amount}$`}</span>
                    <button className="text-red-500" onClick={(e) => removeTarget(e, target.id)}>X</button>
                  </div>
                ))}
              </div>
            </div>
            <div className='w-1/2'>
              <div className="form-group">
                <label className="form-label">Цель</label>
                <input
                  type="text"
                  name="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="form-input"
                  placeholder="Введите цель"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Сумма</label>
                <input
                  type="number"
                  name="targetAmount"
                  defaultValue={targetAmount}
                  onChange={(e) => setTargetAmount(Number(e.target.value))}
                  className="form-input"
                  placeholder="Введите сумму"
                />
              </div>
              <div className="form-group mt-[20px] !mb-[0px] justify-end flex w-[100%]">
                <button className='btn-primary hover:!bg-[blue]' onClick={addTarget}>
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )
      }
      </div>
     


      <div className="form-group">
        <label className="form-label">Notes</label>
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="form-input"
          rows={3}
          placeholder="Additional information"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button 
          type="button" 
          className="btn-cancel"
          onClick={() => setActiveForm(false)}
        >
          Cancel
        </button>
        {
          loadingSending ?(

          
          <button className='btn-primary' type='button'>loading...</button> 
          )
          :(

          
          <button 
          type="submit" 
          className="btn-primary"
          onClick={submitPlan}
        >
          Save Plan
        </button>
          )
        }

      </div>
    </form>
  </div>
)}

        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'global' && <GlobalsAnalytics gainTrans={gainTrans} lossTrans={lossTrans} trans={trans} />}
          {activeTab === 'month' && <MonthAnalitycs gainTrans={gainTrans} lossTrans={lossTrans} trans={trans} />}
          {activeTab === 'year' && <YearAnalitycs gainTrans={gainTrans} lossTrans={lossTrans} trans={trans} />}
          {activeTab === 'custom' && <CustomAnalitycs gainTrans={gainTrans} lossTrans={lossTrans} trans={trans} />}
          {activeTab === 'lasts' && <LastsAnalitycs gainTrans={gainTrans} lossTrans={lossTrans} trans={trans} lastsPlan={lastsPlan} />}
        </div>
      </div>

      <style jsx>{`
          .bg-opacity-50 {
            background-color: rgba(0, 0, 0, 0.5);
          }
        .btn-primary {
          background: #4f46e5;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-primary:hover {
          background: #4338ca;
        }
        .btn-secondary {
          background: #374151;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .btn-secondary:hover {
          background: #4b5563;
        }
        .btn-cancel {
          background: #6b7280;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
        }
        .btn-cancel:hover {
          background: #4b5563;
        }
        .tab-btn {
          color: #d1d5db;
          font-weight: 600;
          padding: 0.5rem 1rem;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: white;
          opacity: 0.9;
        }
        .tab-btn.active {
          color: white;
          border-bottom: 2px solid #4f46e5;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          color: #e5e7eb;
          font-size: 0.875rem;
        }
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 0.375rem;
          color: white;
        }
        .form-input:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.3);
        }
      `}</style>
    </div>
  );
}
