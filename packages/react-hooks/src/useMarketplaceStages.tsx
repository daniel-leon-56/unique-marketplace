// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import type { NftCollectionInterface } from '@polkadot/react-hooks/useCollection';
import type { TokenDetailsInterface } from '@polkadot/react-hooks/useToken';

import { useMachine } from '@xstate/react';
import BN from 'bn.js';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StatusContext } from '@polkadot/react-components/Status';
import { useApi, useBalance, useKusamaApi, useNftContract, useToken } from '@polkadot/react-hooks';
import { BalanceInterface } from '@polkadot/react-hooks/useBalance';
import { escrowAddress, findCallMethodByName, KUSAMA_DECIMALS, maxGas, quoteId } from '@polkadot/react-hooks/utils';

import marketplaceStateMachine from './stateMachine';

type UserActionType = 'BUY' | 'CANCEL' | 'SELL' | 'REVERT_UNUSED_MONEY' | 'UPDATE_TOKEN_STATE' | 'OFFER_TRANSACTION_FAIL' | 'SUBMIT_OFFER' | 'OFFER_TRANSACTION_SUCCESS';

export interface MarketplaceStagesInterface {
  buyFee: BN | undefined;
  cancelStep: boolean;
  deposited: BN | undefined;
  depositor: string | undefined;
  escrowAddress: string;
  error: string | null;
  formatKsmBalance: (value: BN | undefined) => string;
  kusamaBalance: BalanceInterface | undefined;
  saleFee: BN | undefined;
  sendCurrentUserAction: (action: UserActionType) => void;
  setPrice: (price: string) => void;
  setReadyToAskPrice: (ready: boolean) => void;
  setTokenPriceForSale: (price: number) => void;
  setWithdrawAmount: (withdrawAmount: string) => void;
  tokenAsk: { owner: string, price: BN } | undefined;
  tokenInfo: TokenDetailsInterface | undefined;
  tokenPriceForSale: number | undefined;
  transferStep: number;
  readyToAskPrice: boolean;
  withdrawAmount: string;
}

