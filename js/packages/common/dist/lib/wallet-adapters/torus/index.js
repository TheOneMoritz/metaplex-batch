"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TorusWalletAdapter = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const web3_js_1 = require("@solana/web3.js");
const openlogin_1 = __importDefault(require("@toruslabs/openlogin"));
const openlogin_ed25519_1 = require("@toruslabs/openlogin-ed25519");
const getSolanaPrivateKey = (openloginKey) => {
    const { sk } = openlogin_ed25519_1.getED25519Key(openloginKey);
    return sk;
};
class TorusWalletAdapter extends eventemitter3_1.default {
    constructor(providerUrl, endpoint) {
        super();
        this.image = '';
        this.name = '';
        this.connect = async () => {
            var _a, _b, _c, _d;
            this._provider = new openlogin_1.default({
                clientId: process.env.NEXT_PUBLIC_CLIENT_ID || 'BKBTX-SmaEFGddZQrwqd65YFoImRQLca_Tj2IdmKyD2UbDpzrtN2WQ-NYLuej6gP0DfF3jSpEkI13wPt1uPedm0',
                network: "mainnet",
                uxMode: 'popup'
            });
            try {
                await this._provider.init();
            }
            catch (ex) {
                console.error('init failed', ex);
            }
            console.error((_a = this._provider) === null || _a === void 0 ? void 0 : _a.state.store);
            if (this._provider.privKey) {
                const privateKey = this._provider.privKey;
                console.log(privateKey);
                const secretKey = getSolanaPrivateKey(privateKey);
                console.log(secretKey);
                this.account = web3_js_1.Keypair.fromSecretKey(secretKey);
            }
            else {
                try {
                    const { privKey } = await this._provider.login();
                    console.log(privKey);
                    const secretKey = getSolanaPrivateKey(privKey);
                    console.log(secretKey);
                    this.account = web3_js_1.Keypair.fromSecretKey(secretKey);
                }
                catch (ex) {
                    console.error('login failed', ex);
                }
            }
            console.log((_b = this.account) === null || _b === void 0 ? void 0 : _b.publicKey.toBase58());
            this.name = (_c = this._provider) === null || _c === void 0 ? void 0 : _c.state.store.get('name');
            ;
            this.image = (_d = this._provider) === null || _d === void 0 ? void 0 : _d.state.store.get('profileImage');
            ;
            this.emit("connect");
        };
        this.disconnect = async () => {
            console.log("Disconnecting...");
            if (this._provider) {
                await this._provider.logout();
                await this._provider._cleanup();
                this._provider = undefined;
                this.emit("disconnect");
            }
        };
        this.connect = this.connect.bind(this);
        this.endpoint = endpoint;
        this.providerUrl = providerUrl;
    }
    async signAllTransactions(transactions) {
        if (this.account) {
            let account = this.account;
            transactions.forEach(t => t.partialSign(account));
        }
        return transactions;
    }
    get publicKey() {
        var _a;
        return ((_a = this.account) === null || _a === void 0 ? void 0 : _a.publicKey) || null;
    }
    async signTransaction(transaction) {
        if (this.account) {
            transaction.partialSign(this.account);
        }
        return transaction;
    }
}
exports.TorusWalletAdapter = TorusWalletAdapter;
//# sourceMappingURL=index.js.map