import React, { useEffect, useState } from 'react';
import Countdown, { zeroPad } from 'react-countdown';
import { Button, Progress, Typography, Row, Col } from 'antd';
import { web3, Provider, Program, Idl } from '@project-serum/anchor';
import { useConnection, useWallet, ConnectButton } from '@oyster/common';
import idl from '../../config/simple_token_sale.json';
import type { MasterAccount } from './types';
import { Confetti } from './../../components/Confetti';
import { PublicKey } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { FeatureList } from './FeatureList';

const TOKEN_SALE_PROGRAM_ADDRESS =
  'thugJjfoQEpyDCs9qYnkbwWv9maKzkK5WYQLJvUoGbY';
const TOKEN_SALE_MASTER_ACCOUNT_ADDRESS =
  'bFtNx2hXR6jZrKUpKhWgAcSfZb8wrCx3g6t9a38AEuX';

const MAX_RETRIES = 2; // what is a good value for this?

const { Title } = Typography;

/**
 * Get associated token address
 *
 * @param owner - the public key that owns the associated token address
 * @param mint - the mint
 * @returns a promise of the associated token address
 */
export async function getAssociatedTokenAddress(
  owner: PublicKey,
  mint: PublicKey,
): Promise<PublicKey> {
  const [address] = await PublicKey.findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

const getPurchaseBtnText = (
  connected: boolean,
  isProcessing: boolean,
  isDone: boolean,
  price: number,
  isSoldOut: boolean,
  errorPurchasing: Error | null,
  retriedTimes: number,
) => {
  if (!connected) return 'connect your wallet';
  else if (errorPurchasing !== null) return 'No Success 😔';
  else if (isSoldOut)
    return <span className="bungee-font-inline">COLECTION SOLD OUT</span>;
  else if (isProcessing && retriedTimes > 0 && !isDone)
    return `Trying again  (${retriedTimes} try)...`;
  else if (isProcessing) return 'processing request...';
  else if (isDone) return <span>Success! 🎉</span>;
  else
    return (
      <span>
        Mint <span className="bungee-font-inline">bird</span> for ◎{price} SOL!
      </span>
    );
};

/** Convenience function to refresh token sale data */
const updateTokenSane = async (
  accountId: PublicKey,
  program: Program,
  setAccountFn: React.Dispatch<
    React.SetStateAction<MasterAccount | undefined | null>
  >,
  setProgressValueFn: React.Dispatch<React.SetStateAction<number | null>>,
  setAmountRemainingFn: React.Dispatch<React.SetStateAction<number>>,
  setCurrentPriceFn: React.Dispatch<React.SetStateAction<number>>,
) => {
  try {
    const masterAccount = await program.account.masterAccount.fetch(accountId);

    if (masterAccount) {
      const account = masterAccount as MasterAccount;
      console.log(
        'Fetched master account: ',
        TOKEN_SALE_MASTER_ACCOUNT_ADDRESS,
      );
      setAccountFn(masterAccount as MasterAccount);
      if (account && account.allocated.toNumber() > 0) {
        // set progress value and amount remaining

        if (account.sold.toNumber() <= 1) {
          setProgressValueFn(0);
          setAmountRemainingFn(account.allocated.toNumber());
        } else {
          setProgressValueFn(
            Math.round(
              (account.sold.toNumber() / account.allocated.toNumber()) * 100,
            ),
          );
          setAmountRemainingFn(
            account.allocated.toNumber() - account.sold.toNumber(),
          );
        }
        // set price
        if (account.sold.toNumber() <= 310) {
          setCurrentPriceFn(1);
        } else if (account.sold.toNumber() <= 1421) {
          setCurrentPriceFn(2);
        }
      }
    } else {
      setAccountFn(null);
    }
  } catch (error) {
    setAccountFn(null);
    console.warn(`Can't get the account: ${error.message}`);
  }
};

// month starts at 0; Aug is 7th
const saleStartUTCTime = Date.UTC(2021, 7, 30, 14, 0, 0);

const saleStartDate = new Date(saleStartUTCTime);

const alreadySoldNumber = 801;

export const PurchaseArt = () => {
  const { wallet, connected } = useWallet();
  const connection = useConnection();

  const [account, setAccount] =
    useState<MasterAccount | undefined | null>(undefined);
  const [progressValue, setProgressValue] = useState<number | null>(null);
  const [amountRemaining, setAmountRemaining] = useState<number>(3333); // TODO: whats a good default?
  const [currentPrice, setCurrentPrice] = useState<number>(3);
  const [retriedTimes, setRetriedTimes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [ifDealMade, setDealMade] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorPurchasing, setErrorPurchasing] = useState(null);

  const [anchorProvider, setAnchorProvider] = useState<Provider | null>(null);
  const [anchorProgram, setAnchorProgram] = useState<Program | null>(null);

  const masterAccountPubkey = new web3.PublicKey(
    TOKEN_SALE_MASTER_ACCOUNT_ADDRESS,
  );
  const tokenSaleProgramId = new web3.PublicKey(TOKEN_SALE_PROGRAM_ADDRESS);

  const refreshInformation = async () => {
    if (anchorProgram) {
      await updateTokenSane(
        masterAccountPubkey,
        anchorProgram,
        setAccount,
        setProgressValue,
        setAmountRemaining,
        setCurrentPrice,
      );
    } else {
      console.log('Token sale info not found');
    }
  };

  useEffect(() => {
    const provider = new Provider(
      connection,
      wallet as any,
      Provider.defaultOptions(),
    );
    const tokenSaleProgram = new Program(
      idl as unknown as Idl,
      tokenSaleProgramId,
      provider,
    );
    setAnchorProvider(provider);
    setAnchorProgram(tokenSaleProgram);
  }, [wallet]);

  useEffect(() => {
    const runner = async () => {
      if (wallet?.publicKey) {
        await refreshInformation();
      } else {
      }
    };
    runner();
  }, [wallet, connected]);

  const doPurchase = async (retriedCounter: number) => {
    if (
      !connected ||
      !wallet?.publicKey ||
      !account ||
      !anchorProgram ||
      !anchorProvider
    ) {
      throw new Error('Something wrong happened.');
    }

    try {
      setIsProcessing(true);

      const SEED = Buffer.from('Oo');
      const payer = wallet.publicKey;
      // The mint to create.
      const mintAccount = web3.Keypair.generate();
      // The token mint metadata account
      const tokenMetadataProgram = new web3.PublicKey(
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
      );
      const [mintMetadata, _mint_nonce] =
        await web3.PublicKey.findProgramAddress(
          [
            Buffer.from('metadata'),
            tokenMetadataProgram.toBuffer(),
            mintAccount.publicKey.toBuffer(),
          ],
          tokenMetadataProgram,
        );

      // The buyer's token account
      const buyerTokenAccount = await getAssociatedTokenAddress(
        payer,
        mintAccount.publicKey,
      );

      // the program authority
      const [programAuthority, nonce] = await web3.PublicKey.findProgramAddress(
        [SEED],
        anchorProgram.programId,
      );

      // throw new Error('failed');
      const txId = await anchorProgram.rpc.purchase(nonce, {
        accounts: {
          payer,
          buyerTokenAccount,
          mint: mintAccount.publicKey,
          mintMetadata,
          authority: new web3.PublicKey(
            '8mih8smkTnj69ByMw5ZmcBpPdgJq9F4Lt1k8m6hafsiZ',
          ),
          masterAccount: masterAccountPubkey,
          programAuthority,
          tokenMetadataProgram,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [mintAccount],
        instructions: [
          web3.SystemProgram.createAccount({
            fromPubkey: payer,
            newAccountPubkey: mintAccount.publicKey,
            space: 82,
            lamports:
              await anchorProvider.connection.getMinimumBalanceForRentExemption(
                82,
              ),
            programId: TOKEN_PROGRAM_ID,
          }),
        ],
      });

      console.log('Successful purchase, transaction ID: ', txId);

      setIsProcessing(false);
      setDealMade(true);
      refreshInformation();
      setIsDone(true);
    } catch (error) {
      if (retriedCounter > MAX_RETRIES) {
        // this is so that we can break out of a potentially endless loop of retrying
        console.warn('Error occurred while purchasing the item: ', error);
        setErrorPurchasing(error);
      } else {
        // prevent multiply purchases for single buy button
        if (isDone) return;

        const retriedTimesUpdated = retriedCounter + 1;
        setRetriedTimes(retriedTimesUpdated);
        console.log(`Retry #retriedTimes`);
        refreshInformation().then(async () => {
          await doPurchase(retriedTimesUpdated);
        });
      }
    } finally {
      if (isDone || retriedCounter > MAX_RETRIES) {
        setIsProcessing(false);
        setIsDone(true);
      }
    }
  };

  if (isLoading) return <div>loading...</div>;

  const isSoldOut = progressValue !== null && progressValue >= 100;

  const btnText = getPurchaseBtnText(
    connected,
    isProcessing,
    isDone,
    currentPrice,
    isSoldOut,
    errorPurchasing,
    retriedTimes,
  );

  return (
    <div className="purchase-screen bungee-font">
      <br />
      <br />
      <Title level={2} className="welcome-text">
        Introducing Thugbirdz: OG Collection
        {/* We have experienced significant traffic overload over sale. */}
      </Title>
      <br />
      <br />

      <Row gutter={[0, 24]}>
        <Col xs={{ span: 24 }} md={{ span: 8 }} style={styles.flexCol}>
          <img src="hero.gif" style={{ height: '250px' }} />

          <Countdown
            date={saleStartDate}
            renderer={({ days, hours, minutes, seconds, completed }) => {
              if (!completed)
                return (
                  <Button
                    type="primary"
                    shape="round"
                    size="large"
                    className="app-btn purchase-btn"
                    onClick={() => {}}
                    disabled={true}
                  >
                    <span style={{ marginRight: '10px' }}>Buy in</span>
                    <span>
                      {zeroPad(days)}:{zeroPad(hours)}:{zeroPad(minutes)}:
                      {zeroPad(seconds)}
                    </span>
                  </Button>
                );

              return (
                <>
                  {!connected ? (
                    <>
                      <h2 className="highlight sky-title">
                        CONNECT YOUR WALLET
                      </h2>
                      <ConnectButton
                        type="primary"
                        style={{ fontSize: '24px', height: 'auto' }}
                      />
                    </>
                  ) : null}

                  {connected && account === null ? (
                    <div className="purchase-error">
                      <b>Can't access purchase contract.</b>
                      <br />
                      Refresh the page and try again!
                    </div>
                  ) : null}

                  {isSoldOut ? (
                    <h1 className="highlight sky-title">SOLD OUT</h1>
                  ) : null}

                  {progressValue !== null && !isSoldOut && account && (
                    <>
                      <Button
                        type="primary"
                        shape="round"
                        size="large"
                        className="app-btn purchase-btn"
                        onClick={() => doPurchase(retriedTimes)}
                        disabled={
                          !connected ||
                          isDone ||
                          ifDealMade ||
                          isProcessing ||
                          !!errorPurchasing
                        }
                      >
                        {btnText}
                      </Button>
                    </>
                  )}
                </>
              );
            }}
          />

          {ifDealMade ? <Confetti /> : null}
        </Col>
        <Col
          xs={{ span: 24 }}
          md={{ span: 12, offset: 4 }}
          style={{ display: 'flex' }}
        >
          <div>
            {ifDealMade ? (
              <>
                <h2 className="highlight sky-title">
                  Success! 🎉 <br />
                  Your <span className="bungee-font-inline">bird</span> is on
                  its way...
                </h2>
              </>
            ) : null}

            {errorPurchasing ? (
              <div className="purchase-error">
                <b>TX wasn't successful.</b>
                <br />
                Make sure you have enough SOL in your wallet and you use correct
                Solana network (mainnet-beta).
                <br />
                Then refresh the page and try again!
              </div>
            ) : null}

            {/* <div className="only-left-text">
              <span className="highlight">{2580}</span> of{' '}
              <span className="highlight">{3333}</span> remaining
            </div>
            <Progress percent={22} /> */}

            {progressValue !== null && !isSoldOut && account && (
              <>
                <div className="only-left-text">
                  Only <span className="highlight">{amountRemaining}</span> of{' '}
                  <span className="highlight">
                    {account.allocated.toNumber()+alreadySoldNumber}
                  </span>{' '}
                  remaining
                </div>
                <Progress percent={progressValue+22} />
              </>
            )}

            <br />
            <br />
            <br />
            <p style={styles.description}>
              Collection of <b>3,333</b> uniquely generated, tough and
              collectible thugbirdz.
            </p>
            <Row>
              <Col span={7}>
                <a
                  style={styles.social}
                  href="https://discord.com/invite/thugbirdz"
                  target="_blank"
                >
                  <DiscordLogo />
                </a>
              </Col>
              <Col span={4}>
                <a
                  style={styles.social}
                  href="https://twitter.com/thugbirdz"
                  target="_blank"
                >
                  <TwitterLogo />
                </a>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <br></br>
      <br></br>
      <FeatureList />
    </div>
  );
};

const styles = {
  error: {
    fontSize: '2.5em',
    marginTop: '-350px',
    position: 'relative',
    zIndex: 1,
    maxWidth: '680px',
    textAlign: 'center',
  },
  description: {
    color: 'white',
    fontSize: '1.5em',
    margin: 0,
  },
  soonBuy: {
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  social: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100px',
  },
  socialText: {
    margin: 0,
    fontSize: '2em',
  },
  flexCol: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column' as 'column',
    justifyContent: 'flex-start',
  },
};

const DeadServer = () => (
  <div className="purchase-screen bungee-font">
    <Title level={2} className="welcome-text">
      {/* Introducing Thugbirdz: OG Collection */}
      We have experienced significant traffic overload over sale.
    </Title>
    <img src="hero.gif" style={{ filter: 'blur(30px)' }} />

    <h1 className="highlight sky-title" style={styles.error as any}>
      So, we have paused it and updating our infra so no server overloads,
      weather cyclons or any other gang clans {"can't"} stop our birdz on its
      way to you!
    </h1>

    <p style={{ color: 'white', fontSize: '4em', position: 'relative' }}>
      Stay Tuned!
    </p>
  </div>
);

const DiscordLogo = () => (
  <svg
    width="100"
    height="114"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: 'scale(0.5)' }}
  >
    <g fill="#C0FFFF" fill-rule="evenodd">
      <path d="M60.48 47.516c-3.256 0-5.826 2.799-5.826 6.282 0 3.484 2.628 6.283 5.826 6.283 3.255 0 5.825-2.799 5.825-6.283 0-3.483-2.627-6.282-5.825-6.282zm-20.845 0c-3.256 0-5.826 2.799-5.826 6.282 0 3.484 2.627 6.283 5.826 6.283 3.255 0 5.825-2.799 5.825-6.283.057-3.483-2.57-6.282-5.825-6.282z" />
      <path d="M88.235 0H11.707C5.254 0 0 5.255 0 11.708v76.527c0 6.454 5.254 11.708 11.707 11.708h64.764l-3.027-10.451 7.31 6.739 6.91 6.34L100 113.25V11.707C99.943 5.254 94.689 0 88.235 0zM66.19 73.958s-2.056-2.456-3.769-4.569c7.482-2.113 10.337-6.739 10.337-6.739-2.341 1.542-4.569 2.628-6.568 3.37-2.855 1.2-5.597 1.942-8.28 2.456-5.483 1.028-10.509.742-14.792-.057-3.255-.629-6.054-1.485-8.396-2.456-1.313-.514-2.74-1.142-4.169-1.942-.17-.114-.342-.171-.514-.285-.114-.057-.17-.115-.228-.115-1.028-.57-1.6-.97-1.6-.97s2.742 4.511 9.995 6.681c-1.713 2.17-3.826 4.684-3.826 4.684-12.622-.4-17.419-8.624-17.419-8.624 0-18.218 8.224-33.01 8.224-33.01 8.224-6.11 15.99-5.94 15.99-5.94l.572.686c-10.28 2.912-14.963 7.424-14.963 7.424s1.256-.685 3.37-1.599c6.11-2.684 10.965-3.37 12.964-3.598.342-.057.628-.114.97-.114a48.33 48.33 0 0111.537-.115c5.425.629 11.25 2.228 17.19 5.426 0 0-4.512-4.283-14.22-7.196l.8-.914s7.823-.17 15.99 5.94c0 0 8.224 14.792 8.224 33.01 0-.057-4.798 8.167-17.419 8.566z" />
    </g>
  </svg>
);

const TwitterLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="266.667"
    height="216.715"
    viewBox="0 0 6701 5446"
    shape-rendering="geometricPrecision"
    text-rendering="geometricPrecision"
    image-rendering="optimizeQuality"
    fill-rule="evenodd"
    clip-rule="evenodd"
    style={{ transform: 'scale(0.75)' }}
  >
    <path
      d="M6701 645c-247 109-512 183-790 216 284-170 502-440 604-761-266 158-560 272-873 334C5391 167 5034 0 4638 0c-759 0-1375 616-1375 1375 0 108 12 213 36 313-1143-57-2156-605-2834-1437-118 203-186 439-186 691 0 477 243 898 612 1144-225-7-437-69-623-172v17c0 666 474 1222 1103 1348-115 31-237 48-362 48-89 0-175-9-259-25 175 546 683 944 1284 955-471 369-1063 589-1708 589-111 0-220-7-328-19 608 390 1331 618 2108 618 2529 0 3912-2095 3912-3912 0-60-1-119-4-178 269-194 502-436 686-712z"
      fill="#c0ffff"
    />
  </svg>
);
