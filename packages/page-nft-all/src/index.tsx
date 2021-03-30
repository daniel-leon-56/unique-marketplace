// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

// external imports
import React, { useState } from 'react';
import { Route, Switch } from 'react-router';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header/Header';

import { NftDetails } from '@polkadot/react-components';
// local imports and components
import { AppProps as Props } from '@polkadot/react-components/types';
import { useRegistry } from '@polkadot/react-hooks';

import AllNfts from './containers/AllNfts';

function App ({ account, basePath }: Props): React.ReactElement<Props> {
  const localRegistry = useRegistry();
  const [shouldUpdateTokens, setShouldUpdateTokens] = useState<string>();

  return (
    <>
      <Header as='h1'>All Tokens</Header>
      <Switch>
        <Route path={`${basePath}/token-details`}>
          <NftDetails
            account={account || ''}
            localRegistry={localRegistry}
            setShouldUpdateTokens={setShouldUpdateTokens}
          />
        </Route>
        <Route path={basePath}>
          <AllNfts
            account={account}
            localRegistry={localRegistry}
            setShouldUpdateTokens={setShouldUpdateTokens}
            shouldUpdateTokens={shouldUpdateTokens}
          />
        </Route>
      </Switch>
    </>
  );
}

export default React.memo(App);
