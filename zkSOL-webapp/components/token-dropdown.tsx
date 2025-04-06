import React from 'react';
import { Button } from '@heroui/button';
import { Image } from "@heroui/image";
import { DropdownMenu, DropdownTrigger, DropdownItem } from '@heroui/react';
import { Dropdown } from '@heroui/react';

// Define token interface
export interface Token {
  chainId: number;
  address: string;
  mint?: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  tags?: string[];
  balance?: number;
  price?: number;
  value?: number;
}

// Chevron down icon component
export const ChevronDownIcon = () => {
  return (
    <svg fill="none" height="14" viewBox="0 0 24 24" width="14" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.9188 8.17969H11.6888H6.07877C5.11877 8.17969 4.63877 9.33969 5.31877 10.0197L10.4988 15.1997C11.3288 16.0297 12.6788 16.0297 13.5088 15.1997L15.4788 13.2297L18.6888 10.0197C19.3588 9.33969 18.8788 8.17969 17.9188 8.17969Z"
        fill="currentColor"
      />
    </svg>
  );
};

// Token dropdown component
interface TokenDropdownProps {
  tokens: Token[];
  selectedToken: Token | null;
  onTokenChange: (token: Token) => void;
}

const TokenDropdown: React.FC<TokenDropdownProps> = ({ tokens, selectedToken, onTokenChange }) => {
  return (
    <Dropdown className="relative">
      <DropdownTrigger>
        <Button className="w-fit bg-transparent border">
          <div className="flex items-center justify-between gap-3 min-w-[100px]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                {selectedToken?.logoURI ? (
                  <Image src={selectedToken.logoURI} alt={selectedToken.symbol} width={20} height={20} />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                )}
              </div>
              <span className="text-sm">{selectedToken?.symbol || 'Select Token'}</span>
            </div>
            <ChevronDownIcon />
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="token options"
        className="max-h-[300px] overflow-y-auto z-50"
        selectedKeys={selectedToken ? [selectedToken.symbol] : []}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const selected = tokens.find(token => token.address === Array.from(keys)[0]);

          if (selected) {
            console.log('Calling onTokenChange with:', selected);
            onTokenChange(selected);
          }
        }}
      >
        {tokens.map((token) => (
          <DropdownItem 
            className='w-[300px] h-[50px]' 
            key={`${token.address}`}
            textValue={`${token.symbol} - ${token.name}`}
          >
            <div className="w-full flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                {token.logoURI ? (
                  <Image src={token.logoURI} alt={token.symbol} width={20} height={20} />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                )}
              </div>
              <div className="flex justify-between w-full items-center">
                <div>
                  <div>{token.symbol}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[150px]">{token.address}</div>
                </div>
                <span className="text-xs text-gray-400">{token.balance?.toFixed(5)}</span>
              </div>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default TokenDropdown; 