// Copyright 2017-2021 @polkadot/apps, UseTech authors & contributors
// SPDX-License-Identifier: Apache-2.0

import './styles.scss';

import type { ImageType } from 'react-images-uploading/dist/typings';
import type { ImageInterface } from '@polkadot/react-hooks/useMintApi';

import React, { useCallback, useState } from 'react';
import ImageUploading from 'react-images-uploading';
import { useLocation } from 'react-router-dom';
import Form from 'semantic-ui-react/dist/commonjs/collections/Form';
import Grid from 'semantic-ui-react/dist/commonjs/collections/Grid';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button';
import Header from 'semantic-ui-react/dist/commonjs/elements/Header';
import Image from 'semantic-ui-react/dist/commonjs/elements/Image';
import Loader from 'semantic-ui-react/dist/commonjs/elements/Loader';

import { Input, ManageTokenAttributes } from '@polkadot/react-components';
import { useMintApi } from '@polkadot/react-hooks';

import Replace from './images/ArrowCounterClockwise.svg';
import Picture from './images/picture.svg';
import Delete from './images/TrashSimple.svg';

const maxFileSize = 5000000;

interface Props {
  account?: string;
  setShouldUpdateTokens?: (collectionId: string) => void;
}

function ManageToken ({ account, setShouldUpdateTokens }: Props): React.ReactElement {
  const query = new URLSearchParams(useLocation().search);
  const tokenId = query.get('tokenId') || '';
  const collectionId = query.get('collectionId') || '';
  const [images, setImages] = useState<ImageType[]>([]);
  const [imageBase64, setImageBase64] = useState<string>();
  const [imageFileName, setImageFileName] = useState<string>();
  const [imageName, setImageName] = useState<string>();
  const { imgLoading, serverIsReady, uploadImage, uploadingError } = useMintApi();

  const onChangeString = useCallback((value) => {
    setImageName(value);
  }, [setImageName]);

  const onFileUpload = useCallback((imageList: ImageType[]) => {
    // data for submit
    setImages(imageList);

    const imageItem: ImageType = imageList[0];

    if (imageItem) {
      const imageFileName: string = imageItem.file ? imageItem.file.name : '';
      const imageBase64String: string = imageItem.dataURL ? imageItem.dataURL : '';
      const indexRemoveTo: number = imageBase64String.indexOf('base64,');
      const shortBase64String = imageBase64String.length >= indexRemoveTo + 7
        ? imageBase64String.replace(imageBase64String.substring(0, indexRemoveTo + 7), '')
        : imageBase64String;

      setImageBase64(shortBase64String);
      setImageFileName(imageFileName);
    }
  }, []);

  const onSaveToken = useCallback(() => {
    if (imageBase64 && imageName && serverIsReady && account) {
      const newToken: ImageInterface = {
        address: account,
        filename: imageFileName || imageName,
        image: imageBase64,
        name: imageName
      };

      uploadImage(newToken);
    }
  }, [account, imageBase64, imageFileName, imageName, serverIsReady, uploadImage]);

  const goBack = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShouldUpdateTokens && setShouldUpdateTokens('all');
    history.back();
  }, [setShouldUpdateTokens]);

  const canManageTokenAttributes = true;

  return (
    <div className='manage-token'>
      <Header as='h1'>
        { collectionId && tokenId ? 'Manage token' : 'Create token' }
      </Header>
      <a
        className='go-back'
        href='/'
        onClick={goBack}
      >
        <svg fill='none'
          height='16'
          viewBox='0 0 16 16'
          width='16'
          xmlns='http://www.w3.org/2000/svg'>
          <path d='M13.5 8H2.5'
            stroke='var(--card-link-color)'
            strokeLinecap='round'
            strokeLinejoin='round'/>
          <path d='M7 3.5L2.5 8L7 12.5'
            stroke='var(--card-link-color)'
            strokeLinecap='round'
            strokeLinejoin='round'/>
        </svg>
        back
      </a>
      <br />
      { canManageTokenAttributes && (
        <ManageTokenAttributes />
      )}
      <Form className='collection-search'>
        <Grid className='mint-grid'>
          <Grid.Row>
            <Grid.Column width={8}>
              <Form.Field>
                <Input
                  className='isSmall'
                  onChange={onChangeString}
                  // value={searchString}
                  placeholder='Enter your token name'
                />
              </Form.Field>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={8}>
              <Form.Field>
                <ImageUploading
                  maxFileSize={maxFileSize}
                  maxNumber={1}
                  onChange={onFileUpload}
                  value={images}
                >
                  {({ dragProps,
                    errors,
                    imageList,
                    isDragging,
                    onImageRemove,
                    onImageUpdate,
                    onImageUpload }) => (
                    // write your building UI
                    <div
                      className={`app-upload-image ${(!imageList || !(imageList as ImageType[]).length) ? '' : ' app-upload-image--dragging'}`}
                    >
                      { (!imageList || !(imageList as ImageType[]).length) && (
                        <div
                          className='app-upload-image__drop-zone'
                          {...dragProps}
                          onClick={onImageUpload as (e: React.MouseEvent<HTMLDivElement>) => void}
                          style={isDragging ? { background: '#A2DD18' } : undefined}
                        >
                          <Image
                            className='app-upload-image__img'
                            src={Picture}
                          />
                          Select or drop file
                        </div>
                      )}
                      { (imageList as ImageType[]).map((image: ImageType, index: number) => (
                        <div
                          className='image-item'
                          key={index}
                        >
                          <div className='image-item__img-wrapper'>
                            <div className='image-item__preview'>
                              <Image
                                src={image.dataURL}
                              />
                            </div>
                            {/* <div className='image-item__name'>Тут название картинки</div> */}
                          </div>
                          <div className='image-item__btn-wrapper'>
                            <a className='button-link'
                              onClick={(onImageUpdate as (index: number) => void).bind(null, index)}
                            >
                              <Image src={Replace} />
                              Replace
                            </a>
                            <a className='button-link'
                              onClick={(onImageRemove as (index: number) => void).bind(null, index)}
                            >
                              <Image src={Delete} />
                              Delete
                            </a>
                          </div>
                        </div>
                      ))}
                      {errors && (
                        <div className='error'>
                          {<span>Number of selected images exceed maxNumber</span>}
                          {errors.acceptType && <span>Your selected file type is not allow</span>}
                          {errors.maxFileSize && <span>Selected file size exceed maxFileSize</span>}
                          {errors.resolution && <span>Selected file is not match your desired resolution</span>}
                          {uploadingError && <span>{uploadingError}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </ImageUploading>
              </Form.Field>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={8}>
              {(
                <Button
                  content='Create Token'
                  onClick={onSaveToken}
                />
              )}
            </Grid.Column>
          </Grid.Row>
        </Grid>
        {
          imgLoading && (
            <div className='dimmer-loader'>
              <Loader
                active
                inline='centered'
              >
                Minting NFT...
              </Loader>
            </div>
          )
        }
      </Form >
    </div>
  );
}

export default React.memo(ManageToken);
