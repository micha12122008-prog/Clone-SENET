import { useState } from "react";
import { Button, QueryState, Table, type Column } from "../../ui";
import { useDeleteTariff, useTariffs } from "../../hooks/tariffs/tariffs.hooks";
import { useZones } from "../../hooks/zones/zones.hooks";
import type { Tariff } from "../../services/tariffs/tariffs.types";
import { TariffFormModal } from "./TariffFormModal";
import { ActionError, SectionHeader } from "./SectionHeader";
import { TARIFF_TYPE_LABEL, errorText, formatUah } from "./zones.labels";

export function TariffsSection() {
    const query = useTariffs();
    const zonesQuery = useZones();
    const deleteTariff = useDeleteTariff();
    // undefined — the model is closed, null — creating, Tariff — editing
    const [formTarget, setFormTarget] = useState<Tariff | null | undefined>(undefined);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleDelete = (tariff: Tariff) => {
        if (!window.confirm(`Видалити тариф «${tariff.name}»?`)) return;
        setActionError(null);
        deleteTariff.mutate(tariff.id, { onError: (e) => setActionError(errorText(e)) });
    };

    const zones = zonesQuery.data;
    
    const zoneLabel = (tariff: Tariff) => {
        if (!tariff.zoneId) return "Усі зони";
        if (!zones) return "…";
        const zone = zones.find((z) => z.id === tariff.zoneId);
        if (zone) return zone.name;
        return (
            <span className="text-amber-700" title={`Зони з id ${tariff.zoneId} немає у відповіді GET /zones`}>
                Зону не знайдено
            </span>
        );
    };

    const columns: Column<Tariff>[] = [
        { key: "name", header: "Назва", render: (tariff) => tariff.name },
        { key: "type", header: "Тип", render: (tariff) => TARIFF_TYPE_LABEL[tariff.type] ?? tariff.type },
        { key: "price", header: "Ціна", render: (tariff) => formatUah(tariff.price) },
        {
            key: "duration",
            header: "Тривалість",
            render: (tariff) => `${tariff.durationMinutes} хв`,
        },
        { key: "zone", header: "Зона", render: zoneLabel },
        {
            key: "actions",
            header: "",
            className: "text-right",
            render: (tariff) => (
                <span className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setFormTarget(tariff)}>
                        Редагувати
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        loading={deleteTariff.isPending && deleteTariff.variables === tariff.id}
                        onClick={() => handleDelete(tariff)}
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
                title="Тарифи"
                isLoading={query.isLoading}
                isFetching={query.isFetching}
                onRefresh={() => void query.refetch()}
            >
                <Button size="sm" onClick={() => setFormTarget(null)}>
                    Новий тариф
                </Button>
            </SectionHeader>

            <ActionError message={actionError} />

            <QueryState query={query}>
                {(tariffs) => (
                    <Table
                        columns={columns}
                        data={tariffs}
                        getRowId={(tariff) => tariff.id}
                        emptyText="Тарифів ще немає"
                    />
                )}
            </QueryState>

            {formTarget !== undefined && (
                <TariffFormModal
                    tariff={formTarget}
                    zones={zones ?? []}
                    onClose={() => setFormTarget(undefined)}
                />
            )}
        </section>
    );
}
