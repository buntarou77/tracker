import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
export const dynamic = 'force-static';

export default function Home({
  params
}: {
  params: Promise<{locale: string}>
}) {
  setRequestLocale(params.locale)
  const t = useTranslations('home');
  const appName = 'Financial Tracker';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          {t('title', { appName })}
        </h1>
        <p className="text-gray-400 mb-8">
          {t('subtitle')}
        </p>
        <div className="space-x-4">
          <a 
            href="/register" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>{t('createAccount')}</span>
          </a>
          <a 
            href="/about" 
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {t('learnMore')}
          </a>
        </div>
        <div className="mt-6">
          <p className="text-gray-500 text-sm mb-3">
            {t('newHere', { appName })}
          </p>
          <a 
            href={`${params.locale}/login`} 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{t('signUpNow')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
