import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";

import Navbar2 from "@/components/navbar2";
import WalletContext from "@/context/wallet-context";
export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletContext>
      <html suppressHydrationWarning lang="en">
        <head />
        <body
          className={clsx(
            "min-h-screen bg-background font-sans antialiased overflow-x-hidden",
            fontSans.variable,
          )}
        >
        
            <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
              <div className="relative flex flex-col h-screen w-full">
                <div className="w-full">
                  <Navbar2 />
                </div>
                <main className="w-full flex-grow">
                  {children}
                </main>
           
              </div>
            </Providers>
        </body>
      </html >
          </WalletContext>
   
  );
}