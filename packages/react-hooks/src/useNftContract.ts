// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Option } from '@polkadot/types';
import type { ContractInfo } from '@polkadot/types/interfaces';

import BN from 'bn.js';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Abi, ContractPromise } from '@polkadot/api-contract';
import { DEFAULT_DECIMALS } from '@polkadot/react-api';
import { useApi, useCall } from '@polkadot/react-hooks';
import { contractAddress, maxGas, value } from '@polkadot/react-hooks/utils';
import keyring from '@polkadot/ui-keyring';
import { settings } from '@polkadot/ui-settings';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import metadata from './metadata19.03.json';

export interface AskOutputInterface {
  output: [string, string, string, BN, string]
}

export interface useNftContractInterface {
  abi: Abi | undefined;
  contractInstance: ContractPromise | null;
  decimals: BN;
  deposited: BN | undefined;
  depositor: string | undefined;
  getDepositor: (collectionId: string, tokenId: string) => Promise<string | null>;
  getTokenAsk: (collectionId: string, tokenId: string) => Promise<{ owner: string, price: BN } | null>;
  getUserDeposit: () => Promise<BN | null>;
  isContractReady: boolean;
  tokenAsk: { owner: string, price: BN } | undefined;
}

// https://docs.google.com/document/d/1WED9VP8Yj52Un4qmkGDpzjesQTzwwoDgYMk1Ty8yftQ/edit
export function useNftContract (account: string): useNftContractInterface {
  const { api } = useApi();
  const [decimals, setDecimals] = useState(new BN(15));
  const [contractInstance, setContractInstance] = useState<ContractPromise | null>(null);
  const [abi, setAbi] = useState<Abi>();
  const [depositor, setDepositor] = useState<string>();
  const [deposited, setDeposited] = useState<BN>();
  const [tokenAsk, setTokenAsk] = useState<{ owner: string, price: BN }>();
  const [isStored, setIsStored] = useState(false);
  const settingsUi = settings.get();

  const contractInfo = useCall<Option<ContractInfo>>(settingsUi.apiUrl.includes('kusama') ? undefined : api.query?.contracts?.contractInfoOf, [contractAddress]);
  // currency code
  const quoteId = 2;

  // get offers
  // if connection ID not specified, returns 30 last token sale offers
  const getUserDeposit = useCallback(async (): Promise<BN | null> => {
    try {
      if (contractInstance) {
        const result = await contractInstance.query.getBalance(account, { gasLimit: maxGas, value }, quoteId) as unknown as { output: BN };

        console.log('getUserDeposit', result);

        if (result.output) {
          setDeposited(result.output);

          return result.output;
        }
      }

      return null;
    } catch (e) {
      console.log('getUserDeposit Error: ', e);

      return null;
    }
  }, [account, contractInstance]);

  const getDepositor = useCallback(async (collectionId: string, tokenId: string): Promise<string | null> => {
    try {
      if (contractInstance) {
        const result = await contractInstance.query.getNftDeposit(account, { gasLimit: maxGas, value }, collectionId, tokenId);

        console.log('getDepositor', result);

        // empty or 0 0 0 0
        if (result.output && result.output.toString() !== '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM') {
          const depositorResult = keyring.encodeAddress(result.output.toString());

          setDepositor(depositorResult);

          return depositorResult;
        }
      }

      return null;
    } catch (e) {
      console.log('getDepositor Error: ', e);

      return null;
    }
  }, [account, contractInstance]);

  const initAbi = useCallback(() => {
    const jsonAbi = new Abi(metadata, api.registry.getChainProperties());
    const newContractInstance = new ContractPromise(api, jsonAbi, contractAddress);

    setAbi(jsonAbi);
    setContractInstance(newContractInstance);
  }, [api]);

  const getTokenAsk = useCallback(async (collectionId: string, tokenId: string) => {
    if (contractInstance) {
      const askIdResult = await contractInstance.query.getAskIdByToken(contractAddress, { gasLimit: maxGas, value }, collectionId, tokenId) as unknown as { output: BN };

      console.log('askIdResult', askIdResult);

      if (askIdResult.output) {
        const askId = askIdResult.output.toNumber();

        if (askId !== 0) {
          const askResult = await contractInstance.query.getAskById(contractAddress, { gasLimit: maxGas, value }, askId) as unknown as AskOutputInterface;

          console.log('askResult', askResult);

          if (askResult.output) {
            const askOwnerAddress = keyring.encodeAddress(askResult.output[4].toString());
            const ask = {
              owner: askOwnerAddress,
              price: askResult.output[3]
            };

            setTokenAsk(ask);

            return ask;
          }
        }
      }
    }

    setTokenAsk(undefined);

    return null;
  }, [contractInstance]);

  const isContractReady = useMemo(() => {
    return !!(abi && contractInstance);
  }, [abi, contractInstance]);

  const fetchSystemProperties = useCallback(async () => {
    const properties = await api.rpc.system.properties();
    const tokenDecimals = properties.tokenDecimals.unwrapOr([DEFAULT_DECIMALS]);

    setDecimals(tokenDecimals[0]);
  }, [api]);

  const addExistingContract = useCallback(() => {
    try {
      const contract = keyring.getContract(contractAddress);

      if (isStored && !contract) {
        const json = {
          contract: {
            abi,
            genesisHash: api.genesisHash.toHex()
          },
          name: 'marketplaceContract',
          tags: []
        };

        keyring.saveContract(contractAddress, json);
      }
    } catch (error) {
      console.error(error);
    }
  }, [abi, api, isStored]);

  useEffect(() => {
    if (isStored) {
      initAbi();
    }
  }, [initAbi, isStored]);

  useEffect(() => {
    void fetchSystemProperties();
  }, [fetchSystemProperties]);

  useEffect((): void => {
    setIsStored(!!contractInfo?.isSome);
  }, [contractInfo]);

  // addContract
  useEffect(() => {
    addExistingContract();
  }, [addExistingContract]);

  return {
    abi,
    contractInstance,
    decimals,
    deposited,
    depositor,
    getDepositor,
    getTokenAsk,
    getUserDeposit,
    isContractReady,
    tokenAsk
  };
}
