import type { ReactNode } from "react";
import { StatusBadge } from "../../ui";
import type { CheckInCard } from "../../services/bookings/bookings.types";
import { formatDateTime, formatUah } from "./bookings.labels";

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-b-0">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-right text-gray-900">{children}</dd>
        </div>
    );
}

//Card from the technical specification: phone number, name, zone, seat, time, payment status. Check-in does not start a session. Receipt printing — Week 5
export function CheckInCardView({ card }: { card: CheckInCard }) {
    return (
        <article className="max-w-xl rounded-xl border border-gray-200 bg-white p-5">
            <header className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">Бронь знайдено</h3>
                {card.sessionStarted && <StatusBadge tone="info">Сесія вже йде</StatusBadge>}
            </header>

            <dl className="text-sm">
                <Row label="Телефон">{card.phone}</Row>
                <Row label="Ім'я">{card.clientName}</Row>
                <Row label="Зона">{card.zoneName}</Row>
                <Row label="Місце">{card.placeName}</Row>
                <Row label="Час">
                    {formatDateTime(card.startTime)} – {formatDateTime(card.endTime)} ({card.durationHours} год
                    {card.isPackage3Plus1 ? ", пакет 3+1" : ""})
                </Row>
                <Row label="Оплата">
                    <StatusBadge tone={card.isPaidOnline ? "success" : "warning"}>{card.paymentStatus}</StatusBadge>
                </Row>
                <Row label="Сума">{formatUah(card.prepaidAmount)}</Row>
                {card.extras.length > 0 && (
                    <Row label="Допи">{card.extras.map((e) => `${e.name} × ${e.quantity}`).join(", ")}</Row>
                )}
            </dl>

            <p className="mt-3 text-xs text-gray-500">Чек-ін лише знаходить бронь і не стартує сесію.</p>
        </article>
    );
}
