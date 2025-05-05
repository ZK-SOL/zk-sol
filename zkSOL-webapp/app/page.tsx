import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import WalletContext from "@/context/wallet-context";

import Faq from "@/components/faq";
import TabsWrapper from "@/components/action-box/tabs-wrapper";
import Roadmap from "@/components/roadmap";

import BN from "bn.js";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import ScrollToRoadmapCode from "@/components/ScrollToRoadmapCode";

BN.prototype.toBuffer = function toBuffer(endian, length) {
  return this.toArrayLike(Buffer, endian, length);
};

export default function Home() {
  // Smooth scroll to roadmap
  const handleScrollToRoadmap = () => {
    const el = document.getElementById('roadmap');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <div className="overflow-x-hidden">
      <section className="section-gradient pt-16 pb-8 min-h-screen relative">
        {/* Background Visuals - ensure they cover the full section */}
        <div className="absolute inset-0 -z-10 h-full w-full"></div>
        <div className="w-full max-w-[90vw] mx-auto flex flex-col md:flex-row items-stretch justify-between gap-8 relative z-10">
          {/* Left: Text Content with Full Height Background Visuals */}
          <div className="flex-1 max-w-xl text-left space-y-4 relative flex flex-col justify-center min-h-[420px]">
            <span className=" bg-gradient-to-r from-[#48def0] to-[#2CAFBF] text-white w-fit text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">Privacy first <Icon icon="mdi:shield-check" className="ml-1" /></span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Store, and Send with <span className={`${title({ color: "teal" })}`}>Confident</span>
            </h1>
            <p className="text-lg text-gray-700">
              ZASK is confidential transfer protocol that utilizes zk-proof and merkle-tree to efficiently store and transfer SOL between users.
            </p>
            <ScrollToRoadmapCode />
          </div>
          {/* Right: Tabs with Feature Bubbles */}
          <div className="flex-1 flex items-center justify-center relative min-h-[420px] z-10">
   
            {/* Tabs */}
            <TabsWrapper />
          </div>
        </div>
      </section>
      <section className="section-gradient">
        <div id="roadmap" className="w-full max-w-[90vw] mx-auto overflow-hidden relative z-10">
          <Roadmap />
        </div>
        <div className="bg-gradient-pattern"></div>
        <div className="bg-gradient-pattern-left"></div>
      </section>
      <section className="section-gradient">
        <div className="w-full max-w-[90vw] mx-auto overflow-hidden relative z-10">
          <Faq />
        </div>
        <div className="bg-gradient-pattern"></div>
        <div className="bg-gradient-pattern-left"></div>
      </section>
    </div>
  );
}
