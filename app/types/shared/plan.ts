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

export interface CreatePlanType {
  frequency: frequencyType
  userId: string
  currnecy: string
  name: string
  type: 'expense' | 'income'
  amount: number
  categorys: categoryItem[]
  targets: targetItem[]
  color: string 
}


export type getPlanType = Omit<PlanDocumentType, '_id'> & { id: string; }
export type frequencyType = "daily" | "monthly" | "yearly" | "weekly" | "one-time"