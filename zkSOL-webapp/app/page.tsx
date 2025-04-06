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

BN.prototype.toBuffer = function toBuffer(endian, length) {
  return this.toArrayLike(Buffer, endian, length);
};

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <section className="section-gradient">
        <div className="bg-gradient-pattern"></div>
        <div className="bg-gradient-pattern-left"></div>
        <div className="w-full max-w-[90vw] mx-auto overflow-hidden relative z-10">
          <div className="w-full text-center py-20 relative z-10">
            <span className={title()}>Own your&nbsp;</span>
            <span className={title({ color: "teal" })}>Privacy </span>
            <span className={title()}>back&nbsp;</span>
            <span className={title()}>send ANY token with&nbsp;</span>
            <span className={title({ color: "teal" })}>Zask</span>
            <br />
          </div>
          <div className="w-full z-10 flex items-center justify-center">
            <TabsWrapper />
          </div>
        </div>
      </section>
      <section className="section-gradient">
        <div className="w-full max-w-[90vw] mx-auto overflow-hidden relative z-10">
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
