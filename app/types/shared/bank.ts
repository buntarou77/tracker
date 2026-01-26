export interface BankAccountDocument {
  _id: string;
  id: string;
  userId: string;
  name: string;
  notes: string;
  currency: string;
  balance: number;
  createdAt: Date;
}

export type BankAccountType = Omit<BankAccountDocument, '_id'> & { id: string };