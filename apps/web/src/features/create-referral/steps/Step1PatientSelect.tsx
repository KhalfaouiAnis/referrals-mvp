import { SpecialtyType } from "@referrals/shared";
import { CreateReferralFormValues } from "../schema/create-referral.schema";
import { Control, useController } from "react-hook-form";
import { useState } from "react";
import { usePatientSearch } from "../../../api/hooks/usePatients";
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";
import { FormSelect } from "../../../components/ui/FormSelect";

const SPECIALTY_OPTIONS = Object.values(SpecialtyType).map((v) => ({
    label: v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' '),
    value: v,
}));

interface Props {
    control: Control<CreateReferralFormValues>;
}

export function Step1PatientSelect({ control }: Props) {
    const [inputValue, setInputValue] = useState('');
    const { data: searchData, isFetching } = usePatientSearch(inputValue);
    const patients = searchData?.data ?? [];

    const { field: patientField, fieldState: patientState } = useController({ control, name: "patientId" });
    const selectedPatient = patients.find((p) => p.id === patientField.value) ?? null;

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle2" gutterBottom>Patient *</Typography>
                <Autocomplete
                    options={patients}
                    getOptionLabel={p => `${p.fullName} - MRN: ${p.mrn}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    loading={isFetching}
                    value={selectedPatient}
                    inputValue={inputValue}
                    onInputChange={(_, v) => setInputValue(v)}
                    onChange={(_, patient) => {
                        patientField.onChange(patient?.id ?? '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            placeholder="Search by name or MRN..."
                            error={Boolean(patientState.error)}
                            helperText={patientState.error?.message ?? 'Type at least 2 characters'}
                        />
                    )}
                    renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.id}>
                            <Stack>
                                <Typography variant="body2" fontWeight={500}>{option.fullName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    MRN: {option.mrn} · DOB: {option.dateOfBirth}
                                    {option.insurancePlan ? ` · ${option.insurancePlan}` : ''}
                                </Typography>
                            </Stack>
                        </Box>
                    )}
                    noOptionsText={
                        inputValue.length < 2
                            ? 'Type at least 2 characters'
                            : 'No patients found'
                    }
                />
            </Box>
            <FormSelect
                control={control}
                name="specialtyType"
                label="Specialty type *"
                options={SPECIALTY_OPTIONS}
            />
        </Stack>
    )
}