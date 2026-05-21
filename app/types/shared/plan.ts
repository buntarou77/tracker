export interface categoryItem {
  category: string
  amount: string
  id: string
}

export interface targetItem {
  target: string
  amount: number
  id: string
}

export interface PlanDocumentType {
  _id: string
  frequency: frequencyType
  userId: string
  name: string
  type: 'expense' | 'income'
  amount: number
  categorys: categoryItem[]
  targets: targetItem[]
  createdAt?: Date
  updatedAt?: Date
  color?: string
}

export type CreatePlanType = PlanOnce | PlanRecurring

export type PlanOnce = BasePlan & {
  frequency: 'once'
  date: dateType
}

export type PlanRecurring = BasePlan & {
  frequency: "daily" | "monthly" | "yearly" | "weekly" 
  date?: never
}

export interface BasePlan {
  userId: string
  currency: string
  name: string
  type: 'expense' | 'income'
  amount: number
  categorys: categoryItem[]
  targets: targetItem[]
  color: string 
}

export type dateType = {startDate: string, endDate: string}
export type getPlanType = Omit<PlanDocumentType, '_id'> & { id: string; }
export type frequencyType = "daily" | "monthly" | "yearly" | "weekly" | "once"