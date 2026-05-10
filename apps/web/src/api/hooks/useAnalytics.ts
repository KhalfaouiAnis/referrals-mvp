import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analytics.service";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => analyticsService.getDashboard(),
    staleTime: 2 * 60 * 1000, // 2 min — dashboard can be slightly stale
  });
}
