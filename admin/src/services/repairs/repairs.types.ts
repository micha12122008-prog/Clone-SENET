//Corresponds to RepairResponseDto on the backend(GET /computers/repairs)
export interface RepairEntry {
    id: string;
    placeId: string;
    placeNumber?: number;
    placeName?: string;
    zoneName?: string;
    description: string;
    startedAt: string;
    finishedAt: string | null;
    status?: "В процесі" | "Завершено";
}
