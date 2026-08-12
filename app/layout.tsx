import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const lora = Lora({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PaperTrail",

};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${lora.variable}`}>{children}</body></html>;
}
