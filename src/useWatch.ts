import * as React from 'react';
import { useFormContext } from './useFormContext';
import isUndefined from './utils/isUndefined';
import isString from './utils/isString';
import generateId from './logic/generateId';
import get from './utils/get';
import isArray from './utils/isArray';
import isObject from './utils/isObject';
import {
  DeepPartial,
  UseWatchOptions,
  FieldValues,
  UnpackNestedValue,
  InternalFieldName,
  Control,
} from './types';

export function useWatch<
  TWatchFieldValues extends FieldValues = FieldValues
>(props: {
  defaultValue?: UnpackNestedValue<DeepPartial<TWatchFieldValues>>;
  control?: Control<TWatchFieldValues>;
}): UnpackNestedValue<DeepPartial<TWatchFieldValues>>;

export function useWatch<TWatchFieldValue extends any>(props: {
  name: string;
  defaultValue?: UnpackNestedValue<TWatchFieldValue>;
  control?: Control<any>;
}): UnpackNestedValue<TWatchFieldValue>;

export function useWatch<
  TWatchFieldValues extends FieldValues = FieldValues
>(props: {
  name: InternalFieldName<TWatchFieldValues>[];
  defaultValue?: UnpackNestedValue<DeepPartial<TWatchFieldValues>>;
  control?: Control<TWatchFieldValues>;
}): UnpackNestedValue<DeepPartial<TWatchFieldValues>>;

export function useWatch<TWatchFieldValues>({
  control,
  name,
  defaultValue,
}: UseWatchOptions<TWatchFieldValues>): TWatchFieldValues {
  const methods = useFormContext<TWatchFieldValues>();

  if (process.env.NODE_ENV !== 'production') {
    if (!control && !methods) {
      throw new Error(
        '📋 useWatch is missing `control` prop. https://react-hook-form.com/api#useWatch',
      );
    }

    if (name === '') {
      console.warn(
        '📋 useWatch is missing `name` attribute. https://react-hook-form.com/api#useWatch',
      );
    }
  }

  const {
    useWatchFieldsRef,
    useWatchRenderFunctionsRef,
    watchInternal,
    defaultValuesRef,
  } = control || methods.control;
  const [value, setValue] = React.useState<unknown>(
    isUndefined(defaultValue)
      ? isString(name)
        ? get(defaultValuesRef.current, name)
        : isArray(name)
        ? name.reduce(
            (previous, inputName) => ({
              ...previous,
              [inputName]: get(defaultValuesRef.current, <string>inputName),
            }),
            {},
          )
        : defaultValuesRef.current
      : defaultValue,
  );
  const idRef = React.useRef<string>();
  const defaultValueRef = React.useRef(defaultValue);

  const updateWatchValue = React.useCallback(() => {
    const value = watchInternal(name, defaultValueRef.current, idRef.current);
    setValue(
      isObject(value) ? { ...value } : isArray(value) ? [...value] : value,
    );
  }, [setValue, watchInternal, defaultValueRef, name, idRef]);

  React.useEffect(() => {
    const id = (idRef.current = generateId());
    const watchFieldsHookRender = useWatchRenderFunctionsRef.current;
    const watchFieldsHook = useWatchFieldsRef.current;
    watchFieldsHook[id] = new Set();
    watchFieldsHookRender[id] = updateWatchValue;
    watchInternal(name, defaultValueRef.current, id);

    return () => {
      delete watchFieldsHook[id];
      delete watchFieldsHookRender[id];
    };
  }, [
    name,
    updateWatchValue,
    useWatchRenderFunctionsRef,
    useWatchFieldsRef,
    watchInternal,
    defaultValueRef,
  ]);

  return (isUndefined(value) ? defaultValue : value) as TWatchFieldValues;
}
