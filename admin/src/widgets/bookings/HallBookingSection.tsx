import { useState } from "react";
import { Button, Input, QueryState, Select } from "../../ui";
import { useCreateBooking } from "../../hooks/bookings/bookings.hooks";
import { usePlaces } from "../../hooks/places/places.hooks";
import { useTariffs } from "../../hooks/tariffs/tariffs.hooks";
import { useZones } from "../../hooks/zones/zones.hooks";
import type { Booking } from "../../services/bookings/bookings.types";
import type { Client } from "../../services/clients/clients.types";
import type { Tariff } from "../../services/tariffs/tariffs.types";
import type { Zone } from "../../services/zones/zones.types";
import { ActionError } from "../zones/SectionHeader";
import { ClientPicker } from "./ClientPicker";
import { DURATION_OPTIONS, PACKAGE_PAID_HOURS, PACKAGE_SLOT_HOURS, errorText, formatDateTime, formatUah, hourlyEstimate, isPackageTariff, localInputToIso, nextHourLocalInput } from "./bookings.labels";

type Payment = "onsite" | "online";

interface HallBookingSectionProps {
    onFindCheckIn: (token: string) => void;
}

export function HallBookingSection({ onFindCheckIn }: HallBookingSectionProps) {
    const zonesQuery = useZones();

    return (
        <QueryState query={zonesQuery}>
            {(zones) => <HallBookingForm zones={zones} onFindCheckIn={onFindCheckIn} />}
        </QueryState>
    );
}

function HallBookingForm({ zones, onFindCheckIn }: { zones: Zone[]; onFindCheckIn: (token: string) => void }) {
    const [zoneIdRaw, setZoneId] = useState("");
    const [placeIdRaw, setPlaceId] = useState("");
    const [tariffIdRaw, setTariffId] = useState("");
    const [start, setStart] = useState(nextHourLocalInput);
    const [hours, setHours] = useState<number>(1);
    const [payment, setPayment] = useState<Payment>("onsite");
    const [notes, setNotes] = useState("");
    const [client, setClient] = useState<Client | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const create = useCreateBooking();
    const tariffsQuery = useTariffs();

    //A selected value that is no longer in the list (due to a zone change) is treated as empty—with no effects.
    const zoneId = zones.some((z) => z.id === zoneIdRaw) ? zoneIdRaw : (zones[0]?.id ?? "");
    const placesQuery = usePlaces({ zoneId: zoneId || undefined });

    const places = (placesQuery.data ?? []).filter((p) => p.zoneId === zoneId);
    const zoneTariffs = (tariffsQuery.data ?? []).filter((t) => t.zoneId === zoneId || t.zoneId === null);

    const placeId = places.some((p) => p.id === placeIdRaw) ? placeIdRaw : "";
    const tariff = zoneTariffs.find((t) => t.id === tariffIdRaw);
    const place = places.find((p) => p.id === placeId);

    const isPackage = tariff ? isPackageTariff(tariff) : false;
    const slotHours = isPackage ? PACKAGE_SLOT_HOURS : hours;
    const endLabel = start ? formatDateTime(new Date(new Date(start).getTime() + slotHours * 3_600_000).toISOString()) : "—";

    const errors = {
        place: submitted && !placeId ? "Оберіть місце" : undefined,
        tariff: submitted && !tariff ? "Оберіть тариф" : undefined,
        start: submitted && !start ? "Вкажіть час початку" : undefined,
        client: submitted && !client ? "Оберіть клієнта" : undefined,
    };

    const handleSubmit = () => {
        setSubmitted(true);
        if (!place || !tariff || !start || !client) return;

        create.mutate({
            placeId: place.id,
            tariffId: tariff.id,
            startTime: localInputToIso(start),
            durationHours: isPackage ? undefined : hours,
            isPackage3Plus1: isPackage || undefined,
            isPaidOnline: payment === "online",
            userId: client.id,
            notes: notes.trim() || undefined,
        });
    };

    const handleReset = () => {
        create.reset();
        setSubmitted(false);
        setClient(null);
        setNotes("");
        setPlaceId("");
        setTariffId("");
    };

    if (create.isSuccess) {
        return <BookingCreated booking={create.data} onFindCheckIn={onFindCheckIn} onReset={handleReset} />;
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <form
                noValidate
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
            >
                <ActionError message={create.isError ? errorText(create.error) : null} />

                <div className="grid gap-4 sm:grid-cols-2">
                    <Select label="Зона" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                        {zones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                                {zone.name}
                            </option>
                        ))}
                    </Select>

                    <Select
                        label="Місце"
                        value={placeId}
                        error={errors.place}
                        hint={placesQuery.isFetching ? "Оновлення…" : undefined}
                        onChange={(e) => setPlaceId(e.target.value)}
                    >
                        <option value="">Оберіть місце</option>
                        {places.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.status === "ремонт"}>
                                {p.name}
                                {p.status === "ремонт" ? " (ремонт)" : ""}
                            </option>
                        ))}
                    </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                        label="Тариф"
                        value={tariff?.id ?? ""}
                        error={errors.tariff}
                        onChange={(e) => setTariffId(e.target.value)}
                    >
                        <option value="">Оберіть тариф</option>
                        {zoneTariffs.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name} — {formatUah(t.price)}
                            </option>
                        ))}
                    </Select>

                    {isPackage ? (
                        <Input
                            label="Тривалість"
                            value={`${PACKAGE_SLOT_HOURS} год (оплата за ${PACKAGE_PAID_HOURS})`}
                            readOnly
                        />
                    ) : (
                        <Select label="Тривалість" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                            {DURATION_OPTIONS.map((value) => (
                                <option key={value} value={value}>
                                    {value} год
                                </option>
                            ))}
                        </Select>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Початок"
                        type="datetime-local"
                        value={start}
                        error={errors.start}
                        onChange={(e) => setStart(e.target.value)}
                    />
                    <Select label="Оплата" value={payment} onChange={(e) => setPayment(e.target.value as Payment)}>
                        <option value="onsite">Оплата на місці</option>
                        <option value="online">Оплачено онлайн</option>
                    </Select>
                </div>

                <ClientPicker value={client} onChange={setClient} error={errors.client} />

                <Input
                    label="Нотатка"
                    placeholder="Необов'язково"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <div>
                    <Button type="submit" loading={create.isPending}>
                        Створити бронь
                    </Button>
                </div>
            </form>

            <aside aria-label="Кошик" className="h-fit rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-base font-semibold text-gray-900">Кошик</h3>
                <dl className="flex flex-col gap-2 text-sm">
                    <CartRow label="Зона" value={zones.find((z) => z.id === zoneId)?.name} />
                    <CartRow label="Місце" value={place?.name} />
                    <CartRow label="Тариф" value={tariff?.name} />
                    <CartRow label="Початок" value={start ? formatDateTime(localInputToIso(start)) : undefined} />
                    <CartRow label="Кінець" value={start ? endLabel : undefined} />
                    <CartRow label="Клієнт" value={client ? client.firstName || client.username : undefined} />
                    <CartRow label="До сплати" value={estimateText(tariff, slotHours, isPackage)} />
                </dl>
            </aside>
        </div>
    );
}

