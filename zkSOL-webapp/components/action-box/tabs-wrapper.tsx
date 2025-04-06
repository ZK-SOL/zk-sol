"use client";
import BN from "bn.js";
import React from "react";
import { Tabs, Tab } from "@heroui/tabs";
import Send from "./send";
import Deposit from "./deposit";

BN.prototype.toBuffer = function toBuffer(endian, length) {
  return this.toArrayLike(Buffer, endian, length);
};

const TabsWrapper: React.FC = () => {
  return (
    <div className="w-full flex justify-center mt-4 items-center ">
      <Tabs aria-label="Transaction Options" isVertical={false}>
        <Tab key="deposit" title="Deposit">
          <Deposit />
        </Tab>
        <Tab key="send" title="Send">
          <Send />
        </Tab>
      </Tabs>
    </div>
  );
};

export default TabsWrapper;
