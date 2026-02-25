'use client'
import {usePathname, useRouter} from '@/i18n/navigation'
import { useLocale } from 'next-intl'

import { useState } from 'react'

type SettingsModalProps = {
  username: string
  language: string
  banks: { name: string; balance: number; currency: string }[]
  onClose: () => void
}

export default function SettingsAccountModal({
  username,
  language,
  banks,
  onClose
}: SettingsModalProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const switchLocale = (newLocale: string) => {
    console.log(newLocale)
      if(newLocale !== locale){
        router.replace(pathname, {locale: newLocale});
        router.refresh();
      }
  }
  const [activeTab, setActiveTab] = useState<'user' | 'language' | 'stats'>('user')
  console.log(locale)
  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl bg-gradient-to-br from-[#1e1e2f] to-[#232336] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white tracking-wide">
            Account Settings
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

        <div className="flex">

          <div className="w-1/4 border-r border-gray-700 bg-black/20">
            <nav className="flex flex-col p-4 space-y-2">
              <button
                onClick={() => setActiveTab('user')}
                className={`px-3 py-2 rounded-lg text-left text-sm transition ${
                  activeTab === 'user'
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                User
              </button>

              <button
                onClick={() => setActiveTab('language')}
                className={`px-3 py-2 rounded-lg text-left text-sm transition ${
                  activeTab === 'language'
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Language
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-2 rounded-lg text-left text-sm transition ${
                  activeTab === 'stats'
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>

          <div className="flex-1 p-6 max-h-[70vh] overflow-y-auto">

            {activeTab === 'user' && (
              <div className="space-y-6">
                <h3 className="text-base font-semibold text-white">User Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Username</label>
                    <input
                      defaultValue={username}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                    />
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="space-y-6">
                <h3 className="text-base font-semibold text-white">Language Settings</h3>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Select Language</label>
                  <select
                    value={locale}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                    onChange={(e)=>switchLocale(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="ru">Russian</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-base font-semibold text-white">Account Statistics</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 border border-gray-700 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Total Banks</p>
                    <p className="text-xl font-bold text-white">{banks.length}</p>
                  </div>

                  <div className="bg-black/30 border border-gray-700 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">Total Balance</p>
                    <p className="text-xl font-bold text-green-400">
                      {banks
                        .reduce((acc, bank) => acc + bank.balance, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {banks.map((bank, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-black/30 border border-gray-700 rounded-xl px-4 py-3"
                    >
                      <p className="text-sm text-white">{bank.name}</p>
                      <p className="text-xs text-gray-400">
                        {bank.balance.toFixed(2)} {bank.currency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  )
}