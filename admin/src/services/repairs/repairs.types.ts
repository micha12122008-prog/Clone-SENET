//DTO, що відповідає моделі Repair у schema.prisma(backend)
export interface RepairEntry {
    id: string;
    placeId: string;
    description: string;
    startedAt: string;
    finishedAt: string | null;
}
