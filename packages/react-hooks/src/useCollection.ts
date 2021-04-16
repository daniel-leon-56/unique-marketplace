// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BN from 'bn.js';
import { useCallback, useContext } from 'react';

import { StatusContext } from '@polkadot/react-components';
import { useApi } from '@polkadot/react-hooks/useApi';
import { strToUTF16 } from '@polkadot/react-hooks/utils';

export interface NftCollectionInterface {
  Access?: 'Normal'
  id: string;
  DecimalPoints: BN | number;
  Description: number[];
  TokenPrefix: string;
  MintMode?: boolean;
  Mode: {
    nft: null;
    fungible: null;
    reFungible: null;
    invalid: null;
  };
  Name: number[];
  OffchainSchema: string;
  Owner?: string;
  SchemaVersion: {
    isImageUrl: boolean;
    isUnique: boolean;
  };
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

export function useCollection () {
  const { api } = useApi();
  const { queueExtrinsic } = useContext(StatusContext);

  // collectionName16Decoder(collection.Name);
  // collectionName16Decoder(collection.Description)
  // hex2a(collectionInfo.TokenPrefix)
  // collectionInfo.Sponsor
  // confirmSponsorship(collection_id)
  // api.query.nft.contractSelfSponsoring(accountId)
  // api.query.nft.contractSponsorBasket(accountId, accountId)
  // api.query.nft.contractOwner(AccountId)
  // const changeAdminTx = api.tx.nft.addCollectionAdmin(collectionId, bob.address);
  // const adminListAfterRemoveAdmin: any = (await api.query.nft.adminList(collectionId));
  // const tx = api.tx.nft.removeCollectionAdmin(collectionId, Alice.address);

  // parseInt((await api.query.nft.createdCollectionCount()).toString(), 10);
  // api.tx.nft.createCollection(strToUTF16(name), strToUTF16(description), strToUTF16(tokenPrefix), modeprm);

  const getCollectionTokensCount = useCallback(async (collectionId: string) => {
    if (!api || !collectionId) {
      return [];
    }

    try {
      return await api.query.nft.itemListIndex(collectionId);
    } catch (e) {
      console.log('getTokensOfCollection error', e);
    }

    return 0;
  }, [api]);

  const createCollection = useCallback(({ account, description, modeprm, name, tokenPrefix }: { account: string, name: string, description: string, tokenPrefix: string, modeprm?: string }) => {
    const transaction = api.tx.nft.createCollection(strToUTF16(name), strToUTF16(description), strToUTF16(tokenPrefix), modeprm);

    queueExtrinsic({
      accountId: account && account.toString(),
      extrinsic: transaction,
      isUnsigned: false,
      txFailedCb: () => { console.log('create collection failed'); },
      txStartCb: () => { console.log('create collection start'); },
      txSuccessCb: () => { console.log('create collection success'); },
      txUpdateCb: () => { console.log('create collection update'); }
    });
  }, [api, queueExtrinsic]);

  const getDetailedCollectionInfo = useCallback(async (collectionId: string) => {
    if (!api) {
      return null;
    }

    try {
      const collectionInfo = (await api.query.nft.collectionById(collectionId)).toJSON() as unknown as NftCollectionInterface;

      return {
        ...collectionInfo,
        id: collectionId
      };
    } catch (e) {
      console.log('getDetailedCollectionInfo error', e);
    }

    return {};
  }, [api]);

  const getTokensOfCollection = useCallback(async (collectionId: string, ownerId: string) => {
    if (!api || !collectionId || !ownerId) {
      return [];
    }

    try {
      return await api.query.nft.addressTokens(collectionId, ownerId);
    } catch (e) {
      console.log('getTokensOfCollection error', e);
    }

    return [];
  }, [api]);

  return {
    createCollection,
    getCollectionTokensCount,
    getDetailedCollectionInfo,
    getTokensOfCollection
  };
}
