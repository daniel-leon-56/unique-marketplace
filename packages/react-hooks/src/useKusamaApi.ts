// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import { useCallback, useContext, useEffect, useState } from 'react';

import { ApiPromise } from '@polkadot/api/promise';
import { typesBundle, typesChain } from '@polkadot/apps-config';
import { StatusContext } from '@polkadot/react-components';
import { BalanceInterface } from '@polkadot/react-hooks/useBalance';
import ApiSigner from '@polkadot/react-signer/signers/ApiSigner';
import { WsProvider } from '@polkadot/rpc-provider';
import { TypeRegistry } from '@polkadot/types/create';
import { encodeAddress } from '@polkadot/util-crypto';

interface UseKusamaApiInterface {
  formatKsmBalance: (balance: BN) => string;
  kusamaBalance: BalanceInterface | undefined;
  kusamaDecimals: number;
  kusamaTransfer: (recipient: string, value: BN, onSuccess: (status: string) => void, onFail: (status: string) => void) => void;
}

export const useKusamaApi = (account?: string): UseKusamaApiInterface => {
  const { queuePayload, queueSetTxStatus } = useContext(StatusContext);
  const [kusamaApi, setKusamaApi] = useState<ApiPromise>();
  const [kusamaDecimals] = useState<number>(12);
  const [kusamaBalance, setKusamaBalance] = useState<BalanceInterface>();
  const [encodedKusamaAccount, setEncodedKusamaAccount] = useState<string>();
  const { queueExtrinsic } = useContext(StatusContext);

  const formatKsmBalance = useCallback((value: BN): string => {
    console.log('value str', parseFloat(value.toString()));

    let roundedNum = (Math.round(parseFloat(value.toString()) / Math.pow(10, kusamaDecimals))).toString();
    const dec = roundedNum.indexOf('.');

    if ((dec >= 0) && (roundedNum.length >= dec + 4)) {
      roundedNum = roundedNum.substr(0, dec + 4);
    }

    console.log('roundedNum', roundedNum);

    return roundedNum; // `${(value.toNumber() / Math.pow(10, kusamaDecimals)).toFixed(5)} ksm`;
  }, [kusamaDecimals]);

  const getKusamaBalance = useCallback(async () => {
    try {
      if (kusamaApi && encodedKusamaAccount) {
        const kusamaAccountBalance: { data: BalanceInterface } = await kusamaApi.query.system.account(encodedKusamaAccount);

        console.log('encodedKusamaAccount', encodedKusamaAccount);

        setKusamaBalance(kusamaAccountBalance.data);
        const ksmBalance = kusamaAccountBalance.data.free.toNumber() / 1000000000000;

        console.log('kusamaAccountBalance', ksmBalance, 'kusamaAccountBalance.data', kusamaAccountBalance.data.free.toNumber());
      }
    } catch (e) {
      console.log('kusama balance error', e);
    }
  }, [encodedKusamaAccount, kusamaApi]);

  const initKusamaApi = useCallback(() => {
    const registry = new TypeRegistry();
    const provider = new WsProvider('wss://kusama-rpc.polkadot.io');
    const signer = new ApiSigner(registry, queuePayload, queueSetTxStatus);
    const types = {} as Record<string, Record<string, string>>;

    const api = new ApiPromise({ provider, registry, signer, types, typesBundle, typesChain });

    api.on('ready', (): void => {
      console.log('kusama api ready');
      setKusamaApi(api);
    });
  }, [queuePayload, queueSetTxStatus]);

  const kusamaTransfer = useCallback((recipient: string, value: BN, onSuccess: (status: string) => void, onFail: (status: string) => void) => {
    if (encodedKusamaAccount && kusamaApi) {
      queueExtrinsic({
        accountId: encodedKusamaAccount,
        extrinsic: kusamaApi.tx.balances
          .transfer(recipient, value),
        isUnsigned: false,
        txFailedCb: () => { onFail('SEND_MONEY_FAIL'); },
        txStartCb: () => { console.log('start'); },
        txSuccessCb: () => { onSuccess('SEND_MONEY_SUCCESS'); },
        txUpdateCb: () => { console.log('update'); }
      });
    }
  }, [encodedKusamaAccount, kusamaApi, queueExtrinsic]);

  useEffect(() => {
    if (account) {
      setEncodedKusamaAccount(encodeAddress(account, 2));
    }
  }, [account]);

  /* useEffect(() => {
    kusamaTransfer('5FZeTmbZQZsJcyEevjGVK1HHkcKfWBYxWpbgEffQ2M1SqAnP', 41916676505);
  }, [kusamaTransfer]); */

  useEffect(() => {
    void getKusamaBalance();
  }, [getKusamaBalance]);

  useEffect(() => {
    initKusamaApi();
  }, [initKusamaApi]);

  return {
    formatKsmBalance,
    kusamaBalance,
    kusamaDecimals,
    kusamaTransfer
  };
};
