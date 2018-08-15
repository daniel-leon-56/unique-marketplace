// Copyright 2017-2018 @polkadot/ui-app authors & contributors
// This software may be modified and distributed under the terms
// of the ISC license. See the LICENSE file for details.

import { SectionItem } from '@polkadot/params/types';
import { I18nProps } from '../types';
import { ComponentMap, RawParams, RawParam$OnChange, RawParam$OnChange$Value } from './types';

import './Params.css';

import React from 'react';

import classes from '../util/classes';
import translate from '../translate';
import Param from './Param';
import createValues from './values';

type Props<S> = I18nProps & {
  isDisabled?: boolean,
  item: S,
  onChange?: (value: RawParams) => void,
  overrides?: ComponentMap,
  values?: RawParams
};

type State<S> = {
  item: S,
  handlers: Array<RawParam$OnChange>,
  onChangeParam: (at: number, next: RawParam$OnChange$Value) => void,
  values: RawParams
};

class Params<T, S extends SectionItem<T>> extends React.PureComponent<Props<S>, State<S>> {
  state: State<S>;

  constructor (props: Props<S>) {
    super(props);

    this.state = ({
      onChangeParam: this.onChangeParam
    } as State<S>);
  }

  static getDerivedStateFromProps (props: Props<any>, { item, onChangeParam }: State<any>): State<any> | null {
    const isSame = item && item.name === props.item.name && item.section === props.item.section;

    if (props.isDisabled || isSame) {
      return null;
    }

    const { params } = props.item;
    const values = createValues(params);
    const handlers = values.map(
      (value, index): RawParam$OnChange =>
        (value: RawParam$OnChange$Value): void =>
          onChangeParam(index, value)
    );

    return {
      item: props.item,
      handlers,
      values
    } as State<any>;
  }

   // NOTE This is needed in the case where the item changes, i.e. the values get initialised and we need to alert the parent that we have new values
  componentDidUpdate (prevProps: Props<S>, prevState: State<S>) {
    const { onChange, isDisabled } = this.props;
    const { values } = this.state;

    if (!isDisabled && prevState.values !== values) {
      onChange && onChange(values);
    }
  }

  render () {
    const { className, isDisabled, item: { params }, overrides, style } = this.props;
    const { handlers = [], values = this.props.values } = this.state;

    if (!values || values.length === 0 || params.length === 0) {
      return null;
    }

    return (
      <div
        className={classes('ui--Params', className)}
        style={style}
      >
        <div className='ui--Params-Content'>
          {params.map(({ name }, index) => (
            <Param
              defaultValue={values[index]}
              isDisabled={isDisabled}
              key={`${name}:${name}:${index}`}
              name={name}
              onChange={handlers[index]}
              overrides={overrides}
            />
          ))}
        </div>
      </div>
    );
  }

  private onChangeParam = (at: number, { isValid = false, value }: RawParam$OnChange$Value): void => {
    const { isDisabled } = this.props;

    if (isDisabled) {
      return;
    }

    this.setState(
      (prevState: State<S>): State<S> => ({
        values: prevState.values.map((prev, index) =>
          index !== at
            ? prev
            : {
              isValid,
              type: prev.type,
              value
            }
        )
      } as State<S>),
      this.triggerUpdate
    );
  }

  triggerUpdate = (): void => {
    const { values } = this.state;
    const { onChange, isDisabled } = this.props;

    if (isDisabled) {
      return;
    }

    onChange && onChange(values);
  }
}

// @ts-ignore something is wrong with generics and these imports
export default translate(Params);
