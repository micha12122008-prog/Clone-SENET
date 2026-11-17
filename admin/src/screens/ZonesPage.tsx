import { useState } from "react";
import { Button } from "../ui";
import { PlacesSection, TariffsSection, ZonesSection } from "../widgets/zones";

const TABS = [
    { key: "zones", label: "Зони" },
    { key: "places", label: "Місця" },
    { key: "tariffs", label: "Тарифи" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ZonesPage() {
    const [tab, setTab] = useState<TabKey>("zones");

    return (
        <section className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-gray-900">Зони, місця і тарифи</h1>

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

            {tab === "zones" && <ZonesSection />}
            {tab === "places" && <PlacesSection />}
            {tab === "tariffs" && <TariffsSection />}
        </section>
    );
}
