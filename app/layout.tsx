import { Inter, Roboto_Mono } from "next/font/google";
import './globals.css'
import Header from './components/Header';
import { ContextProviders } from './context/ContextProviders';

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
        <ContextProviders>
        <Header />
        <div>{children}</div>
        </ContextProviders>
      </body>
    </html>
  );
}