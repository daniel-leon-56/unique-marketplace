// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './NftTokenCard.scss';

import BN from 'bn.js';
import React, { useCallback, useEffect, useState } from 'react';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button/Button';
import Item from 'semantic-ui-react/dist/commonjs/views/Item';

import { NftCollectionInterface } from '@polkadot/react-hooks';

import useSchema from '../../hooks/useSchema';

interface Props {
  account: string;
  canTransferTokens: boolean;
  collection: NftCollectionInterface;
  openTransferModal: (collection: NftCollectionInterface, tokenId: string, balance: number) => void;
  openDetailedInformationModal: (collection: NftCollectionInterface, tokenId: string) => void;
  shouldUpdateTokens: number | null;
  token: string;
}

function NftTokenCard ({ account, collection, openDetailedInformationModal, token }: Props): React.ReactElement<Props> {
  const { attributes, balance, tokenUrl } = useSchema(account, collection.id, token);

  if (!balance && collection && collection.Mode.isReFungible) {
    return <></>;
  }

  return (
    <tr
      className='token-row'
      key={token}
    >
      <td className='token-image'>
        <a onClick={openDetailedInformationModal.bind(null, collection, token)}>
          <Item.Image
            size='mini'
            src={tokenUrl}
          />
        </a>
      </td>
      <td className='token-name'>
        #{token.toString()}
      </td>
      { collection && collection.Mode.isReFungible && (
        <td className='token-balance'>
          Balance: {balance}
        </td>
      )}
      { attributes && Object.values(attributes).length > 0 && (
        <td className='token-balance'>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
          Attributes: {Object.keys(attributes).map((attrKey) => (<span key={attrKey}>{attrKey}: {attributes[attrKey]}</span>))}
        </td>
      )}
    </tr>
  );
}

export default React.memo(NftTokenCard);
