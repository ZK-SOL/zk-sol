import './global.css'
import './styles/app.css'
import {useMemo} from 'react'
import '@solana/wallet-adapter-react-ui/styles.css'
import {ConnectionProvider, WalletProvider} from '@solana/wallet-adapter-react'
import {BrowserRouter, Route, Routes} from 'react-router'
import Home from './pages/home.tsx'
import {WalletModalProvider} from '@solana/wallet-adapter-react-ui'
import {network, rpc} from './constants.ts'
import {MessageProvider} from './context/messageContext.tsx'

const App = () => {
    const endpoint = useMemo(() => rpc, [network])
    const wallets = useMemo(
        () => [],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    )

    return (
        <>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <MessageProvider>
                        <WalletModalProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route path="/" element={<Home/>}/>
                                </Routes>
                            </BrowserRouter>
                        </WalletModalProvider>
                    </MessageProvider>
                </WalletProvider>
            </ConnectionProvider>
        </>
    )
}
export default App

