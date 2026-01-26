export interface TransactionDocument {
  _id: string;
  id: number;
  userId: string;
  bankId: string;
  amount: number;
  category: string;
  date: Date;
  createdAt: Date;
  type: 'gain' | 'loss';
  balanceStatus: number;
}

export type TransactionType = Omit<TransactionDocument, '_id'> & { id: number };