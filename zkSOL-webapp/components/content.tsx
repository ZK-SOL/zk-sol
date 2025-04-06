'use client';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React from 'react';
import {Tabs, Tab} from "@heroui/tabs";
import TabsWrapper from './action-box/tabs-wrapper';
interface contentProps {
  title: string;
  description?: string;
}

const Content: React.FC<contentProps> = ({ title, description }) => {
  return (
    <div className="">
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>
     <TabsWrapper />
    </div>
  );
};

export default Content;