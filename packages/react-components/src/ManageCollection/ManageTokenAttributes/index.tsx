// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

import type { AttributeItemType, ProtobufAttributeType } from '@polkadot/react-components/util/protobufUtils';
import type { TokenDetailsInterface } from '@polkadot/react-hooks/useToken';

import React, { memo, useCallback, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { useLocation } from 'react-router-dom';
import Form from 'semantic-ui-react/dist/commonjs/collections/Form';
import Grid from 'semantic-ui-react/dist/commonjs/collections/Grid';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header';
import Image from 'semantic-ui-react/dist/commonjs/elements/Image';

import { Dropdown, Input } from '@polkadot/react-components';
import arrowLeft from '@polkadot/react-components/NftDetails/arrowLeft.svg';
import { deserializeNft, fillAttributes, serializeNft } from '@polkadot/react-components/util/protobufUtils';
import { useCollection, useToken } from '@polkadot/react-hooks';
import { NftCollectionInterface } from '@polkadot/react-hooks/useCollection';

export type TokenAttribute = {
  name: string;
  value?: string | number;
  values?: number[];
}

interface Props {
  account?: string;
  setShouldUpdateTokens?: (collectionId: string) => void;
}

function ManageTokenAttributes ({ account, setShouldUpdateTokens }: Props): React.ReactElement<Props> {
  const query = new URLSearchParams(useLocation().search);
  const tokenId = query.get('tokenId') || '';
  const collectionId = query.get('collectionId') || '';
  const history = useHistory();
  const { getCollectionAdminList, getCollectionOnChainSchema, getCollectionTokensCount, getDetailedCollectionInfo } = useCollection();
  const { createNft, getDetailedTokenInfo, setVariableMetadata } = useToken();
  const [tokenConstAttributes, setTokenConstAttributes] = useState<{ [key: string]: TokenAttribute }>({});
  const [tokenVarAttributes, setTokenVarAttributes] = useState<{ [key: string]: TokenAttribute }>({});
  const [collectionInfo, setCollectionInfo] = useState<NftCollectionInterface>();
  const [tokenInfo, setTokenInfo] = useState<TokenDetailsInterface>();
  const [constOnChainSchema, setConstOnChainSchema] = useState<ProtobufAttributeType>();
  const [variableOnChainSchema, setVariableOnChainSchema] = useState<ProtobufAttributeType>();
  const [constAttributes, setConstAttributes] = useState<AttributeItemType[]>([]);
  const [variableAttributes, setVariableAttributes] = useState<AttributeItemType[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [collectionAdminList, setCollectionAdminList] = useState<string[]>([]);

  const fetchCollectionAndTokenInfo = useCallback(async () => {
    // collectionInfo.SchemaVersion.isImageUrl
    try {
      if (collectionId) {
        const info: NftCollectionInterface = (await getDetailedCollectionInfo(collectionId)) as NftCollectionInterface;

        setCollectionInfo(info);

        if (tokenId) {
          const tokenInfo: TokenDetailsInterface = (await getDetailedTokenInfo(collectionId, tokenId));

          setTokenInfo(tokenInfo);
        }

        const onChainSchema = getCollectionOnChainSchema(info);

        if (onChainSchema) {
          const { constSchema, variableSchema } = onChainSchema;

          if (constSchema) {
            setConstOnChainSchema(constSchema);
          }

          if (variableSchema) {
            setVariableOnChainSchema(variableSchema);
          }
        }
      }
    } catch (e) {
      console.log('fetchCollectionAndTokenInfo error', e);
    }
  }, [collectionId, getDetailedCollectionInfo, getCollectionOnChainSchema, getDetailedTokenInfo, tokenId]);

  const setAttributeValue = useCallback((type: 'const' | 'var', attribute: AttributeItemType, value: string | number[]) => {
    console.log('value', value, 'type', type, 'attribute', attribute);

    if (type === 'const') {
      setTokenConstAttributes((prevAttributes: { [key: string]: TokenAttribute }) =>
        ({ ...prevAttributes,
          [attribute.name]: {
            name: prevAttributes[attribute.name].name,
            value: attribute.rule === 'repeated' ? prevAttributes[attribute.name].value : value as string,
            values: attribute.rule === 'repeated' ? value as number[] : prevAttributes[attribute.name].values
          } }));
    }

    if (type === 'var') {
      setTokenVarAttributes((prevAttributes: { [key: string]: TokenAttribute }) =>
        ({ ...prevAttributes,
          [attribute.name]: {
            name: prevAttributes[attribute.name].name,
            value: attribute.rule === 'repeated' ? prevAttributes[attribute.name].value : value as string,
            values: attribute.rule === 'repeated' ? value as number[] : prevAttributes[attribute.name].values
          } }));
    }
  }, []);

  const presetAttributesFromArray = useCallback((attributes: AttributeItemType[], callBack: (attrs: { [key: string]: TokenAttribute }) => void) => {
    try {
      const tokenAttributes: { [key: string]: TokenAttribute } = {};

      attributes?.forEach((attribute) => {
        tokenAttributes[attribute.name] = {
          name: attribute.name,
          value: '',
          values: []
        };
      });

      callBack(tokenAttributes);
    } catch (e) {
      console.log('presetAttributesFromArray error', e);
    }
  }, []);

  const presetTokenAttributes = useCallback(() => {
    if (constOnChainSchema) {
      setConstAttributes(fillAttributes(constOnChainSchema));
    }

    if (variableOnChainSchema) {
      setVariableAttributes(fillAttributes(variableOnChainSchema));
    }
  }, [constOnChainSchema, variableOnChainSchema]);

  const fetchCollectionAdminList = useCallback(async () => {
    if (collectionId) {
      const adminList = await getCollectionAdminList(collectionId) as string[];

      setCollectionAdminList(adminList || []);
    }
  }, [collectionId, getCollectionAdminList]);

  const resetTokenPage = useCallback(async () => {
    if (collectionId) {
      const tokensCount = await getCollectionTokensCount(collectionId);
      const lastTokenNumber = parseFloat(tokensCount.toString());

      history.push(`/wallet/manage-token?collectionId=${collectionId}&tokenId=${lastTokenNumber}`);
    }
  }, [collectionId, getCollectionTokensCount, history]);

  const onSave = useCallback(() => {
    if (account) {
      const constAttributes: { [key: string]: string | number | number[] } = {};
      const varAttributes: { [key: string]: string | number | number[] } = {};
      let constData = '';
      let variableData = '';

      if (constOnChainSchema && !tokenId) {
        Object.keys(tokenConstAttributes).forEach((key: string) => {
          constAttributes[tokenConstAttributes[key].name] = tokenConstAttributes[key].values?.length ? (tokenConstAttributes[key].values as number[]) : (tokenConstAttributes[key].value as string);
        });
        const cData = serializeNft(constOnChainSchema, constAttributes);

        constData = '0x' + Buffer.from(cData).toString('hex');
      }

      if (variableOnChainSchema) {
        Object.keys(tokenVarAttributes).forEach((key: string) => {
          varAttributes[tokenVarAttributes[key].name] = tokenVarAttributes[key].values?.length ? (tokenVarAttributes[key].values as number[]) : (tokenVarAttributes[key].value as string);
        });
        const varData = serializeNft(variableOnChainSchema, varAttributes);

        variableData = '0x' + Buffer.from(varData).toString('hex');
      }

      if (tokenId) {
        setVariableMetadata({ account, collectionId, successCallback: fetchCollectionAndTokenInfo, tokenId, variableData });
      } else {
        createNft({ account, collectionId, constData, owner: account, successCallback: resetTokenPage, variableData });
      }
    }
  }, [account, createNft, collectionId, constOnChainSchema, fetchCollectionAndTokenInfo, resetTokenPage, setVariableMetadata, tokenId, tokenConstAttributes, tokenVarAttributes, variableOnChainSchema]);

  const fillTokenForm = useCallback((schema: ProtobufAttributeType, tokenData: string, callBack: (item: { [key: string]: TokenAttribute }) => void) => {
    if (schema && tokenInfo && tokenData && variableAttributes?.length > 0) {
      const deSerialized = deserializeNft(schema, Buffer.from(tokenData.slice(2), 'hex'), 'en');
      const newVarAttributes: { [key: string]: TokenAttribute } = {};

      Object.keys(deSerialized).forEach((key: string) => {
        if (schema.nested.onChainMetaData.nested[key] && !Array.isArray(deSerialized[key])) {
          const newValue = () => {
            const targetAttribute = variableAttributes
              .find((varAttr) => varAttr.name === key);
            let targetIndex = 0;

            if (targetAttribute) {
              targetIndex = targetAttribute.values.findIndex((targetValue) => targetValue === deSerialized[key]);
            }

            return targetIndex;
          };

          newVarAttributes[key] = {
            name: key,
            value: newValue(),
            values: []
          };
        } else if (Array.isArray(deSerialized[key])) {
          newVarAttributes[key] = {
            name: key,
            value: '',
            values: (deSerialized[key] as string[])
              .map((value: string) => {
                const targetAttribute = variableAttributes
                  .find((varAttr) => varAttr.name === key);

                let targetIndex = 0;

                if (targetAttribute) {
                  targetIndex = targetAttribute.values.findIndex((targetValue) => targetValue === value);
                }

                return targetIndex;
              })
          };
        } else {
          newVarAttributes[key] = {
            name: key,
            value: deSerialized[key] as string,
            values: []
          };
        }
      });

      callBack(newVarAttributes);
    }
  }, [tokenInfo, variableAttributes]);

  const goBack = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShouldUpdateTokens && setShouldUpdateTokens('all');
    history.push('/wallet/');
  }, [history, setShouldUpdateTokens]);

  useEffect(() => {
    if (constAttributes && constAttributes.length) {
      presetAttributesFromArray(constAttributes, setTokenConstAttributes);
    }
  }, [constAttributes, presetAttributesFromArray]);

  useEffect(() => {
    if (variableAttributes && variableAttributes.length && !tokenId) {
      presetAttributesFromArray(variableAttributes, setTokenVarAttributes);
    }
  }, [tokenId, variableAttributes, presetAttributesFromArray]);

  useEffect(() => {
    void fetchCollectionAndTokenInfo();
  }, [fetchCollectionAndTokenInfo]);

  useEffect(() => {
    presetTokenAttributes();
  }, [presetTokenAttributes]);

  useEffect(() => {
    void fetchCollectionAdminList();
  }, [fetchCollectionAdminList]);

  useEffect(() => {
    if (collectionInfo && collectionAdminList) {
      setIsAdmin(!!collectionAdminList.find((address: string) => address.toString() === account) || collectionInfo.Owner === account);
    }
  }, [account, collectionAdminList, collectionInfo]);

  useEffect(() => {
    if (variableOnChainSchema && tokenInfo?.VariableData) {
      fillTokenForm(variableOnChainSchema, tokenInfo.VariableData, setTokenVarAttributes);
    }
  }, [fillTokenForm, tokenInfo, variableOnChainSchema]);

  useEffect(() => {
    if (constOnChainSchema && tokenInfo?.ConstData) {
      fillTokenForm(constOnChainSchema, tokenInfo.ConstData, setTokenConstAttributes);
    }
  }, [constOnChainSchema, fillTokenForm, tokenInfo]);

  /* console.log('info collectionInfo', collectionInfo);
  console.log('info tokenInfo', tokenInfo);
  console.log('info variableOnChainSchema', variableOnChainSchema);
  console.log('info constOnChainSchema', constOnChainSchema);
  console.log('tokenConstAttributes', tokenConstAttributes);
  console.log('tokenVarAttributes', tokenVarAttributes); */

  return (
    <div className='manage-token-attributes'>
      <Header as='h3'>Token attributes</Header>
      <a
        className='go-back'
        href='/'
        onClick={goBack}
      >
        <Image
          className='go-back'
          src={arrowLeft}
        />
        back
      </a>
      <Form className='manage-token--form'>
        <Grid className='manage-token--form--grid'>
          <Grid.Row>
            <Grid.Column width={8}>
              <Header as='h5'>Const Data</Header>
              { Object.keys(tokenConstAttributes).length > 0 && constAttributes?.map((collectionAttribute: AttributeItemType) => (
                <Form.Field key={collectionAttribute.name}>
                  { collectionAttribute.fieldType === 'string' && (
                    <Input
                      className='isSmall'
                      isDisabled={!!tokenId}
                      onChange={setAttributeValue.bind(null, 'const', collectionAttribute)}
                      placeholder={`Enter ${collectionAttribute.name}, ${collectionAttribute.fieldType}`}
                      value={tokenConstAttributes[collectionAttribute.name].value as string}
                    />
                  )}
                  { collectionAttribute.fieldType === 'enum' && (
                    <Dropdown
                      isDisabled={!!tokenId}
                      isMultiple={collectionAttribute.rule === 'repeated'}
                      onChange={setAttributeValue.bind(null, 'const', collectionAttribute)}
                      options={collectionAttribute.values.map((val: string, index: number) => ({ text: val, value: index }))}
                      placeholder='Select Attribute Type'
                      value={collectionAttribute.rule === 'repeated' ? tokenConstAttributes[collectionAttribute.name].values : tokenConstAttributes[collectionAttribute.name].value}
                    />
                  )}
                </Form.Field>
              ))}
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={8}>
              <Header as='h5'>Variable Data</Header>
              { Object.keys(tokenVarAttributes).length > 0 && variableAttributes?.map((collectionAttribute: AttributeItemType) => (
                <Form.Field key={collectionAttribute.name}>
                  { collectionAttribute.fieldType === 'string' && (
                    <Input
                      className='isSmall'
                      onChange={setAttributeValue.bind(null, 'var', collectionAttribute)}
                      placeholder={`Enter ${collectionAttribute.name}, ${collectionAttribute.fieldType}`}
                      value={tokenVarAttributes[collectionAttribute.name].value as string}
                    />
                  )}
                  { collectionAttribute.fieldType === 'enum' && (
                    <Dropdown
                      isMultiple={collectionAttribute.rule === 'repeated'}
                      onChange={setAttributeValue.bind(null, 'var', collectionAttribute)}
                      options={collectionAttribute.values.map((val: string, index: number) => ({ text: val, value: index }))}
                      placeholder='Select Attribute Type'
                      value={collectionAttribute.rule === 'repeated' ? tokenVarAttributes[collectionAttribute.name].values : tokenVarAttributes[collectionAttribute.name].value}
                    />
                  )}
                </Form.Field>
              ))}
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              { tokenId && (
                <Button
                  content={'Save'}
                  disabled={!isAdmin}
                  onClick={onSave}
                />
              )}
              { !tokenId && (
                <Button
                  content={'Create nft'}
                  disabled={!isAdmin}
                  onClick={onSave}
                />
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Form>
    </div>
  );
}

export default memo(ManageTokenAttributes);
