"use client";
import BN from "bn.js";
import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import Send from "./send";
import Deposit from "./deposit";
import { DepositStateType } from "@/types/deposit";
import { Card } from "@heroui/card";
import { Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

BN.prototype.toBuffer = function toBuffer(endian, length) {
  return this.toArrayLike(Buffer, endian, length);
};

const TabsWrapper: React.FC = () => {
  // State to preserve deposit form data without default values
  const [depositState, setDepositState] = useState<DepositStateType>({});

  return (
    <Card
      className="w-full relative flex justify-start  items-center border shadow-none p-4 w-[500px]"
      style={{
        backgroundImage: "radial-gradient(circle at 0.5px 0.5px, var(--primary-color) 0.5px, transparent 0.5px)",
        backgroundSize: "10px 10px",
      }}
    >
      
      <Tabs variant="underlined" className="bg-white dark:bg-content1" color="primary" aria-label="Transaction Options" isVertical={false}>
        <Tab className="bg-white dark:bg-content1 " key="deposit" title="Deposit">
        
          <Deposit 
            
          />
         
        </Tab>
        <Tab className="bg-white dark:bg-content1" key="send" title="Send">
          <Send />
        </Tab>
     
      </Tabs>
    </Card>
  );
};

export default TabsWrapper;
