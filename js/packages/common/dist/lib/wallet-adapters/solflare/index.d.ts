/// <reference types="node" />
import EventEmitter from 'eventemitter3';
import { PublicKey, Transaction } from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-base';
interface SolflareWalletEvents {
    connect: (...args: unknown[]) => unknown;
    disconnect: (...args: unknown[]) => unknown;
}
interface SolflareWallet extends EventEmitter<SolflareWalletEvents> {
    isSolflare?: boolean;
    publicKey?: {
        toBuffer(): Buffer;
    };
    isConnected: boolean;
    autoApprove: boolean;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
    connect: () => Promise<boolean>;
    disconnect: () => Promise<boolean>;
}
export declare class SolflareWalletAdapter extends EventEmitter implements WalletAdapter {
    _wallet: SolflareWallet | undefined;
    _publicKey: PublicKey | undefined;
    constructor();
    get connected(): boolean;
    get autoApprove(): boolean;
    signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    get publicKey(): PublicKey | null;
    signTransaction(transaction: Transaction): Promise<Transaction>;
    connect: () => Promise<void>;
    disconnect(): void;
}
export {};
//# sourceMappingURL=index.d.ts.map