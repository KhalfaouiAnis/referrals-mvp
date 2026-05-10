import {
  Controller,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
import TextField, { TextFieldProps } from '@mui/material/TextField';

type FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<TextFieldProps, 'name' | 'value' | 'onChange' | 'onBlur' | 'error'> & {
    label: string;
  };

/**
 * Text input bound to react-hook-form.
 * Zod errors from the resolver are surfaced automatically via `fieldState.error`.
 */
export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  ...textFieldProps
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <TextField
          {...textFieldProps}
          {...field}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? textFieldProps.helperText}
          fullWidth
          size={textFieldProps.size ?? 'small'}
        />
      )}
    />
  );
}
