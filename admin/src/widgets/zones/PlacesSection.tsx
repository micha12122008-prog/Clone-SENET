import { useState } from "react";
import { Button, QueryState, Select, StatusBadge, Table, type Column } from "../../ui";
import { useDeletePlace, usePlaces } from "../../hooks/places/places.hooks";
import { useZones } from "../../hooks/zones/zones.hooks";
import type { Place, PlaceStatus } from "../../services/places/places.types";
import { PlaceFormModal } from "./PlaceFormModal";
import { PlaceStatusModal } from "./PlaceStatusModal";
import { ActionError, SectionHeader } from "./SectionHeader";
import { PLACE_STATUSES, PLACE_STATUS_LABEL, PLACE_STATUS_TONE, errorText } from "./zones.labels";

function specsText(place: Place): string {
    const { cpu, gpu, ram } = place.specs ?? {};
    return [cpu, gpu, ram].filter(Boolean).join(" · ") || "—";
}

export function PlacesSection() {
    const [zoneId, setZoneId] = useState("");
    const [status, setStatus] = useState<PlaceStatus | "">("");
    const [creating, setCreating] = useState(false);
    const [statusTarget, setStatusTarget] = useState<Place | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const zonesQuery = useZones();
    const query = usePlaces({ zoneId: zoneId || undefined, status: status || undefined });
    const deletePlace = useDeletePlace();

    const zones = zonesQuery.data ?? [];
    const deviceTypeOf = (place: Place) => zones.find((z) => z.id === place.zoneId)?.deviceType ?? "—";

    const handleDelete = (place: Place) => {
        if (!window.confirm(`Видалити місце «${place.name}»?`)) return;
        setActionError(null);
        deletePlace.mutate(place.id, { onError: (e) => setActionError(errorText(e)) });
    };

    const columns: Column<Place>[] = [
        { key: "number", header: "№", render: (place) => place.number },
        { key: "name", header: "Назва", render: (place) => place.name },
        { key: "zone", header: "Зона", render: (place) => place.zoneName ?? "—" },
        { key: "type", header: "Тип", render: deviceTypeOf },
        { key: "specs", header: "Характеристики", render: specsText },
        {
            key: "status",
            header: "Статус",
            render: (place) => (
                <StatusBadge tone={PLACE_STATUS_TONE[place.status] ?? "neutral"}>
                    {PLACE_STATUS_LABEL[place.status] ?? place.status}
                </StatusBadge>
            ),
        },
        {
            key: "actions",
            header: "",
            className: "text-right",
            render: (place) => (
                <span className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setStatusTarget(place)}>
                        Статус і ремонт
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        loading={deletePlace.isPending && deletePlace.variables === place.id}
                        onClick={() => handleDelete(place)}
                    >
                        Видалити
                    </Button>
                </span>
            ),
        },
    ];

    return (
        <section className="flex flex-col gap-4">
            <SectionHeader
                title="Місця"
                isLoading={query.isLoading}
                isFetching={query.isFetching}
                onRefresh={() => void query.refetch()}
            >
                <Button size="sm" disabled={zones.length === 0} onClick={() => setCreating(true)}>
                    Нове місце
                </Button>
            </SectionHeader>

            <div className="grid max-w-md grid-cols-2 gap-3">
                <Select aria-label="Фільтр за зоною" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                    <option value="">Усі зони</option>
                    {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                            {zone.name}
                        </option>
                    ))}
                </Select>
                <Select
                    aria-label="Фільтр за статусом"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PlaceStatus | "")}
                >
                    <option value="">Усі статуси</option>
                    {PLACE_STATUSES.map((value) => (
                        <option key={value} value={value}>
                            {PLACE_STATUS_LABEL[value]}
                        </option>
                    ))}
                </Select>
            </div>

            <ActionError message={actionError} />

            <QueryState query={query}>
                {(places) => (
                    <Table
                        columns={columns}
                        data={places}
                        getRowId={(place) => place.id}
                        emptyText="Місць не знайдено"
                    />
                )}
            </QueryState>

            {creating && <PlaceFormModal zones={zones} onClose={() => setCreating(false)} />}
            {statusTarget && <PlaceStatusModal place={statusTarget} onClose={() => setStatusTarget(null)} />}
        </section>
    );
}
