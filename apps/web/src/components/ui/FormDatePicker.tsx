import {
  Controller,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { FormHelperText, FormControl } from '@mui/material';

type FormDatePickerProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<DatePickerProps, 'value' | 'onChange'> & {
    label: string;
    helperText?: string;
  };

/**
 * Date picker bound to react-hook-form.
 * Value is stored as an ISO string (YYYY-MM-DD) in the form state.
 */
export function FormDatePicker<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  label,
  helperText,
  ...pickerProps
}: FormDatePickerProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <FormControl fullWidth error={Boolean(fieldState.error)}>
          <DatePicker
            {...pickerProps}
            label={label}
            value={field.value ? new Date(field.value as string) : null}
            onChange={(date) => {
              field.onChange(date ? (date as Date).toISOString().slice(0, 10) : null);
            }}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                error: Boolean(fieldState.error),
                helperText: fieldState.error?.message ?? helperText,
              },
            }}
          />
          {fieldState.error && !helperText && (
            <FormHelperText>{fieldState.error.message}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}