export const useMarketplaceStages = (account: string, collectionInfo: NftCollectionInterface | undefined, tokenId: string): MarketplaceStagesInterface => {
  const { api } = useApi();
  const [state, send] = useMachine(marketplaceStateMachine);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0');
  const [tokenInfo, setTokenInfo] = useState<TokenDetailsInterface>();
  const [saleFee, setSaleFee] = useState<BN>();
  const [buyFee, setBuyFee] = useState<BN>();
  const { getDetailedReFungibleTokenInfo, getDetailedTokenInfo } = useToken();
  const { contractInstance, deposited, depositor, getDepositor, getTokenAsk, getUserDeposit, isContractReady, tokenAsk } = useNftContract(account);
  const { balance } = useBalance(account);
  const [error, setError] = useState<string | null>(null);
  const { queueExtrinsic } = useContext(StatusContext);
  const [readyToAskPrice, setReadyToAskPrice] = useState<boolean>(false);
  const [tokenPriceForSale, setTokenPriceForSale] = useState<number>();
  const { formatKsmBalance, kusamaBalance, kusamaTransfer } = useKusamaApi(account);

  const sendCurrentUserAction = useCallback((userAction: UserActionType) => {
    send(userAction);
  }, [send]);

  const getTokenInfo = useCallback(async () => {
    let info;

    if (!collectionInfo) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(collectionInfo.Mode, 'reFungible')) {
      info = await getDetailedReFungibleTokenInfo(collectionInfo.id, tokenId);
    } else {
      info = await getDetailedTokenInfo(collectionInfo.id, tokenId);
    }

    setTokenInfo(info);

    return info;
  }, [collectionInfo, getDetailedReFungibleTokenInfo, getDetailedTokenInfo, tokenId]);

  const loadingTokenInfo = useCallback(async () => {
    if (!collectionInfo) {
      return;
    }

    const info = await getTokenInfo();
    const ask = await getTokenAsk(collectionInfo.id, tokenId);

    await getUserDeposit();

    // the token is mine
    if (info?.Owner?.toString() === escrowAddress) {
      if (!ask || !ask.price) {
        const tokenDepositor = await getDepositor(collectionInfo.id, tokenId);

        console.log('tokenDepositor', tokenDepositor);

        if (tokenDepositor === account) {
          // the token is in escrow - waiting for deposit
          send('WAIT_FOR_DEPOSIT');
        }
      }
    }

    send('WAIT_FOR_USER_ACTION');
  }, [collectionInfo, getTokenInfo, account, getUserDeposit, send, getTokenAsk, tokenId, getDepositor]);

  const getFee = useCallback((price: BN): BN => {
    return price.muln(2).divRound(new BN(100));
  }, []);

  const queueTransaction = useCallback((transaction: SubmittableExtrinsic, fail: string, start: string, success: string, update: string) => {
    queueExtrinsic({
      accountId: account && account.toString(),
      extrinsic: transaction,
      isUnsigned: false,
      txFailedCb: () => { send(fail); },
      txStartCb: () => { console.log(start); },
      txSuccessCb: () => { send(success); },
      txUpdateCb: () => { console.log(update); }
    });
  }, [account, queueExtrinsic, send]);

  const getSaleFee = useCallback(async () => {
    const fee = await api.tx.nft.transfer(escrowAddress, collectionInfo?.id, tokenId, 0).paymentInfo(account) as { partialFee: BN };

    if (fee) {
      setSaleFee(fee.partialFee);

      return fee.partialFee.muln(2);
    }

    return null;
  }, [account, api.tx.nft, collectionInfo, tokenId]);

  const getBuyFee = useCallback(async () => {
    if (contractInstance && collectionInfo) {
      const message = findCallMethodByName(contractInstance, 'buy');

      if (message) {
        const extrinsic = contractInstance.exec(message, {
          gasLimit: maxGas,
          value: 0
        }, collectionInfo.id, tokenId);

        const fee = await extrinsic.paymentInfo(account) as { partialFee: BN };

        if (fee) {
          setBuyFee(fee.partialFee);

          return fee.partialFee;
        }
      }
    }

    return null;
  }, [account, contractInstance, collectionInfo, tokenId]);

  /** user actions **/
  const sell = useCallback(() => {
    // check balance to have enough fee
    if (saleFee && balance?.free.gte(saleFee) && collectionInfo) {
      queueTransaction(
        api.tx.nft
          .transfer(escrowAddress, collectionInfo.id, tokenId, 0),
        'TRANSFER_FAIL',
        'deposit nft to contract start',
        'TRANSFER_SUCCESS',
        'deposit nft to contract update'
      );
      send('TRANSACTION_READY');
    } else {
      alert('Your unique balance is not enough to sell');
    }
  }, [api.tx.nft, balance?.free, collectionInfo, saleFee, queueTransaction, send, tokenId]);

  const waitForNftDeposit = useCallback(async () => {
    if (collectionInfo) {
      const tokenDepositor = await getDepositor(collectionInfo.id, tokenId);

      if (tokenDepositor === account) {
        send('NFT_DEPOSIT_READY');
      } else if (tokenDepositor || (tokenAsk && tokenAsk.price)) {
        send('NFT_DEPOSIT_OTHER');
      } else {
        setTimeout(() => {
          void waitForNftDeposit();
        }, 5000);
      }
    }
  }, [account, collectionInfo, getDepositor, send, tokenAsk, tokenId]);

  const waitForTokenRevert = useCallback(async () => {
    const info = await getTokenInfo();

    if (info?.Owner?.toString() === account) {
      send('TOKEN_REVERT_SUCCESS');
    } else {
      setTimeout(() => {
        void waitForTokenRevert();
      }, 5000);
    }
  }, [account, getTokenInfo, send]);

  const depositNeeded = useCallback((userDeposit: BN, tokenPrice: BN): BN => {
    const feeFull = getFee(tokenPrice);
    const feePaid = getFee(userDeposit);
    const fee = feeFull.sub(feePaid);

    return tokenPrice.add(fee).sub(userDeposit);
  }, [getFee]);

  const isDepositEnough = useCallback((userDeposit: BN, tokenPrice: BN): boolean => {
    return !depositNeeded(userDeposit, tokenPrice).gtn(0);
  }, [depositNeeded]);

  const buy = useCallback(async () => {
    const userDeposit = await getUserDeposit();

    if (!tokenAsk || !userDeposit) {
      console.error('tokenAsk is undefined');

      send('WAIT_FOR_DEPOSIT');

      return;
    }

    if (!isDepositEnough(userDeposit, tokenAsk.price)) {
      const needed = depositNeeded(userDeposit, tokenAsk.price);

      if (kusamaBalance?.free.lt(needed)) {
        const err = `Your KSM balance is too low: ${formatKsmBalance(kusamaBalance?.free)} KSM. You need at least: ${formatKsmBalance(needed)} KSM`;

        setError(err);

        return;
      }

      send('SIGN_SUCCESS');
      kusamaTransfer(escrowAddress, needed, send, send);
    } else {
      send('WAIT_FOR_DEPOSIT');
    }
    // buyStep3
  }, [depositNeeded, getUserDeposit, isDepositEnough, formatKsmBalance, kusamaBalance, kusamaTransfer, send, tokenAsk]);

  const checkDepositReady = useCallback(async () => {
    const userDeposit = await getUserDeposit();

    if (userDeposit && tokenAsk && isDepositEnough(userDeposit, tokenAsk.price)) {
      send('DEPOSIT_SUCCESS');
    } else {
      setTimeout(() => {
        void checkDepositReady();
      }, 5000);
    }
  }, [getUserDeposit, isDepositEnough, send, tokenAsk]);

  const sentTokenToAccount = useCallback(() => {
    const message = findCallMethodByName(contractInstance, 'buy');

    if (message && contractInstance && collectionInfo) {
      send('SIGN_SUCCESS');

      const extrinsic = contractInstance.exec(message, {
        gasLimit: maxGas,
        value: 0
      }, collectionInfo.id, tokenId);

      queueTransaction(
        extrinsic,
        'SEND_TOKEN_FAIL',
        'buy start',
        'SEND_TOKEN_SUCCESS',
        'buy update'
      );
    } else {
      send('SIGN_FAIL');
    }
  }, [contractInstance, collectionInfo, send, tokenId, queueTransaction]);

  const revertMoney = useCallback(() => {
    const message = findCallMethodByName(contractInstance, 'withdraw');

    if (message && contractInstance) {
      const extrinsic = contractInstance.exec(message, {
        gasLimit: maxGas,
        value: 0
      }, quoteId, (parseFloat(withdrawAmount) * Math.pow(10, KUSAMA_DECIMALS)));

      queueTransaction(
        extrinsic,
        'WITHDRAW_FAIL',
        'withdraw start',
        'WITHDRAW_SUCCESS',
        'withdraw update'
      );
    }
  }, [contractInstance, withdrawAmount, queueTransaction]);

  const askPrice = useCallback(() => {
    setReadyToAskPrice(true);
  }, [setReadyToAskPrice]);

  const registerSale = useCallback(() => {
    const message = findCallMethodByName(contractInstance, 'ask');

    if (message && contractInstance && collectionInfo) {
      console.log('tokenPriceForSale', tokenPriceForSale);

      const extrinsic = contractInstance.exec(message, { gasLimit: maxGas, value: 0 }, collectionInfo.id, tokenId, quoteId, tokenPriceForSale);

      queueTransaction(
        extrinsic,
        'REGISTER_SALE_FAIL',
        'registerSale start',
        'REGISTER_SALE_SUCCESS',
        'registerSale update'
      );
    }
  }, [collectionInfo, contractInstance, queueTransaction, tokenId, tokenPriceForSale]);

  const cancelSell = useCallback(() => {
    const message = findCallMethodByName(contractInstance, 'cancel');

    if (message && contractInstance && collectionInfo) {
      const extrinsic = contractInstance.exec(message, { gasLimit: maxGas, value: 0 }, collectionInfo.id, tokenId);

      queueTransaction(
        extrinsic,
        'CANCEL_SELL_FAIL',
        'cancelSell start',
        'CANCEL_SELL_SUCCESS',
        'cancelSell update'
      );
    }
  }, [collectionInfo, contractInstance, queueTransaction, tokenId]);

  const setPrice = useCallback((price) => {
    setTokenPriceForSale(price);
    setReadyToAskPrice(false);
    send('ASK_PRICE_SUCCESS');
  }, [send]);

  const transferStep = useMemo((): number => {
    switch (state.value) {
      case 'sell':
      case 'waitForSignTransfer':
        return 1;
      case 'waitForNftDeposit':
        return 2;
      case 'askPrice':
      case 'registerSale':
        return 3;
      case 'buy':
      case 'waitForSignMoneyTransfer':
        return 4;
      case 'checkDepositReady':
        return 5;
      case 'sentTokenToNewOwner':
      case 'waitForSignTokenBuy':
      case 'waitForTokenOwn':
        return 6;
      default:
        return 0;
    }
  }, [state.value]);

  const cancelStep = useMemo((): boolean => {
    return state.matches('cancelSell') || state.matches('waitForTokenRevert');
  }, [state]);

  useEffect(() => {
    switch (true) {
      // on load - update token state
      case state.matches('loadingTokenInfo'):
        void loadingTokenInfo();
        break;
      case state.matches('buy'):
        void buy();
        break;
      case state.matches('sell'):
        void sell();
        break;
      case state.matches('sentTokenToNewOwner'):
        void sentTokenToAccount();
        break;
      case state.matches('waitForNftDeposit'):
        void waitForNftDeposit();
        break;
      case state.matches('getDepositReady'):
        break;
      case state.matches('askPrice'):
        void askPrice();
        break;
      case state.matches('registerSale'):
        void registerSale();
        break;
      case state.matches('revertMoney'):
        void revertMoney();
        break;
      case state.matches('checkDepositReady'):
        void checkDepositReady();
        break;
      case state.matches('cancelSell'):
        void cancelSell();
        break;
      case state.matches('waitForTokenRevert'):
      case state.matches('waitForTokenOwn'):
        void waitForTokenRevert();
        break;
      default:
        break;
    }
  }, [state.value, loadingTokenInfo, state, buy, sell, sentTokenToAccount, waitForNftDeposit, askPrice, registerSale, revertMoney, checkDepositReady, cancelSell, waitForTokenRevert]);

  useEffect(() => {
    if (isContractReady) {
      send('UPDATE_TOKEN_STATE');
    }
  }, [send, isContractReady]);

  useEffect(() => {
    if (account) {
      void getSaleFee();
      void getBuyFee();
    }
  }, [account, getBuyFee, getSaleFee]);

  console.log('buy / sale stage', state.value);

  return {
    buyFee,
    cancelStep,
    deposited,
    depositor,
    error,
    escrowAddress,
    formatKsmBalance,
    kusamaBalance,
    readyToAskPrice,
    saleFee,
    sendCurrentUserAction,
    setPrice,
    setReadyToAskPrice,
    setTokenPriceForSale,
    setWithdrawAmount,
    tokenAsk,
    tokenInfo,
    tokenPriceForSale,
    transferStep,
    withdrawAmount
  };
};
