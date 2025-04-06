export interface JupRoute{
    inputMint:            string;
    inAmount:             string;
    outputMint:           string;
    outAmount:            string;
    otherAmountThreshold: string;
    swapMode:             string;
    slippageBps:          number;
    platformFee:          null;
    priceImpactPct:       string;
    routePlan:            RoutePlan[];
    contextSlot:          number;
    timeTaken:            number;
}

export interface RoutePlan {
    swapInfo: SwapInfo;
    percent:  number;
}

export interface SwapInfo {
    ammKey:     string;
    label:      string;
    inputMint:  string;
    outputMint: string;
    inAmount:   string;
    outAmount:  string;
    feeAmount:  string;
    feeMint:    string;
}
