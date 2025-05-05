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
        <head >
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Edu+VIC+WA+NT+Beginner:wght@400..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Cal+Sans&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          className={clsx(
            "min-h-screen h-full bg-background font-sans antialiased overflow-x-hidden",
            "bg-[radial-gradient(ellipse_50%_60%_at_50%_20%,#ffffff_60%,#eaf6fb_85%,#e4e8f0_500%)] dark:bg-[radial-gradient(ellipse_50%_60%_at_50%_20%,#000000_60%,#000000_85%,#000000_500%)]",
            fontSans.variable,
          )}
        >
        
            <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
              <div className="relative flex flex-col h-full w-full">
                <div className="w-full">
                  <Navbar2 />
                </div>
                <main className="w-full flex-grow min-h-full">
                  {children}
                </main>
           
              </div>
            </Providers>
        </body>
      </html >
          </WalletContext>
   
  );
}