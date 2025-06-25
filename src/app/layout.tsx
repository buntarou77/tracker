import { Inter, Roboto_Mono } from "next/font/google";
import './globals.css'
import Header from './components/Header';
import { AppProvider } from './context/BalanceContext';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className=" ">
        <AppProvider>
          <Header />
          <div>{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}