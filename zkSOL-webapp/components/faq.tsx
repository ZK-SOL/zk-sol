"use client";

import React from "react";
import {Accordion, AccordionItem} from "@heroui/react";
import {Icon} from "@iconify/react";

const faqs = [  {
  title: "What is Zask?",
  content:
    "Zask is a cutting-edge privacy-preserving protocol built on Solana that enables users to send and receive tokens with complete anonymity. It combines zero-knowledge proofs with advanced cryptographic techniques to protect your financial privacy while maintaining full control of your assets.",
},
{
  title: "How does Zask work?",
  content:
    "Zask leverages Merkle trees and zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Argument of Knowledge) technology to store and verify transaction data without revealing sensitive information. This allows users to prove they own assets without exposing their identity or transaction history.",
},
{
  title: "How does Zask send transactions?",
  content:
    "When a user provides their secret key and transaction details, Zask generates a zero-knowledge proof that proves ownership without revealing the actual secret. This proof is then sent to a relayer network, which submits the transaction to the Solana blockchain on behalf of the user, maintaining complete privacy throughout the process.",
},
{
  title: "How is Zask secure?",
  content: "Zask's security is built on multiple layers: it uses Program Derived Addresses (PDAs) to store value, has no direct access to user funds, and cannot initiate transactions without user authorization. The protocol's architecture ensures that even if one component is compromised, your assets remain protected by the underlying cryptographic security.",
},
{
  title: "Why is Zask fast?",
  content: "Zask achieves high performance through its efficient Merkle tree implementation, which allows for quick verification of proofs. Additionally, the one-time use nature of the system prevents data conflicts and ensures transactions can be processed rapidly without the overhead of traditional privacy solutions.",
},
{
  title: "What tokens can I use with Zask?",
  content: "Zask supports a wide range of tokens on the Solana blockchain, including SOL and SPL tokens. The protocol is designed to be token-agnostic, allowing users to maintain privacy while interacting with any compatible token in the Solana ecosystem.",
}
];


export default function Component() {
  return (
    <section className="mx-auto w-full max-w-6xl py-20 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-12">
        <h2 className="px-2 text-3xl leading-7">
          <span className="inline-block lg:hidden">FAQs</span>
          <div className="hidden bg-gradient-to-br from-primary-800 to-primary-500 bg-clip-text pt-4 text-5xl font-semibold tracking-tight text-transparent dark:to-primary-200 lg:inline-block">
            Frequently
            <br />
            asked
            <br />
            questions
          </div>
        </h2>
        <Accordion
          fullWidth
          keepContentMounted
          className="gap-3"
          itemClasses={{
            base: "px-0 sm:px-6",
            title: "font-medium",
            trigger: "py-6 flex-row-reverse",
            content: "pt-0 pb-6 text-base text-default-500",
          }}
          items={faqs}
          selectionMode="multiple"
        >
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              indicator={<Icon icon="lucide:plus" width={24} />}
              title={item.title}
            >
              {item.content}
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
