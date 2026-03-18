import { getCurrencySymbol } from '@/app/lib/symbols';
import { useBankTransaction } from '@/app/context/BankTransactionContext';
import type { currencyType } from '@/app/types/shared/currencyType';
import { useTranslations } from 'next-intl';
interface transactionModalProps {
  onClose: () => void;
  modalTitle: string;
  transactions: any[];
}

export default function TransactionModal(payload: transactionModalProps){
  console.log(payload)
  const t = useTranslations('lastsAnalytics');
  const { modalTitle, transactions, onClose }: transactionModalProps = payload;
  const { activeBank,  banks} = useBankTransaction();
  const currencySymbol = getCurrencySymbol(banks.find((bank)=> bank.id === activeBank.id).currency as currencyType);
  const displayCurrency = currencySymbol;

  return( 
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">{modalTitle}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {transactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">

              {transactions.map((transaction, index) => (
                <div
                  key={index}
                  className="group bg-gray-900/60 backdrop-blur rounded-xl p-4 border border-gray-700/50 hover:border-gray-500 hover:bg-gray-900/80 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">

                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg
                        ${
                          transaction.type === 'gain'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {transaction.type === 'gain' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                          </svg>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-gray-300 text-sm font-medium capitalize">
                          {transaction.category}
                        </span>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{transaction.date}</span>
                          <span>•</span>
                          <span className="uppercase tracking-wide">
                            {transaction.type}
                          </span>
                        </div>
                      </div>

                    </div>

                    <span
                      className={`text-lg font-semibold tracking-wide
                        ${
                          transaction.type === 'gain'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                    >
                      {transaction.type === 'gain' ? '+' : '-'}
                      {displayCurrency}
                      {transaction.amount}
                    </span>

                  </div>
                </div>
              ))}

            </div>
          ) : (

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-800/60 border border-gray-700 mb-4">
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>

              <p className="text-gray-400 text-sm font-medium">
                {t('modal.noTransactions')}
              </p>

              <p className="text-gray-500 text-xs mt-1">
                {t('modal.addTransactionsHint')}
              </p>

            </div>
          )}
        </div>
      </div>
    </div>
  )
};