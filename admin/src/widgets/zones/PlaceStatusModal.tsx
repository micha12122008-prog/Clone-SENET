import { useState } from "react";
import { Button, Modal, QueryState, Select, Table, type Column } from "../../ui";
import { useSetPlaceStatus } from "../../hooks/places/places.hooks";
import { useRepairLog } from "../../hooks/repairs/repairs.hooks";
import type { Place, PlaceStatus } from "../../services/places/places.types";
import type { RepairEntry } from "../../services/repairs/repairs.types";
import { ActionError } from "./SectionHeader";
import { PLACE_STATUS_LABEL, allowedPlaceStatuses, errorText, formatDateTime } from "./zones.labels";

const FORM_ID = "place-status-form";

const logColumns: Column<RepairEntry>[] = [
    { key: "started", header: "Початок", render: (r) => formatDateTime(r.startedAt) },
    { key: "description", header: "Опис", render: (r) => r.description },
    {
        key: "finished",
        header: "Завершено",
        render: (r) => (r.finishedAt ? formatDateTime(r.finishedAt) : "у ремонті"),
    },
];

//Change of location status and repair log for this location
export function PlaceStatusModal({ place, onClose }: { place: Place; onClose: () => void }) {
    const [status, setStatus] = useState<PlaceStatus>(place.status);
    const [note, setNote] = useState("");
    const [noteError, setNoteError] = useState<string | undefined>();

    const setPlaceStatus = useSetPlaceStatus();
    const repairLog = useRepairLog(place.id);

    const needsNote = status === "ремонт" && place.status !== "ремонт";

    const handleSubmit = async () => {
        if (needsNote && !note.trim()) {
            setNoteError("Опишіть, що зламалось");
            return;
        }
        try {
            await setPlaceStatus.mutateAsync({
                id: place.id,
                status,
                repairNote: needsNote ? note.trim() : undefined,
            });
            onClose();
        } catch {
            //setPlaceStatus.error shows an error
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            title={`Місце ${place.name}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Закрити
                    </Button>
                    <Button
                        type="submit"
                        form={FORM_ID}
                        disabled={status === place.status}
                        loading={setPlaceStatus.isPending}
                    >
                        Змінити статус
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-6">
                <form
                    id={FORM_ID}
                    noValidate
                    className="flex flex-col gap-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void handleSubmit();
                    }}
                >
                    <ActionError
                        message={setPlaceStatus.isError ? errorText(setPlaceStatus.error) : null}
                    />

                    <Select
                        label="Статус"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as PlaceStatus)}
                    >
                        {allowedPlaceStatuses(place.status).map((value) => (
                            <option key={value} value={value}>
                                {PLACE_STATUS_LABEL[value]}
                            </option>
                        ))}
                    </Select>

                    {needsNote && (
                        <div className="flex flex-col gap-1">
                            <label htmlFor="repair-note" className="text-sm font-medium text-gray-700">
                                Причина ремонту
                            </label>
                            <textarea
                                id="repair-note"
                                rows={3}
                                value={note}
                                aria-invalid={noteError ? true : undefined}
                                onChange={(e) => {
                                    setNote(e.target.value);
                                    if (noteError) setNoteError(undefined);
                                }}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
                            />
                            {noteError && <p className="text-xs text-red-600">{noteError}</p>}
                        </div>
                    )}
                </form>

                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">Журнал ремонту</h3>
                    <QueryState query={repairLog}>
                        {(entries) => (
                            <Table
                                columns={logColumns}
                                data={entries}
                                getRowId={(r) => r.id}
                                emptyText="Ремонтів не було"
                            />
                        )}
                    </QueryState>
                </div>
            </div>
        </Modal>
    );
}
