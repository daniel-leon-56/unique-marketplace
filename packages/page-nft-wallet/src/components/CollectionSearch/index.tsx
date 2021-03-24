// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './CollectionSearch.scss';

import type { NftCollectionInterface } from '@polkadot/react-hooks/useCollections';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Form from 'semantic-ui-react/dist/commonjs/collections/Form';
import Grid from 'semantic-ui-react/dist/commonjs/collections/Grid';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header';

import { Button, Input, Label, LabelHelp, Table } from '@polkadot/react-components';
import { useCollections, useDecoder } from '@polkadot/react-hooks';

interface Props {
  account: string | null | undefined;
  addCollection: (item: NftCollectionInterface) => void;
  collections: NftCollectionInterface[];
}

function CollectionSearch ({ account, addCollection, collections }: Props): React.ReactElement<Props> {
  const [collectionsAvailable, setCollectionsAvailable] = useState<Array<NftCollectionInterface>>([]);
  const [collectionsMatched, setCollectionsMatched] = useState<Array<NftCollectionInterface>>([]);
  const [searchString, setSearchString] = useState<string>('');
  const { presetTokensCollections } = useCollections();
  const currentAccount = useRef<string | null | undefined>();
  const { collectionName16Decoder } = useDecoder();

  const searchCollection = useCallback(() => {
    const filteredCollections = collectionsAvailable.filter((collection) => {
      const collectionName = collectionName16Decoder(collection.Name).toLowerCase();

      if (collectionName.indexOf(searchString.toLowerCase()) !== -1 || collection.id.toString().toLowerCase().indexOf(searchString.toLowerCase()) !== -1
      ) {
        return collection;
      }

      return null;
    });

    setCollectionsMatched(filteredCollections);
  }, [collectionName16Decoder, collectionsAvailable, searchString]);

  const hasThisCollection = useCallback((collectionInfo: NftCollectionInterface) => {
    return !!collections.find((collection: NftCollectionInterface) => collection.id === collectionInfo.id);
  }, [collections]);

  const addCollectionToAccount = useCallback((item: NftCollectionInterface) => {
    addCollection({
      ...item,
      DecimalPoints: item.DecimalPoints,
      Description: item.Description,
      Name: item.Name,
      OffchainSchema: item.OffchainSchema,
      TokenPrefix: item.TokenPrefix,
      id: item.id
    });
  }, [addCollection]);

  const getCollections = useCallback(async () => {
    const collections = await presetTokensCollections();

    if (collections && collections.length) {
      setCollectionsAvailable(collections);
    }
  }, [presetTokensCollections]);

  // clear search results if account changed
  useEffect(() => {
    if (currentAccount.current && currentAccount.current !== account) {
      setCollectionsMatched([]);
      setSearchString('');
    }

    currentAccount.current = account;
  }, [account]);

  useEffect(() => {
    void getCollections();
  }, [getCollections]);

  return (
    <>
      <Header as='h2'>
        Find token collection
        <LabelHelp
          className='small-help'
          help={'Enter the collection number or name'}
        />
      </Header>
      <Form
        className='collection-search'
        onSubmit={searchCollection}
      >
        <Grid>
          { account && (
            <Grid.Row>
              <Grid.Column width={16}>
                <Form.Field>
                  <Input
                    className='isSmall'
                    isDisabled={!collectionsAvailable.length}
                    label={<span>Find and add your token collection. For example, you can add tokens from <a href='https://ipfs-gateway.usetech.com/ipns/QmaMtDqE9nhMX9RQLTpaCboqg7bqkb6Gi67iCKMe8NDpCE/'
                      rel='noopener noreferrer'
                      target='_blank'>SubstraPunks</a></span>}
                    onChange={setSearchString}
                    placeholder='Search...'
                    value={searchString}
                    withLabel
                  >
                    <Button
                      icon='play'
                      onClick={searchCollection}
                    />
                  </Input>
                </Form.Field>
              </Grid.Column>
            </Grid.Row>
          )}
          <Label
            className='small-help-label'
            help={'Add the collection you want'}
            label={'Search results'}
          />
          <Table
            empty={'No results'}
            header={[]}
          >
            {collectionsMatched.map((item) => (
              <tr
                className='collection-row'
                key={item.id}
              >
                <td className='collection-name'>
                  Collection name: <strong>{collectionName16Decoder(item.Name)}</strong>
                </td>
                <td className='collection-actions'>
                  <Button
                    icon='plus'
                    isBasic
                    isDisabled={hasThisCollection(item)}
                    label='Add collection'
                    onClick={addCollectionToAccount.bind(null, item)}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </Grid>
      </Form>
    </>
  );
}

export default React.memo(CollectionSearch);
