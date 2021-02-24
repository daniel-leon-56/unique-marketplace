// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import { useCallback, useState } from 'react';

import { ErrorType, useApi, useFetch } from '@polkadot/react-hooks';

export type MetadataType = {
  metadata: string;
}

export type TokenAttribute = {
  [key: string]: {
    type: number | string | 'enum';
    size: number;
    values: string[];
  }
}

export interface NftCollectionInterface {
  Access?: 'Normal'
  id: string;
  DecimalPoints: BN | number;
  Description: BN[];
  TokenPrefix: number | string;
  MintMode?: boolean;
  Mode: {
    isNft: boolean;
    isFungible: boolean;
    isReFungible: boolean;
    isInvalid: boolean;
  };
  Name: BN[];
  OffchainSchema: string | MetadataType;
  Owner?: string;
  SchemaVersion: 'ImageURL' | 'Unique';
  Sponsor?: string; // account
  SponsorConfirmed?: boolean;
  Limits?: {
    AccountTokenOwnershipLimit: string;
    SponsoredMintSize: string;
    TokenLimit: string;
    SponsorTimeout: string;
  },
  VariableOnChainSchema: string;
  ConstOnChainSchema: string;
}

export interface TokenDetailsInterface {
  Owner?: any[];
  ConstData?: number[];
  VariableData?: number[];
}

export type OfferType = {
  collectionId: string;
  price: BN;
  seller: string;
  tokenId: string;
  metadata: any;
}

export type TradeType = {
  buyer: string;
  offer: OfferType;
  tradeDate: string;
}

export function useCollections () {
  const { api } = useApi();
  const { fetchData } = useFetch();
  const [error, setError] = useState<ErrorType>();
  const [offers, setOffers] = useState<OfferType[]>();
  const [trades, setTrades] = useState<TradeType[]>();

  const getTokensOfCollection = useCallback(async (collectionId: number, ownerId: string) => {
    if (!api || !collectionId || !ownerId) {
      return [];
    }

    try {
      return (await api.query.nft.addressTokens(collectionId, ownerId));
    } catch (e) {
      console.log('getTokensOfCollection error', e);
    }

    return [];
  }, [api]);

  const getDetailedCollectionInfo = useCallback(async (collectionId) => {
    if (!api) {
      return {};
    }

    try {
      return (await api.query.nft.collection(collectionId));
    } catch (e) {
      console.log('getDetailedCollectionInfo error', e);
    }

    return {};
  }, [api]);

  const getDetailedTokenInfo = useCallback(async (collectionId: string, tokenId: string): Promise<TokenDetailsInterface> => {
    if (!api) {
      return {};
    }

    try {
      return (await api.query.nft.nftItemList(collectionId, tokenId) as unknown as TokenDetailsInterface);
    } catch (e) {
      console.log('getDetailedTokenInfo error', e);

      return {};
    }
  }, [api]);

  const getDetailedReFungibleTokenInfo = useCallback(async (collectionId: string, tokenId: string): Promise<TokenDetailsInterface> => {
    if (!api) {
      return {};
    }

    try {
      return (await api.query.nft.reFungibleItemList(collectionId, tokenId) as unknown as TokenDetailsInterface);
    } catch (e) {
      console.log('getDetailedReFungibleTokenInfo error', e);

      return {};
    }
  }, [api]);

  /**
   * Return the list of token sale offers
   */
  const getOffers = useCallback(() => {
    fetchData<OfferType[]>('/api/offers/').subscribe((result: OfferType[] | ErrorType) => {
      if ('error' in result) {
        setError(result);
      } else {
        setOffers(result);
      }
    });
  }, [fetchData]);

  /**
   * Return the list of token trades
   */
  const getTrades = useCallback(() => {
    fetchData<TradeType[]>('/api/trades/').subscribe((result: TradeType[] | ErrorType) => {
      if ('error' in result) {
        setError(result);
      } else {
        setTrades(result);
      }
    });
  }, [fetchData]);

  const presetTokensCollections = useCallback(async () => {
    if (!api) {
      return [];
    }

    try {
      const collectionsCount = (await api.query.nft.collectionCount() as unknown as BN).toNumber();
      const collections: Array<NftCollectionInterface> = [];

      for (let i = 1; i <= collectionsCount; i++) {
        const collectionInf = await getDetailedCollectionInfo(i) as unknown as NftCollectionInterface;

        if (collectionInf && collectionInf.Owner && collectionInf.Owner.toString() !== '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM') {
          collections.push({ ...collectionInf, id: i.toString() });
        }
      }

      return collections;
    } catch (e) {
      console.log('preset tokens collections error', e);

      return [];
    }
  }, [api, getDetailedCollectionInfo]);

  return {
    error,
    getDetailedCollectionInfo,
    getDetailedReFungibleTokenInfo,
    getDetailedTokenInfo,
    getOffers,
    getTokensOfCollection,
    getTrades,
    offers,
    presetTokensCollections,
    trades
  };
}
