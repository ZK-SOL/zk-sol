"use client";

import React, { useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Link,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Avatar,
  Badge,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";
import dynamic from 'next/dynamic';
import ClientOnly from './ClientOnly';

// import {AcmeIcon} from "./acme";


import { AcmeIcon } from "./logo";
import WalletContext from "@/context/wallet-context";
import { ThemeSwitch } from "./theme-switch";

// Optionally, you can also dynamically import the WalletMultiButton
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

export default function Component() {
  const pathname = usePathname();
  const navItems = [
    {
    label: "App",
    href: "/",
  },
  {
    label: "Private MEV",
    href: "/private-mev",
  },


  ]


  return (
    <>
  
        <Navbar
          isBordered
          style={{ width: '100vw', maxWidth: '100vw' }}
          className="w-screen max-w-[100vw]"
          classNames={{
            base: "w-screen",
            item: "data-[active=true]:text-primary",
            wrapper: "w-screen max-w-[90vw]",
          }}
          height="60px"

        >
          <NavbarMenuToggle className="text-default-400 md:hidden" />

          <NavbarBrand>
            <div className="rounded-full bg-foreground text-background">
              <AcmeIcon size={34} />
            </div>
            <span className="ml-2 font-medium">Zask</span>
          </NavbarBrand>
          {/* <NavbarContent
            className="hidden h-11 gap-4 rounded-full border-small border-default-200/20 bg-background/60 px-4 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50 md:flex"
            justify="center"
          >

            {navItems.map((item, index) => (
              <NavbarItem key={item.label} isActive={pathname === item.href}>
                <Link
                  isDisabled={item.href === '/private-mev'}
                  className={`flex gap-2 ${pathname === item.href ? 'text-primary' : 'text-inherit'}`}
                  href={item.href}
                >
                  {item.label}
                  {item.href === '/private-mev' && <Chip color="primary" variant="flat">Soon</Chip>}

                </Link>
              </NavbarItem>
            ))}

          </NavbarContent> */}
          <NavbarContent justify="end">
            <NavbarItem className="ml-2 !flex gap-2">
              <ThemeSwitch />
            </NavbarItem>
            <NavbarItem className="ml-2 !flex gap-2"> 
              <ClientOnly>
                <WalletMultiButton/>
              </ClientOnly>
            </NavbarItem>
          </NavbarContent>
          <NavbarMenu
            className="top-[calc(var(--navbar-height)_-_1px)] max-h-[70vh] bg-default-200/50 pt-6 shadow-medium backdrop-blur-md backdrop-saturate-150 dark:bg-default-100/50"
            motionProps={{
              initial: { opacity: 0, y: -20 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -20 },
              transition: {
                ease: "easeInOut",
                duration: 0.2,
              },
            }}
          >
            {navItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link className="w-full text-default-500" href={item.href} size="md">
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </NavbarMenu>
        </Navbar>

    </>
  );
}
