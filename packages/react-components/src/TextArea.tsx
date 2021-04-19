// Copyright 2017-2021 @polkadot/react-components authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';

import Labelled from './Labelled';

interface Props {
  children?: React.ReactNode;
  className?: string;
  help?: React.ReactNode;
  isError?: boolean;
  isReadOnly?: boolean;
  label?: React.ReactNode;
  onChange?: (arg: string) => void;
  seed?: string;
  withLabel?: boolean;
}

function TextArea ({ children, className, help, isError, isReadOnly, label, onChange, seed, withLabel }: Props): React.ReactElement<Props> {
  const _onChange = useCallback(
    ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>): void => {
      onChange && onChange(value);
    },
    [onChange]
  );

  return (
    <Labelled
      className={className}
      help={help}
      label={label}
      withLabel={withLabel}
    >
      <div className='TextAreaWithDropdown'>
        <textarea
          autoCapitalize='off'
          autoCorrect='off'
          autoFocus={false}
          className={isError ? 'ui-textArea-withError' : ''}
          onChange={_onChange}
          readOnly={isReadOnly}
          rows={2}
          spellCheck={false}
          value={seed}
        />
        {children}
      </div>
    </Labelled>
  );
}

export default React.memo(TextArea);
