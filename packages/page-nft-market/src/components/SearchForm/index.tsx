// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import Form from 'semantic-ui-react/dist/commonjs/collections/Form';
import Loader from 'semantic-ui-react/dist/commonjs/elements/Loader';
import Dropdown, { DropdownProps } from 'semantic-ui-react/dist/commonjs/modules/Dropdown';

import ArrowDown from '@polkadot/app-nft-market/components/arrowDown';
import ArrowUp from '@polkadot/app-nft-market/components/arrowUp';
import { Filters } from '@polkadot/app-nft-market/containers/NftMarket';
import clearIcon from '@polkadot/app-nft-wallet/components/CollectionSearch/clearIcon.svg';
import searchIcon from '@polkadot/app-nft-wallet/components/CollectionSearch/searchIcon.svg';
import envConfig from '@polkadot/apps-config/envConfig';
import { Input } from '@polkadot/react-components';
import {sessionStorageKeys} from "@polkadot/app-nft-market/containers/marketFilters/constants";

const defaultFilters = {
  collectionIds: [...envConfig.uniqueCollectionIds],
  sort: 'desc(creationDate)',
  traitsCount: []
};

export type SearchFormProps = {
  filters: Filters;
  offersCount?: number;
  offersLoading: boolean;
  setFilters: (filters: Filters) => void | ((prevFilters: Filters) => Filters) ;
  setAllowClearCollections: (allow: boolean) => void;
  setAllowClearPricesAndSeller: (allow: boolean) => void;
}

const SearchForm = (props: SearchFormProps) => {
  const { filters, offersCount, offersLoading, setAllowClearCollections, setAllowClearPricesAndSeller,setFilters } = props;
  const [searchString, setSearchString] = useState<string>('');
  const [sortValue, setSortValue] = useState<string>('creationDate-desc');

  const clearSearch = useCallback(() => {
    setSearchString('');
  }, []);

  const optionNode = useCallback((active: boolean, order: string, text: string) => {
    return (
      <div className={active ? 'current active' : 'current'}>
        {text}
        {order === 'asc' && (
          <ArrowUp active={active} />
        )}
        {order === 'desc' && (
          <ArrowDown active={active} />
        )}
      </div>
    );
  }, []);

  const sortOptions = useMemo(() => ([
    { content: (optionNode(false, 'asc', 'Price')), key: 'PriceUp', text: 'Price', value: 'price-asc' },
    { content: (optionNode(false, 'desc', 'Price')), key: 'PriceDown', text: 'Price', value: 'price-desc' },
    { content: (optionNode(false, 'asc', 'Token ID')), key: 'TokenIDUp', text: 'Token ID', value: 'tokenId-asc' },
    { content: (optionNode(false, 'desc', 'Token ID')), key: 'TokenIDDown', text: 'Token ID', value: 'tokenId-desc' },
    { content: (optionNode(false, 'asc', 'Listing date')), key: 'ListingDateUp', text: 'Listing date', value: 'creationDate-asc' },
    { content: (optionNode(false, 'desc', 'Listing date')), key: 'ListingDateDown', text: 'Listing date', value: 'creationDate-desc' }
  ]), [optionNode]);

  const setSort = useCallback((event: React.SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
    const { value } = data;

    setSortValue(value?.toString() || 'creationDate-desc');

    if (value && filters) {
      setFilters({ ...filters, sort: `${value.toString().split('-')[1]}(${value.toString().split('-')[0]})` });
    }
  }, [filters, setFilters]);

  const currentValue = useMemo(() => {
    if (sortValue) {
      const currentOption = sortOptions.find((opt: { value: string }) => opt.value === sortValue);

      if (currentOption) {
        return optionNode(false, sortValue.split('-')[1], currentOption.text);
      }
    }

    return optionNode(false, 'none', 'Sort by');
  }, [optionNode, sortOptions, sortValue]);

  const clearAllFilters = useCallback(() => {
    setAllowClearCollections(true);
    setAllowClearPricesAndSeller(true);
    setFilters(defaultFilters);
    setSearchString('');

    sessionStorage.removeItem(sessionStorageKeys.FILTERS)
    sessionStorage.removeItem(sessionStorageKeys.PRICES)
  }, [setAllowClearCollections, setFilters]);

  const setSortByFilter = useCallback(() => {
    const sort = filters.sort;

    // desc(creationDate)
    if (sort.includes('(') && sort.includes(')')) {
      const sortString = sort.replace(')', '').replace('(', '-');
      const sortArr = sortString.split('-');

      // 'creationDate-desc'
      setSortValue(`${sortArr[1]}-${sortArr[0]}`);
    } else {
      console.log('something wrong with sort filer');
    }
  }, [filters]);

  useEffect(() => {
    setSortByFilter();
  }, [setSortByFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setFilters((prevFilters: Filters) => {
        if (searchString) {
          return { ...prevFilters, searchLocale: 'en', searchText: searchString };
        } else {
          const newFilters: Filters = { ...prevFilters };

          delete newFilters.searchLocale;
          delete newFilters.searchText;

          return newFilters;
        }
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [searchString, setFilters]);

  return (
    <Form>
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
          onChange={setSearchString}
          placeholder='Search for tokens or attributes'
          value={searchString}
          withLabel
        >
          { offersLoading && (
            <Loader
              active
              inline='centered'
              key='offers-loading'
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
      <Form.Field className='sort-field'>
        <Dropdown
          onChange={setSort}
          options={sortOptions}
          trigger={currentValue}
        />
      </Form.Field>
      <Form.Field className='search-results'>
        <span>
          {offersCount} items
        </span>
        <a onClick={clearAllFilters}>Clear all filters</a>
      </Form.Field>
    </Form>
  );
};

export default memo(SearchForm);
