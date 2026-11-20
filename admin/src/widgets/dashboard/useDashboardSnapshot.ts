import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "../../services/dashboard/dashboard.service";

export function useDashboardSnapshot() {
    return useQuery({
        queryKey: ["dashboard", "snapshot"],
        queryFn: () => DashboardService.getSnapshot(),
    });
}
