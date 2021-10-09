"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWallet = exports.WalletProvider = exports.WALLET_PROVIDERS = void 0;
const sol_wallet_adapter_1 = __importDefault(require("@project-serum/sol-wallet-adapter"));
const antd_1 = require("antd");
const react_1 = __importStar(require("react"));
const notifications_1 = require("./../utils/notifications");
const connection_1 = require("./connection");
const utils_1 = require("../utils/utils");
const phantom_1 = require("../wallet-adapters/phantom");
const react_router_1 = require("react-router");
const MetaplexModal_1 = require("../components/MetaplexModal");
const torus_1 = require("../wallet-adapters/torus");
const solflare_1 = require("../wallet-adapters/solflare");
const ASSETS_URL = 'https://raw.githubusercontent.com/solana-labs/oyster/main/assets/wallets/';
exports.WALLET_PROVIDERS = [
    {
        name: 'Phantom',
        url: 'https://www.phantom.app',
        icon: `https://www.phantom.app/img/logo.png`,
        adapter: phantom_1.PhantomWalletAdapter,
    },
    {
        name: 'Solflare',
        url: 'https://solflare.com',
        icon: `${ASSETS_URL}solflare.svg`,
        adapter: solflare_1.SolflareWalletAdapter,
    },
    {
        name: 'Sollet',
        url: 'https://www.sollet.io',
        icon: `${ASSETS_URL}sollet.svg`,
    },
    {
        name: 'MathWallet',
        url: 'https://mathwallet.org',
        icon: `${ASSETS_URL}mathwallet.svg`,
    },
    {
        name: 'Torus',
        url: 'https://tor.us',
        icon: `${ASSETS_URL}torus.svg`,
        adapter: torus_1.TorusWalletAdapter,
    },
];
const WalletContext = react_1.default.createContext({
    wallet: undefined,
    connected: false,
    select() { },
    provider: undefined,
});
function WalletProvider({ children = null }) {
    const { endpoint } = connection_1.useConnectionConfig();
    const location = react_router_1.useLocation();
    const [autoConnect, setAutoConnect] = react_1.useState(location.pathname.indexOf('result=') >= 0 || false);
    const [providerUrl, setProviderUrl] = utils_1.useLocalStorageState('walletProvider');
    const provider = react_1.useMemo(() => exports.WALLET_PROVIDERS.find(({ url }) => url === providerUrl), [providerUrl]);
    const wallet = react_1.useMemo(function () {
        if (provider) {
            return new (provider.adapter || sol_wallet_adapter_1.default)(providerUrl, endpoint);
        }
    }, [provider, providerUrl, endpoint]);
    const [connected, setConnected] = react_1.useState(false);
    react_1.useEffect(() => {
        if ((wallet === null || wallet === void 0 ? void 0 : wallet.publicKey) && connected) {
            const walletPublicKey = wallet.publicKey.toBase58();
            const keyToDisplay = walletPublicKey.length > 20
                ? `${walletPublicKey.substring(0, 7)}.....${walletPublicKey.substring(walletPublicKey.length - 7, walletPublicKey.length)}`
                : walletPublicKey;
            notifications_1.notify({
                message: 'Wallet update',
                description: 'Connected to wallet ' + keyToDisplay,
            });
        }
    }, [connected]);
    react_1.useEffect(() => {
        if (wallet) {
            wallet.on('connect', () => {
                if (wallet.publicKey) {
                    setConnected(true);
                }
            });
            wallet.on('disconnect', () => {
                setConnected(false);
                notifications_1.notify({
                    message: 'Wallet update',
                    description: 'Disconnected from wallet',
                });
            });
        }
        return () => {
            setConnected(false);
            if (wallet) {
                wallet.disconnect();
            }
        };
    }, [wallet]);
    react_1.useEffect(() => {
        if (wallet && autoConnect) {
            wallet.connect();
            setAutoConnect(false);
        }
        return () => { };
    }, [wallet, autoConnect]);
    const [isModalVisible, setIsModalVisible] = react_1.useState(false);
    const [showProviders, setShowProviders] = react_1.useState(false);
    const select = react_1.useCallback(() => setIsModalVisible(true), []);
    const close = react_1.useCallback(() => {
        setIsModalVisible(false);
        setShowProviders(false);
    }, []);
    const pp = exports.WALLET_PROVIDERS.find(wp => wp.name === 'Phantom');
    return (react_1.default.createElement(WalletContext.Provider, { value: {
            wallet,
            connected,
            select,
            provider,
        } },
        children,
        react_1.default.createElement(MetaplexModal_1.MetaplexModal, { visible: isModalVisible, onCancel: close },
            react_1.default.createElement("div", { style: {
                    background: 'linear-gradient(180deg, #D329FC 0%, #8F6DDE 49.48%, #19E6AD 100%)',
                    borderRadius: 36,
                    width: 50,
                    height: 50,
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    lineHeight: 2.4,
                    marginBottom: 10,
                } }, "M"),
            react_1.default.createElement("h2", null, provider ? 'Change provider' : 'Welcome to Metaplex'),
            react_1.default.createElement("p", null, provider
                ? 'Feel free to switch wallet provider'
                : 'You must be signed in to place a bid'),
            react_1.default.createElement("br", null),
            provider || showProviders ? (react_1.default.createElement(react_1.default.Fragment, null, exports.WALLET_PROVIDERS.map((provider, idx) => {
                if (providerUrl === provider.url)
                    return null;
                const onClick = function () {
                    setProviderUrl(provider.url);
                    setAutoConnect(true);
                    close();
                };
                return (react_1.default.createElement(antd_1.Button, { key: idx, size: "large", type: providerUrl === provider.url ? 'primary' : 'ghost', onClick: onClick, icon: react_1.default.createElement("img", { alt: `${provider.name}`, width: 20, height: 20, src: provider.icon, style: { marginRight: 8 } }), style: {
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        marginBottom: 8,
                    } }, provider.name));
            }))) : (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(antd_1.Button, { className: "metaplex-button", style: {
                        width: '80%',
                        fontWeight: 'unset',
                    }, onClick: _ => {
                        setProviderUrl(pp === null || pp === void 0 ? void 0 : pp.url);
                        setAutoConnect(true);
                        close();
                    } },
                    react_1.default.createElement("span", null,
                        react_1.default.createElement("img", { src: pp === null || pp === void 0 ? void 0 : pp.icon, style: { width: '1.2rem' } }),
                        "\u00A0Sign in with Phantom"),
                    react_1.default.createElement("span", null, ">")),
                react_1.default.createElement("p", { onClick: _ => setShowProviders(true), style: { cursor: 'pointer', marginTop: 10 } }, "Select a different Solana wallet"))))));
}
exports.WalletProvider = WalletProvider;
const useWallet = () => {
    const { wallet, connected, provider, select } = react_1.useContext(WalletContext);
    return {
        wallet,
        connected,
        provider,
        select,
        connect() {
            wallet ? wallet.connect() : select();
        },
        disconnect() {
            wallet === null || wallet === void 0 ? void 0 : wallet.disconnect();
        },
    };
};
exports.useWallet = useWallet;
//# sourceMappingURL=wallet.js.map