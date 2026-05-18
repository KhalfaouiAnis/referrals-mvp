import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { SpecialtyType } from "@referrals/shared";
import { SelectOption } from "src/components/ui/FormSelect";
import { usersService } from "../services/users.service";

const AUTO_ASSIGN_OPTION: SelectOption = {
  label: "Auto-assign",
  value: "", // empty string = no explicit choice; converted to null on submit
};

export function useSpecialistOptions(specialtyType: SpecialtyType) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["specialists", specialtyType],
    queryFn: () => usersService.listSpecialists(specialtyType),
    enabled: !!specialtyType,
    staleTime: 60_000,
  });

  const options: SelectOption[] = useMemo(() => {
    if (!specialtyType) return [AUTO_ASSIGN_OPTION];

    const specialistOptions = data.map((s) => ({
      value: s.id,
      label:
        s.nextAvailableSlotDays != null
          ? `${s.fullName} — available in ${s.nextAvailableSlotDays}d`
          : s.fullName,
    }));

    return [AUTO_ASSIGN_OPTION, ...specialistOptions];
  }, [data, specialtyType]);

  return { options, isLoading };
}
