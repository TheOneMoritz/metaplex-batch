import { WalletAdapter } from '@solana/wallet-base';
import { PhantomWalletAdapter } from '../wallet-adapters/phantom';
import { TorusWalletAdapter } from '../wallet-adapters/torus';
import { SolflareWalletAdapter } from '../wallet-adapters/solflare';
export declare const WALLET_PROVIDERS: ({
    name: string;
    url: string;
    icon: string;
    adapter: typeof PhantomWalletAdapter;
} | {
    name: string;
    url: string;
    icon: string;
    adapter: typeof SolflareWalletAdapter;
} | {
    name: string;
    url: string;
    icon: string;
    adapter?: undefined;
} | {
    name: string;
    url: string;
    icon: string;
    adapter: typeof TorusWalletAdapter;
})[];
export declare function WalletProvider({ children }: {
    children?: any;
}): JSX.Element;
export declare const useWallet: () => {
    wallet: WalletAdapter | undefined;
    connected: boolean;
    provider: {
        name: string;
        url: string;
        icon: string;
        adapter: typeof PhantomWalletAdapter;
    } | {
        name: string;
        url: string;
        icon: string;
        adapter: typeof SolflareWalletAdapter;
    } | {
        name: string;
        url: string;
        icon: string;
        adapter?: undefined;
    } | {
        name: string;
        url: string;
        icon: string;
        adapter: typeof TorusWalletAdapter;
    } | undefined;
    select: () => void;
    connect(): void;
    disconnect(): void;
};
//# sourceMappingURL=wallet.d.ts.map