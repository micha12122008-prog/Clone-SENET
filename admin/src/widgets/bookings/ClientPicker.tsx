import { useState } from "react";
import { Button, Input } from "../../ui";
import { useClientSearch } from "../../hooks/clients/clients.hooks";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { Client } from "../../services/clients/clients.types";
import { ActionError } from "../zones/SectionHeader";
import { clientLabel, errorText } from "./bookings.labels";

interface ClientPickerProps {
    value: Client | null;
    onChange: (client: Client | null) => void;
    error?: string;
}

//A booking from the lobby is created for a specific player; without a `userId`, the backend would have assigned a demo account.
export function ClientPicker({ value, onChange, error }: ClientPickerProps) {
    const [search, setSearch] = useState("");
    const debounced = useDebouncedValue(search);
    const query = useClientSearch(debounced);

    if (value) {
        return (
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Клієнт</span>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                    <span className="text-gray-900">{clientLabel(value)}</span>
                    <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
                        Змінити
                    </Button>
                </div>
            </div>
        );
    }

    const items = query.data?.items ?? [];
    const settled = query.data !== undefined && debounced.trim() === search.trim();

    return (
        <div className="flex flex-col gap-2">
            <Input
                label="Клієнт"
                placeholder="Телефон, нік або email"
                hint="Введіть від 2 символів"
                error={error}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {query.isError && <ActionError message={errorText(query.error)} />}
            {query.isFetching && <p className="text-xs text-gray-400">Пошук…</p>}

            {items.length > 0 && (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                    {items.map((client) => (
                        <li key={client.id}>
                            <button
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                                onClick={() => onChange(client)}
                            >
                                {clientLabel(client)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {settled && items.length === 0 && <p className="text-sm text-gray-500">Нікого не знайдено</p>}
        </div>
    );
}
