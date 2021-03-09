// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './NftTokenCard.scss';

import type { NftCollectionInterface } from '@polkadot/react-hooks/useCollections';

import React, { useCallback } from 'react';
import { useHistory } from 'react-router';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button/Button';
import Item from 'semantic-ui-react/dist/commonjs/views/Item';

import { useSchema } from '@polkadot/react-hooks';

interface Props {
  account: string;
  canTransferTokens: boolean;
  collection: NftCollectionInterface;
  openTransferModal: (collection: NftCollectionInterface, tokenId: string, balance: number) => void;
  shouldUpdateTokens: string | undefined;
  token: string;
}

function NftTokenCard ({ account, canTransferTokens, collection, openTransferModal, token }: Props): React.ReactElement<Props> {
  const { attributes, reFungibleBalance, tokenUrl } = useSchema(account, collection.id, token);
  const history = useHistory();

  const openDetailedInformationModal = useCallback((collectionId: string | number, tokenId: string) => {
    history.push(`/wallet/token-details?collectionId=${collectionId}&tokenId=${tokenId}`);
  }, [history]);

  if (!reFungibleBalance && collection?.Mode?.isReFungible) {
    return <></>;
  }

  return (
    <tr
      className='token-row'
      key={token}
    >
      <td className='token-image'>
        <a onClick={openDetailedInformationModal.bind(null, collection.id, token)}>
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
          Balance: {reFungibleBalance}
        </td>
      )}
      { attributes && Object.values(attributes).length > 0 && (
        <td className='token-balance'>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
          Attributes: {Object.keys(attributes).map((attrKey) => (<span key={attrKey}>{attrKey}: {attributes[attrKey]}</span>))}
        </td>
      )}
      <td className='token-actions'>
        <Button
          disabled={!canTransferTokens}
          onClick={openTransferModal.bind(null, collection, token, reFungibleBalance)}
          primary
        >
          Transfer token
        </Button>
      </td>
    </tr>
  );
}

export default React.memo(NftTokenCard);
