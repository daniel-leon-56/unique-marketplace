// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

import type { NftCollectionInterface } from '@polkadot/react-hooks/useCollection';
import type { OfferType } from '@polkadot/react-hooks/useCollections';

// external imports
import React, { memo, ReactElement, useCallback, useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { useHistory } from 'react-router';
// import Form from 'semantic-ui-react/dist/commonjs/collections/Form';
import Grid from 'semantic-ui-react/dist/commonjs/collections/Grid';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header';
import Loader from 'semantic-ui-react/dist/commonjs/elements/Loader';

// import clearIcon from '@polkadot/app-nft-wallet/components/CollectionSearch/clearIcon.svg';
// import searchIcon from '@polkadot/app-nft-wallet/components/CollectionSearch/searchIcon.svg';
import envConfig from '@polkadot/apps-config/envConfig';
// import { Input } from '@polkadot/react-components';
import { useCollections, useDecoder } from '@polkadot/react-hooks';
import { AttributesDecoded } from '@polkadot/react-hooks/useSchema';

// local imports and components
import NftTokenCard from '../../components/NftTokenCard';
import FilterContainer from '../market_filters/filter_container';

// let { uniqueCollectionIds } = envConfig;

interface BuyTokensProps {
  account?: string;
  setShouldUpdateTokens: (value?: string) => void;
  shouldUpdateTokens?: string;
}

interface OfferWithAttributes {
  [collectionId: string]: {[tokenId: string]: AttributesDecoded}
}

const perPage = 20;

const BuyTokens = ({ account, setShouldUpdateTokens, shouldUpdateTokens }: BuyTokensProps): ReactElement => {
  const history = useHistory();
  // const { getOffers, offers, offersCount, offersLoading, presetCollections } = useCollections();
  const { getOffers, offers, offersCount, presetCollections } = useCollections();
  // const [searchString, setSearchString] = useState<string>('');
  const [uniqueCollectionIds, setSniqueCollectionIds] = useState(envConfig.uniqueCollectionIds);
  const [searchString] = useState<string>('');
  const [offersWithAttributes, setOffersWithAttributes] = useState<OfferWithAttributes>({});
  const [collectionsNames, setCollectionsNames] = useState<{ [key: string]: string }>({});
  const [collections, setCollections] = useState<NftCollectionInterface[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<OfferType[]>([]);
  const { collectionName16Decoder } = useDecoder();
  const hasMore = !!(offers && offersCount) && Object.keys(offers).length < offersCount;
  // const [filteredCollection, setFilteredCollection] = useState<any>([]);
  const openDetailedInformationModal = useCallback((collectionId: string, tokenId: string) => {
    history.push(`/market/token-details?collectionId=${collectionId}&tokenId=${tokenId}`);
  }, [history]);

  const changeuniqueCollectionIds = (newIds: string[]) => {
    setSniqueCollectionIds(newIds);
  };

  const addMintCollectionToList = useCallback(async () => {
    const firstCollections: NftCollectionInterface[] = await presetCollections();

    setCollections(() => [...firstCollections]);
  }, [presetCollections]);

  const onSetTokenAttributes = useCallback((collectionId: string, tokenId: string, attributes: AttributesDecoded) => {
    setOffersWithAttributes((prevOffers: OfferWithAttributes) => {
      const newOffers = { ...prevOffers };

      if (newOffers[collectionId]) {
        newOffers[collectionId][tokenId] = attributes;
      } else {
        newOffers[collectionId] = { [tokenId]: attributes };
      }

      return newOffers;
    });
  }, []);

  const onSetCollectionName = useCallback((collectionId: string, collectionName: string) => {
    setCollectionsNames((prevState) => ({
      ...prevState,
      [collectionId]: collectionName
    }));
  }, []);

  const fetchData = useCallback((newPage: number) => {
    getOffers(newPage, perPage, uniqueCollectionIds);
  }, [getOffers, uniqueCollectionIds]);

  useEffect(() => {
    if (offers) {
      if (searchString && searchString.length) {
        const filtered = Object.values(offers).filter((item: OfferType) => {
          let target: string | undefined | string[];

          if (offersWithAttributes[item.collectionId] && offersWithAttributes[item.collectionId][item.tokenId]) {
            const offerItemAttrs = offersWithAttributes[item.collectionId][item.tokenId];

            target = Object.values(offerItemAttrs).find((value: string | string[]) => {
              if (Array.isArray(value)) {
                return value.find((valItem: string) => valItem.toLowerCase().includes(searchString.toLowerCase()));
              }

              return value.toLowerCase().includes(searchString.toLowerCase());
            });
          }

          return target ||
            item.price.toString().includes(searchString.toLowerCase()) ||
            (collectionsNames[item.collectionId]?.toLowerCase().includes(searchString.toLowerCase())) ||
            item.tokenId.toString().includes(searchString.toLowerCase()) ||
            item.collectionId.toString().includes(searchString.toLowerCase());
        });

        setFilteredOffers(filtered);
      } else {
        setFilteredOffers(Object.values(offers));
      }
    }
  }, [collectionsNames, offers, offersWithAttributes, searchString]);
  /* const clearSearch = useCallback(() => {
    setSearchString('');
  }, []); */

  useEffect(() => {
    if (shouldUpdateTokens) {
      setShouldUpdateTokens(undefined);
    }

    void getOffers(1, perPage, uniqueCollectionIds);
  }, [getOffers, shouldUpdateTokens, setShouldUpdateTokens, uniqueCollectionIds]);

  useEffect(() => {
    void addMintCollectionToList();
  }, [addMintCollectionToList]);

  useEffect(() => {
    setShouldUpdateTokens('all');
  }, [setShouldUpdateTokens]);

  return (
    <div className='nft-market'>
      <Header as='h1'>Market</Header>
      <Grid>
        <Grid.Row>
          <Grid.Column width={4}>

            <FilterContainer
              changeuniqueCollectionIds={changeuniqueCollectionIds}
              collections={collections}
              filteredOffers={filteredOffers}
            />
            {/* <Input
              className='isSmall search'
              help={<span>Find and select tokens collection.</span>}
              isDisabled={!offers || !offers.length}
              label={'Find collection by name'}
              onChange={setSearchString}
              placeholder='Find collection by name or id'
              value={searchString}
              withLabel
            /> */}

          </Grid.Column>
          <Grid.Column width={12}>
            <Grid>
              {/* <Grid.Row>
                <Grid.Column width={16}>
                  <Form className='collection-search-form'>
                    <Input
                      className='isSmall search'
                      help={<span>Find and select token.</span>}
                      isDisabled={!offers || !Object.values(offers).length}
                      label={'Find token by name or collection'}
                      onChange={setSearchString}
                      placeholder='Search...'
                      value={searchString}
                      withLabel
                    />
                    <Form.Field className='search-field'>
                      <Input
                        className='isSmall'
                        icon={
                          <img
                            alt='search'
                            className='search-icon'
                            src={searchIcon as string}
                          />
                        }
                        isDisabled={!Object.values(offers).length}
                        onChange={setSearchString}
                        placeholder='Find token by collection, name or attribute'
                        value={searchString}
                        withLabel
                      >
                        { offersLoading && (
                          <Loader
                            active
                            inline='centered'
                          />
                        )}
                        { searchString?.length > 0 && (
                          <img
                            alt='clear'
                            className='clear-icon'
                            onClick={clearSearch}
                            src={clearIcon as string}
                          />
                        )}
                      </Input>
                    </Form.Field>
                  </Form>
                </Grid.Column>
              </Grid.Row> */}

              {(account && filteredOffers.length > 0) && (
                <Grid.Row>

                  <Grid.Column width={16}>
                    <div className='market-pallet'>
                      <InfiniteScroll
                        hasMore={hasMore}
                        initialLoad={false}
                        loadMore={fetchData}
                        loader={searchString && searchString.length
                          ? <></>
                          : <Loader
                            active
                            className='load-more'
                            inline='centered'
                            key={'nft-market'}
                          />}
                        pageStart={1}
                        threshold={200}
                        useWindow={true}
                      >
                        
                        <div className='market-pallet__item'>

                          {filteredOffers.map((token) => (
                            <NftTokenCard
                              account={account}
                              collectionId={token.collectionId.toString()}
                              key={`${token.collectionId}-${token.tokenId}`}
                              onSetCollectionName={onSetCollectionName}
                              onSetTokenAttributes={onSetTokenAttributes}
                              openDetailedInformationModal={openDetailedInformationModal}
                              token={token}
                            />
                          ))}
                        </div>
                      </InfiniteScroll>
                    </div>
                  </Grid.Column>
                </Grid.Row>
              )}
            </Grid>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
};

export default memo(BuyTokens);
