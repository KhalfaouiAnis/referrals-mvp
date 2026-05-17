import { SpecialtyType } from "@referrals/shared";
import { CreateReferralFormValues } from "../schema/create-referral.schema";
import { Control, useController } from "react-hook-form";
import { useState } from "react";
import { usePatientSearch } from "../../../api/hooks/usePatients";
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";
import { FormSelect } from "../../../components/ui/FormSelect";
import { PatientSearchResult } from "src/api/services/patients.service";

const SPECIALTY_OPTIONS = Object.values(SpecialtyType).map((v) => ({
    label: v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, ' '),
    value: v,
}));

interface Props {
    control: Control<CreateReferralFormValues>;
}

export function Step1PatientSelect({ control }: Props) {
    const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null);
    const [inputValue, setInputValue] = useState('');
    const { data: searchData, isFetching } = usePatientSearch(inputValue);
    const patients = searchData?.data ?? [];

    const { field: patientField, fieldState: patientState } = useController({ control, name: "patientId" });

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="subtitle2" gutterBottom>Patient *</Typography>
                <Autocomplete
                    options={patients}
                    loading={isFetching}
                    value={selectedPatient}
                    inputValue={inputValue}
                    getOptionLabel={p => `${p.fullName} - MRN: ${p.mrn}`}
                    isOptionEqualToValue={(opt, val) => opt.id === val.id}
                    onInputChange={(_, v, reason) => {
                        if (reason === 'input') setInputValue(v);
                        if (reason === 'reset') setInputValue(v);
                    }}
                    onChange={(_, patient) => {
                        patientField.onChange(patient?.id ?? '');
                        setSelectedPatient(patient);
                        if (!patient) setInputValue('');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            size="small"
                            error={Boolean(patientState.error)}
                            placeholder="Search by name or MRN..."
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