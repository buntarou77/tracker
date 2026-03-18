'use client'

type BankInfoModalPayloadProp = {
  name: string
  currency: string
  balance: number
  notes?: string
  createdAt?: string
  onClose: () => void
}

export default function EditBankModal({
  name,
  currency,
  balance,
  notes,
  createdAt,
  onClose
}: BankInfoModalPayloadProp) {
  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#1e1e2f] to-[#232336] rounded-2xl shadow-2xl border border-gray-700 animate-fade-in">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white tracking-wide">
            Bank Account Details
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-all duration-200"
          >
            <svg
              className="w-5 h-5 text-gray-400 hover:text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Account Name
            </p>
            <p className="text-lg font-semibold text-white">
              {name}
            </p>
          </div>

          <div className="flex items-center justify-between bg-black/30 p-4 rounded-xl border border-gray-700">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Current Balance
              </p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {balance.toFixed(2)} {currency}
              </p>
            </div>

            <div className={`w-3 h-3 rounded-full ${balance >= 0 ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Notes
            </p>
            <div className="bg-black/30 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 leading-relaxed min-h-[70px]">
              {notes || 'No notes added for this account.'}
            </div>
          </div>

          {createdAt && (
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
              <span>Created</span>
              <span>{createdAt}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200"
          >
            Close
          </button>

          <button
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all duration-200"
          >
            Edit Account
          </button>
        </div>

      </div>
    </div>
  )
}