// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

import type { BalanceInterface } from '@polkadot/react-hooks/useBalance';
import type { NftCollectionInterface } from '@polkadot/react-hooks/useCollections';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import Grid from 'semantic-ui-react/dist/commonjs/collections/Grid/Grid';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header/Header';

import CreateModal from '@polkadot/app-accounts/modals/Create';
import ImportModal from '@polkadot/app-accounts/modals/Import';
import Qr from '@polkadot/app-accounts/modals/Qr';
import { Button, LabelHelp, NftDetailsModal, Table } from '@polkadot/react-components';
import { useBalance, useIpfs, useToggle } from '@polkadot/react-hooks';

import AccountSelector from '../../components/AccountSelector';
import CollectionSearch from '../../components/CollectionSearch';
import FormatBalance from '../../components/FormatBalance';
import NftCollectionCard from '../../components/NftCollectionCard';
import TransferModal from '../../components/TransferModal/';

function NftWallet (): React.ReactElement {
  const collectionsStorage: NftCollectionInterface[] = JSON.parse(localStorage.getItem('tokenCollections') || '[]') as NftCollectionInterface[];
  const [openTransfer, setOpenTransfer] = useState<{ collection: NftCollectionInterface, tokenId: string, balance: number } | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [shouldUpdateTokens, setShouldUpdateTokens] = useState<string>();
  const [collections, setCollections] = useState<NftCollectionInterface[]>(collectionsStorage);
  const [selectedCollection, setSelectedCollection] = useState<NftCollectionInterface>();
  const [canTransferTokens] = useState<boolean>(true);
  const { balance }: { balance: BalanceInterface | null } = useBalance(account);
  const { isIpfs } = useIpfs();
  const [isQrOpen, toggleQr] = useToggle();
  const [isCreateOpen, toggleCreate] = useToggle();
  const [isImportOpen, toggleImport] = useToggle();
  const currentAccount = useRef<string | null | undefined>();

  const addCollection = useCallback((collection: NftCollectionInterface) => {
    setCollections((prevCollections: NftCollectionInterface[]) => [...prevCollections, collection]);
  }, []);

  const removeCollection = useCallback((collectionToRemove) => {
    if (selectedCollection && selectedCollection.id === collectionToRemove) {
      setSelectedCollection(undefined);
    }

    setCollections(collections.filter((item: NftCollectionInterface) => item.id !== collectionToRemove));
  }, [collections, selectedCollection]);

  const openTransferModal = useCallback((collection: NftCollectionInterface, tokenId: string, balance: number) => {
    setOpenTransfer({ balance, collection, tokenId });
  }, []);

  const updateTokens = useCallback((collectionId) => {
    setShouldUpdateTokens(collectionId);
  }, []);

  const onSetAccount = useCallback((account: string) => {
    setAccount(account);
    setShouldUpdateTokens('all');
  }, []);

  const onStatusChange = useCallback(() => {
    console.log('onStatusChange');
  }, []);

  useEffect(() => {
    currentAccount.current = account;
  }, [account]);

  useEffect(() => {
    localStorage.setItem('tokenCollections', JSON.stringify(collections));
  }, [collections]);

  return (
    <div className='nft-wallet'>
      <Header as='h1'>Usetech NFT wallet</Header>
      <Header as='h2'>Account</Header>
      <Grid className='account-selector'>
        <Grid.Row>
          <Grid.Column width={12}>
            <AccountSelector onChange={onSetAccount} />
          </Grid.Column>
          <Grid.Column width={4}>
            { balance && (
              <div className='balance-block'>
                <label>Your account balance is:</label>
                <FormatBalance
                  className='balance'
                  value={balance.free}
                />
              </div>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Button.Group>
        <Button
          icon='plus'
          isDisabled={isIpfs}
          label='Add account'
          onClick={toggleCreate}
        />
        <Button
          icon='sync'
          isDisabled={isIpfs}
          label='Restore JSON'
          onClick={toggleImport}
        />
        <Button
          icon='qrcode'
          label='Add via Qr'
          onClick={toggleQr}
        />
      </Button.Group>
      <CollectionSearch
        account={account}
        addCollection={addCollection}
        collections={collections}
      />
      <br />
      <Header as='h2'>
        My collections
        <LabelHelp
          className='small-help'
          help={'Your tokens are here'}
        />
      </Header>
      <Table
        empty={'No collections added'}
        header={[]}
      >
        { collections.map((collection) => (
          <tr key={collection.id}>
            <td className='overflow'>
              <NftCollectionCard
                account={account}
                canTransferTokens={canTransferTokens}
                collection={collection}
                openTransferModal={openTransferModal}
                removeCollection={removeCollection}
                shouldUpdateTokens={shouldUpdateTokens}
              />
            </td>
          </tr>
        ))}
      </Table>
      { openTransfer && openTransfer.tokenId && openTransfer.collection && (
        <TransferModal
          account={account}
          balance={openTransfer.balance}
          canTransferTokens={canTransferTokens}
          closeModal={setOpenTransfer.bind(null, null)}
          collection={openTransfer.collection}
          tokenId={openTransfer.tokenId}
          updateTokens={updateTokens}
        />
      )}
      {isCreateOpen && (
        <CreateModal
          onClose={toggleCreate}
          onStatusChange={onStatusChange}
        />
      )}
      {isImportOpen && (
        <ImportModal
          onClose={toggleImport}
          onStatusChange={onStatusChange}
        />
      )}
      {isQrOpen && (
        <Qr
          onClose={toggleQr}
          onStatusChange={onStatusChange}
        />
      )}
      { account && (
        <Switch>
          <Route
            key='TokenDetailsModal'
            path='*/token-details'
          >
            <NftDetailsModal
              account={account}
              setShouldUpdateTokens={setShouldUpdateTokens}
            />
          </Route>
        </Switch>
      )}
    </div>
  );
}

export default React.memo(NftWallet);
