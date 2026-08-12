import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const lora = Lora({ variable: "--font-serif", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "Marginalia — Literature Reading Tracker",
    description: "A calm home for papers, reading progress, and research notes.",
    openGraph: { title: "Marginalia", description: "Your literature reading desk", images: [{ url: image, width: 1536, height: 805 }] },
    twitter: { card: "summary_large_image", title: "Marginalia", description: "Your literature reading desk", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${dmSans.variable} ${lora.variable}`}>{children}</body></html>;
}
