"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolflareWalletAdapter = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const web3_js_1 = require("@solana/web3.js");
const notifications_1 = require("../../utils/notifications");
class SolflareWalletAdapter extends eventemitter3_1.default {
    constructor() {
        super();
        this.connect = async () => {
            var _a;
            if (this._wallet) {
                return;
            }
            let wallet;
            if ((_a = window.solflare) === null || _a === void 0 ? void 0 : _a.isSolflare) {
                wallet = window.solflare;
            }
            else {
                window.open('https://solflare.com', '_blank');
                notifications_1.notify({
                    message: 'Solflare Error',
                    description: 'Please install Solflare wallet',
                });
                return;
            }
            wallet.on('connect', () => {
                this._wallet = wallet;
                this.emit('connect');
            });
            if (!wallet.isConnected) {
                await wallet.connect();
            }
            this._wallet = wallet;
            this.emit('connect');
        };
        this.connect = this.connect.bind(this);
    }
    get connected() {
        var _a;
        return !!((_a = this._wallet) === null || _a === void 0 ? void 0 : _a.isConnected);
    }
    get autoApprove() {
        var _a;
        return !!((_a = this._wallet) === null || _a === void 0 ? void 0 : _a.autoApprove);
    }
    async signAllTransactions(transactions) {
        if (!this._wallet) {
            return transactions;
        }
        return this._wallet.signAllTransactions(transactions);
    }
    get publicKey() {
        var _a;
        if (!this._publicKey && ((_a = this._wallet) === null || _a === void 0 ? void 0 : _a.publicKey))
            this._publicKey = new web3_js_1.PublicKey(this._wallet.publicKey.toBuffer());
        return this._publicKey || null;
    }
    async signTransaction(transaction) {
        if (!this._wallet) {
            return transaction;
        }
        return this._wallet.signTransaction(transaction);
    }
    disconnect() {
        if (this._wallet) {
            this._wallet.disconnect();
            this._wallet = undefined;
            this.emit('disconnect');
        }
    }
}
exports.SolflareWalletAdapter = SolflareWalletAdapter;
//# sourceMappingURL=index.js.map