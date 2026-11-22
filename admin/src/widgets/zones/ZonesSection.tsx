import { useState } from "react";
import { Button, QueryState, Table, type Column } from "../../ui";
import { useDeleteZone, useZones } from "../../hooks/zones/zones.hooks";
import type { Zone } from "../../services/zones/zones.types";
import { ZoneFormModal } from "./ZoneFormModal";
import { ActionError, SectionHeader } from "./SectionHeader";
import { errorText, formatUah } from "./zones.labels";

export function ZonesSection() {
    const query = useZones();
    const deleteZone = useDeleteZone();
    //
    const [formTarget, setFormTarget] = useState<Zone | null | undefined>(undefined);// undefined — modal closed, null — creating, Zone — editing
    const [actionError, setActionError] = useState<string | null>(null);

    const handleDelete = (zone: Zone) => {
        if (!window.confirm(`Видалити зону «${zone.name}» разом з її місцями?`)) return;
        setActionError(null);
        deleteZone.mutate(zone.id, { onError: (e) => setActionError(errorText(e)) });
    };

    const columns: Column<Zone>[] = [
        {
            key: "name",
            header: "Зона",
            render: (zone) => (
                <span className="flex items-center gap-2">
                    <span
                        aria-hidden="true"
                        className="size-3 rounded-full"
                        style={{ backgroundColor: zone.colorHex }}
                    />
                    {zone.name}
                </span>
            ),
        },
        { key: "type", header: "Тип", render: (zone) => zone.deviceType },
        { key: "rate", header: "Тариф", render: (zone) => `${formatUah(zone.baseHourlyRate)} / год` },
        {
            key: "places",
            header: "Вільно місць",
            render: (zone) =>
                zone.totalComputers === undefined
                    ? "—"
                    : `${zone.availableComputers ?? 0} з ${zone.totalComputers}`,
        },
        {
            key: "actions",
            header: "",
            className: "text-right",
            render: (zone) => (
                <span className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setFormTarget(zone)}>
                        Редагувати
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        loading={deleteZone.isPending && deleteZone.variables === zone.id}
                        onClick={() => handleDelete(zone)}
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
                title="Зони"
                isLoading={query.isLoading}
                isFetching={query.isFetching}
                onRefresh={() => void query.refetch()}
            >
                <Button size="sm" onClick={() => setFormTarget(null)}>
                    Нова зона
                </Button>
            </SectionHeader>

            <ActionError message={actionError} />

            <QueryState query={query}>
                {(zones) => (
                    <Table
                        columns={columns}
                        data={zones}
                        getRowId={(zone) => zone.id}
                        emptyText="Зон ще немає"
                    />
                )}
            </QueryState>

            {formTarget !== undefined && (
                <ZoneFormModal zone={formTarget} onClose={() => setFormTarget(undefined)} />
            )}
        </section>
    );
}
