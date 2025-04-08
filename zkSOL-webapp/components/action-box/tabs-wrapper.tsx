"use client";
import BN from "bn.js";
import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import Send from "./send";
import Deposit from "./deposit";
import { DepositStateType } from "@/types/deposit";

BN.prototype.toBuffer = function toBuffer(endian, length) {
  return this.toArrayLike(Buffer, endian, length);
};

const TabsWrapper: React.FC = () => {
  // State to preserve deposit form data without default values
  const [depositState, setDepositState] = useState<DepositStateType>({});

  return (
    <div className="w-full flex justify-center mt-4 items-center ">
      <Tabs aria-label="Transaction Options" isVertical={false}>
        <Tab key="deposit" title="Deposit">
          <Deposit 
            depositState={depositState}
            setDepositState={setDepositState}
          />
        </Tab>
        <Tab key="send" title="Send">
          <Send />
        </Tab>
      </Tabs>
    </div>
  );
};

export default TabsWrapper;
