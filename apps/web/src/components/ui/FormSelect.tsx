import {
  Controller,
  FieldPath,
  FieldValues,
  UseControllerProps,
} from 'react-hook-form';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material';

export interface SelectOption {
  label: string;
  value: string | number;
}

type FormSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = UseControllerProps<TFieldValues, TName> &
  Omit<SelectProps, 'name' | 'value' | 'onChange' | 'error'> & {
    label: string;
    options: SelectOption[];
    helperText?: string;
  };

/**
 * Select bound to react-hook-form.
 *
 * Usage:
 *   <FormSelect control={control} name="priority" label="Priority"
 *     options={[{ label: 'Routine', value: 'ROUTINE' }, ...]} />
 */
export function FormSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  label,
  options,
  helperText,
  ...selectProps
}: FormSelectProps<TFieldValues, TName>) {
  const labelId = `form-select-${name}-label`;

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      shouldUnregister={shouldUnregister}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <FormControl fullWidth size={selectProps.size ?? 'small'} error={Boolean(fieldState.error)}>
          <InputLabel id={labelId}>{label}</InputLabel>
          <Select
            {...selectProps}
            {...field}
            label={label}
            labelId={labelId}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {(fieldState.error || helperText) && (
            <FormHelperText>
              {fieldState.error?.message ?? helperText}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}
