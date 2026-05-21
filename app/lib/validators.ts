import { z } from 'zod';

export const registerSchema = z.object({
  user: z.string().min(3).max(15),
  password: z.string().min(8).max(32),
  email: z.string().email(),
});

export const resetEmailSchema = z.object({
  password: z.string().min(8).max(32),
  email: z.string().email(),
})

export const changeUsernameSchema = z.object({
  username: z.string().trim().min(3).max(20),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  resetCode: z.string().min(1),
  newPassword: z.string().min(8),
});

export const newBankAccountSchema = z.object({
  name: z.string().trim().min(3).max(30),
  notes: z.string().trim().max(300).optional(),
  balance: z.number().positive().max(1_000_000_000_000),
  currency: z.enum(['USD', 'EUR', 'RUB', 'GBP', 'CNY', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN', 'INR', 'BRL']),
});

export const deleteBankAccountQuerySchema = z.object({
  bankId: z.string().min(1),
  deleteData: z.string().optional().transform(val => val === 'true'),
});

export const getBankAccountQuerySchema = z.object({
  bankId: z.string().min(1),
});

export const getBankAccountsQuerySchema = z.object({
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  includeStats: z.string().optional().transform(val => val === 'true'),
  currency: z.string().optional(),
});

export const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['loss', 'gain']),
  bankId: z.string().min(1),
  category: z.string().min(1),
  date: z.string().refine(val => !isNaN(Date.parse(val))),
});

export const deleteTransactionSchema = z.object({
  transactionId: z.string().min(1),
  bankId: z.string().min(1),
  amount: z.number().optional(),
  balance: z.number().optional(),
  type: z.enum(['loss', 'gain']).optional(),
  includeUpdatedBank: z.boolean().optional(),
});

export const getTransactionsQuerySchema = z.object({
  bankId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 20)),
  to: z.string().optional(),
  from: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['gain', 'loss']).optional(),
}).refine(data => {
  if ((data.cursor && data.to) || (data.cursor && data.from)) return false;
  return true;
});

export const getTransactionsRangeQuerySchema = z.object({
  bankId: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  category: z.string().optional(),
  type: z.enum(['gain', 'loss']).optional(),
  pagination: z.string().optional().transform(val => val === 'true'),
});

const currencyEnum = z.enum(['USD', 'EUR', 'RUB', 'GBP', 'CNY', 'JPY', 'CHF', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN', 'INR', 'BRL']);



export const basePlanSchema = z.object({
  name: z.string().trim().min(3).max(40),
  amount: z.number().positive(),
  categorys: z.string().min(3).max(30),
  targets: z.string().min(3).max(30),
  color: z.string().min(3).max(20).optional().default('#000000'),
  type: z.enum(['expense', 'income']),
  currency: currencyEnum,
});

export const oncePlanSchema = basePlanSchema.extend({
  frequency: z.literal('one-time'),
  date: z.object({
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  }),
});

export const recurringPlanSchema = basePlanSchema.extend({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  date: z.never().optional(),
});

export const createPlanSchema = z.discriminatedUnion('frequency', [
  z.object({
    frequency: z.literal('one-time'),
    name: z.string().trim().min(3).max(40),
    amount: z.number().positive(),
    categorys: z.string().min(3).max(30),
    targets: z.string().min(3).max(30),
    color: z.string().min(3).max(20).optional().default('#000000'),
    type: z.enum(['expense', 'income']),
    currency: currencyEnum,
    date: z.object({
      startDate: z.string().min(1),
      endDate: z.string().min(1),
    }),
  }),
  z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    name: z.string().trim().min(3).max(40),
    amount: z.number().positive(),
    categorys: z.string().min(3).max(30),
    targets: z.string().min(3).max(30),
    color: z.string().min(3).max(20).optional().default('#000000'),
    type: z.enum(['expense', 'income']),
    currency: currencyEnum,
  }),
]);

export const patchPlanSchema = basePlanSchema.partial()
  .extend({
    planId: z.string().min(1),
  })
  .refine(data => {
    const { planId, ...rest } = data
    return Object.keys(rest).length > 0
  }, {
    message: 'At least one field must be provided for update'
  })

export const deletePlanSchema = z.object({
  planId: z.string().min(1),
  includeRemainingPlans: z.boolean().optional(),
});

export const updatePlanSchema = z.object({
  planId: z.string().min(1),
  name: z.string().trim().min(3).max(40).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(3).max(30).optional(),
  color: z.string().min(3).max(20).optional(),
});

export const getPlansQuerySchema = z.object({
  type: z.enum(['expense', 'income']).optional(),
  frequency: z.string().optional(),
  includeProgress: z.string().optional().transform(val => val === 'true'),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type patchPlanSchema = z.infer<typeof patchPlanSchema>;
export type resetEmailSchema = z.infer<typeof resetEmailSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type NewBankAccountInput = z.infer<typeof newBankAccountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type DeleteTransactionInput = z.infer<typeof deleteTransactionSchema>;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type DeletePlanInput = z.infer<typeof deletePlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;