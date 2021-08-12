// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

import type { NftCollectionInterface } from '@polkadot/react-hooks/useCollection';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header/Header';

import envConfig from '@polkadot/apps-config/envConfig';
import { Table, TransferModal } from '@polkadot/react-components';
import { useCollections } from '@polkadot/react-hooks';

import CollectionSearch from '../../components/CollectionSearch';
import NftCollectionCard from '../../components/NftCollectionCard';

interface NftWalletProps {
  account?: string;
  addCollection: (collection: NftCollectionInterface) => void;
  collections: NftCollectionInterface[];
  removeCollectionFromList: (collectionToRemove: string) => void;
  setCollections: (collections: NftCollectionInterface[]) => void;
}

const { canAddCollections } = envConfig;

function NftWallet ({ account, addCollection, collections, removeCollectionFromList, setCollections }: NftWalletProps): React.ReactElement {
  const [openTransfer, setOpenTransfer] = useState<{ collection: NftCollectionInterface, tokenId: string, balance: number } | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<NftCollectionInterface>();
  const [canTransferTokens] = useState<boolean>(true);
  const [tokensSelling, setTokensSelling] = useState<{ [collectionId: string]: string[] }>({});
  const { getHoldByMe, getOffers, myHold, offers, presetCollections } = useCollections();
  const cleanup = useRef<boolean>(false);
  // prevent component update initialized by parent
  const collectionsString = JSON.stringify(collections);

  const fetchOffersForCollections = useCallback(() => {
    // return usable array form to collections array
    const collectionsArray = JSON.parse(collectionsString) as NftCollectionInterface[];

    if (account && collectionsArray?.length) {
      // collect collections data for expander component and set filters
      const targetCollectionIds = collectionsArray.map((collection) => collection.id);
      const filters = { collectionIds: targetCollectionIds, sort: '', traitsCount: [] };

      getOffers(1, 20000, filters);
      getHoldByMe(account, 1, 20000, targetCollectionIds);
    }
  }, [account, collectionsString, getHoldByMe, getOffers]);

  const filterTokensFromOffers = useCallback(() => {
    if (Object.keys(offers).length) {
      const myOffers = Object.values(offers).filter((offer) => offer.seller === account);

      const tokensSellingByMe: { [collectionId: string]: string[] } = {};

      myOffers.forEach((offer) => {
        if (!tokensSellingByMe[offer.collectionId]) {
          tokensSellingByMe[offer.collectionId] = [offer.tokenId];
        } else {
          tokensSellingByMe[offer.collectionId].push(offer.tokenId);
        }
      });

      setTokensSelling(tokensSellingByMe);
    }
  }, [account, offers]);

  const addMintCollectionToList = useCallback(async () => {
    const firstCollections: NftCollectionInterface[] = await presetCollections();

    if (cleanup.current) {
      return;
    }

    setCollections([...firstCollections]);
  }, [setCollections, presetCollections]);

  const removeCollection = useCallback((collectionToRemove: string) => {
    if (selectedCollection && selectedCollection.id === collectionToRemove) {
      setSelectedCollection(undefined);
    }

    removeCollectionFromList(collectionToRemove);
  }, [removeCollectionFromList, selectedCollection]);

  const openTransferModal = useCallback((collection: NftCollectionInterface, tokenId: string, balance: number) => {
    setOpenTransfer({ balance, collection, tokenId });
  }, []);

  useEffect(() => {
    void addMintCollectionToList();
  }, [addMintCollectionToList]);

  useEffect(() => {
    fetchOffersForCollections();
  }, [fetchOffersForCollections]);

  useEffect(() => {
    filterTokensFromOffers();
  }, [filterTokensFromOffers]);

  useEffect(() => {
    return () => {
      cleanup.current = true;
    };
  }, []);

  return (
    <div className='nft-wallet unique-card'>
      { canAddCollections && (
        <>
          <CollectionSearch
            account={account}
            addCollection={addCollection}
            collections={collections}
          />
          <br />
        </>
      )}
      <Header as='h3'>
        My collections
      </Header>
      { !collections?.length && (
        <div className='empty-label'>
          You haven`t added anything yet. Use the collection search.
        </div>
      )}
      { collections?.length > 0 && (
        <Table
          header={[]}
        >
          { collections.map((collection) => (
            <tr key={collection.id}>
              <td className='overflow'>
                <NftCollectionCard
                  account={account}
                  canTransferTokens={canTransferTokens}
                  collection={collection}
                  onHold={myHold[collection.id] || []}
                  openTransferModal={openTransferModal}
                  removeCollection={removeCollection}
                  tokensSelling={tokensSelling[collection.id] || []}
                />
              </td>
            </tr>
          ))}
        </Table>
      )}
      { openTransfer && openTransfer.tokenId && openTransfer.collection && (
        <TransferModal
          account={account}
          closeModal={setOpenTransfer.bind(null, null)}
          collection={openTransfer.collection}
          reFungibleBalance={openTransfer.balance}
          tokenId={openTransfer.tokenId}
        />
      )}
    </div>
  );
}

export default React.memo(NftWallet);
