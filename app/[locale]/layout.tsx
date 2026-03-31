import { Inter, Roboto_Mono } from "next/font/google";
import './../globals.css'
import Header from '../components/Header';
import { ContextProviders } from '../context/ContextProviders'
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import { notFound } from "next/navigation";
import {routing} from '@/i18n/routing';
import ModalRoot from './../components/modalRoot'
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BroadcastProvider } from "../components/broadcastProvied";
export const metadata = {
  title: "Financial Tracker",
  description: "Track your expenses",
};

export function getStaticParams(){
  return routing.locales.map((locale)=> ({locale}))
}
export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
 
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <ContextProviders>
          <Header/>
          <ModalRoot/>
          <BroadcastProvider/>
          {children}
          </ContextProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}