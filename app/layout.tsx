import { Inter, Roboto_Mono } from "next/font/google";
import './globals.css'
import { ReactNode } from "react";
import Header from './components/Header';
import { ContextProviders } from './context/ContextProviders';
import {NextIntlClientProvider} from 'next-intl';
import { getMessages } from "next-intl/server";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Financial Tracker",
  description: "Track your expenses",
};

type Props = {
  children: ReactNode,
  params: {locale: string}
}

export default async function RootLayout({children, params: {locale}}: Props){
  const messages = await getMessages(locale);
  return (
    <html lang={locale} className={`${inter.variable} ${robotoMono.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
        <ContextProviders>
        <Header />
        <div>{children}</div>
        </ContextProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}