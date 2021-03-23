// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

// external imports
import React from 'react';
import { Route, Switch } from 'react-router';

// local imports and components
import { AppProps as Props } from '@polkadot/react-components/types';

import NftWallet from './containers/NftWallet';

function App ({ account, basePath }: Props): React.ReactElement<Props> {
  return (
    <main className='nft--App'>
      <Switch>
        <Route path={basePath}>
          <NftWallet account={account} />
        </Route>
      </Switch>
    </main>
  );
}

export default React.memo(App);
