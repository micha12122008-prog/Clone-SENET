import { useState } from "react";
import { Button } from "../ui";
import type { CheckInLookup } from "../services/bookings/bookings.types";
import { BookingsRegistrySection, CheckInSection, HallBookingSection } from "../widgets/bookings";

const TABS = [
    { key: "hall", label: "Нова бронь" },
    { key: "checkin", label: "Чек-ін" },
    { key: "registry", label: "Реєстр" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function BookingsPage() {
    const [tab, setTab] = useState<TabKey>("hall");
    //The search result lives here, to facilitate tab switching and allow the "Find via Check-in" feature to pass a token
    const [lookup, setLookup] = useState<CheckInLookup | null>(null);

    const goToCheckIn = (token: string) => {
        setLookup({ token });
        setTab("checkin");
    };

    return (
        <section className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-gray-900">Бронювання</h1>

            <div role="tablist" aria-label="Розділи" className="flex gap-2">
                {TABS.map((item) => (
                    <Button
                        key={item.key}
                        role="tab"
                        aria-selected={tab === item.key}
                        variant={tab === item.key ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setTab(item.key)}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>

            {tab === "hall" && <HallBookingSection onFindCheckIn={goToCheckIn} />}
            {tab === "checkin" && <CheckInSection lookup={lookup} onLookup={setLookup} />}
            {tab === "registry" && <BookingsRegistrySection onFindCheckIn={goToCheckIn} />}
        </section>
    );
}