//The forecast applies only to hourly rates. For the 3+1 package, the amount is calculated by the backend and is visible in the confirmation.
function estimateText(tariff: Tariff | undefined, hours: number, isPackage: boolean): string | undefined {
    if (!tariff) return undefined;
    if (isPackage) return "рахує сервер (3 год із 4)";
    return `≈ ${formatUah(hourlyEstimate(tariff, hours))}`;
}

function CartRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right text-gray-900">{value || "—"}</dd>
        </div>
    );
}

interface BookingCreatedProps {
    booking: Booking;
    onFindCheckIn: (token: string) => void;
    onReset: () => void;
}

function BookingCreated({ booking, onFindCheckIn, onReset }: BookingCreatedProps) {
    return (
        <div role="status" className="flex max-w-xl flex-col gap-4 rounded-xl border border-green-200 bg-green-50 p-5">
            <h3 className="text-base font-semibold text-green-900">Бронь створено</h3>
            <dl className="flex flex-col gap-2 text-sm">
                <CartRow label="Клієнт" value={`${booking.clientName} · ${booking.phone}`} />
                <CartRow label="Місце" value={`${booking.zoneName}, ${booking.computerName}`} />
                <CartRow label="Час" value={`${formatDateTime(booking.startTime)} – ${formatDateTime(booking.endTime)}`} />
                <CartRow label="Сума" value={formatUah(booking.prepaidAmount)} />
                <CartRow label="Токен" value={booking.qrCode ?? undefined} />
            </dl>
            <div className="flex gap-2">
                {booking.qrCode && (
                    <Button onClick={() => onFindCheckIn(booking.qrCode as string)}>Знайти чек-іном</Button>
                )}
                <Button variant="secondary" onClick={onReset}>
                    Нова бронь
                </Button>
            </div>
        </div>
    );
}
