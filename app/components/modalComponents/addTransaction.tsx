'use client';

import { useRef, useState, FormEvent, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useBankTransaction } from '@/app/context/BankTransactionContext';

type TransactionType = 'loss' | 'gain';

interface AddTransactionModalProps {
    onClose: () => void;
}

export default function AddTransactionModal({
    onClose
}: AddTransactionModalProps) {
    const t = useTranslations('operations');

    const formRef = useRef<HTMLFormElement>(null);
    const { orchestator: addTransaction, activeBank } = useBankTransaction();
    const [transactionData, setTransactionData] = useState<Transaction>({
        amount: 0,
        category: 'food',
        type: 'loss',
        date: new Date().toISOString().split('T')[0]
    });

    const getCurrencySymbol = () => {
        return '€';
    };

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setTransactionData(prev => ({
            ...prev,
            [name]:
                name === 'amount'
                    ? Number(value)
                    : value
        }));
    };

    const handleTypeChange = (type: TransactionType) => {
        setTransactionData(prev => ({
            ...prev,
            type
        }));
    };

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        try {
            addTransaction(transactionData, activeBank.id);
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                        {t('formTitle')}
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
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

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('transactionType')}
                        </label>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleTypeChange('loss')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    transactionData.type === 'loss'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                💸 {t('expenseButton')}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleTypeChange('gain')}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    transactionData.type === 'gain'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                💰 {t('incomeButton')}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('amount')}
                        </label>

                        <div className="relative">
                            <input
                                type="number"
                                name="amount"
                                onChange={handleChange}
                                placeholder={t('amountPlaceholder')}
                                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                step="0.01"
                                min="0"
                            />

                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-400">
                                    {getCurrencySymbol()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('category')}
                        </label>

                        <select
                            name="category"
                            value={transactionData.category}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="housing">{t('categoryOptions.housing')}</option>
                            <option value="utilities">{t('categoryOptions.utilities')}</option>
                            <option value="food">{t('categoryOptions.food')}</option>
                            <option value="transport">{t('categoryOptions.transport')}</option>
                            <option value="health">{t('categoryOptions.health')}</option>
                            <option value="clothing">{t('categoryOptions.clothing')}</option>
                            <option value="personal_care">{t('categoryOptions.personal_care')}</option>
                            <option value="entertainment">{t('categoryOptions.entertainment')}</option>
                            <option value="travel">{t('categoryOptions.travel')}</option>
                            <option value="hobbies">{t('categoryOptions.hobbies')}</option>
                            <option value="communication">{t('categoryOptions.communication')}</option>
                            <option value="subscriptions">{t('categoryOptions.subscriptions')}</option>
                            <option value="savings">{t('categoryOptions.savings')}</option>
                            <option value="investments">{t('categoryOptions.investments')}</option>
                            <option value="insurance">{t('categoryOptions.insurance')}</option>
                            <option value="family">{t('categoryOptions.family')}</option>
                            <option value="gifts">{t('categoryOptions.gifts')}</option>
                            <option value="charity">{t('categoryOptions.charity')}</option>
                            <option value="education">{t('categoryOptions.education')}</option>
                            <option value="taxes">{t('categoryOptions.taxes')}</option>
                            <option value="other">{t('categoryOptions.other')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {t('date')}
                        </label>

                        <input
                            type="date"
                            name="date"
                            value={transactionData.date}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                        {t('submitButton')}
                    </button>
                </div>
            </form>
        </div>
    );
}