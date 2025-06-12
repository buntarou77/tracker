import { Inter, Roboto_Mono } from "next/font/google";
import Link from "next/link";
import '../globals.css'
import BankAccount from './BankAccount';
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export default function Layout({ children }: { children: React.ReactNode }) {
  
  return (
      <div className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <div className="header bg-dark relative flex items-center">
          <div className="w-full flex justify-center p-5">
            <nav>
              <ul className="nav_list flex gap-[30px] list-none text-none ">
                <Link className="[all:unset] !cursor-pointer" href='/'><li>Home</li></Link>
                <Link className="[all:unset] !cursor-pointer" href='/operations'><li>Operations</li></Link>
                <Link className="[all:unset] !cursor-pointer" href='/analytics'><li>analytics</li></Link>
                <Link className="[all:unset] !cursor-pointer" href='/budget'><li>budget</li></Link>
                <Link className="[all:unset] !cursor-pointer" href='/convert'><li>convert</li></Link>
                <Link className="[all:unset] !cursor-pointer" href='/about'><li>About</li></Link>
              </ul>
            </nav>
          </div>
          <BankAccount />
        </div>
        {children}
      </div>
    
  );
}