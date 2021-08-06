// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, {memo, useCallback} from 'react';
import { NavLink } from 'react-router-dom';

import AccountName from '@polkadot/react-components/AccountName';
import IdentityIcon from '@polkadot/react-components/IdentityIcon';
import { useAccounts } from '@polkadot/react-hooks';

import infoBlue from './images/infoBlue.svg';

interface Props {
  account?: string;
  setAccount: (account?: string) => void;
  setIsMobileMenu: (menu: string) => void;
}

const ManageAccounts = (props: Props): React.ReactElement<Props> => {
  const { setAccount, setIsMobileMenu } = props;
  const { allAccounts } = useAccounts();

  const onSelectAccount = useCallback((address: string) => {
    setAccount(address);
    setIsMobileMenu('none');
  }, [setAccount, setIsMobileMenu]);

  return (
    <div className='manage-accounts'>
      <NavLink
        className='manage-accounts--link'
        exact={true}
        strict={true}
        to={'/accounts'}
      >
        Manage accounts
      </NavLink>
      <header>Choose the account</header>
      <div className='accounts-list'>
        { allAccounts?.map((address: string) => (
          <div
            className='account-item'
            key={address}
          >
            <IdentityIcon
              className='icon'
              value={address}
            />
            <div
              className='account-item--name'
              onClick={onSelectAccount.bind(null, address)}
            >
              <div className='name'>
                <AccountName value={address} />
              </div>
              <div className='address'>
                {address}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className='accounts-footer'>
        <div className='info-panel'>
          <img
            alt='info'
            src={infoBlue as string}
          />
          Click on image to copy the address
        </div>
      </div>
    </div>
  );
};

export default memo(ManageAccounts);
