import { useState } from "react";
import { Button, Input, QueryState } from "../../ui";
import { useCheckIn } from "../../hooks/bookings/bookings.hooks";
import type { CheckInLookup } from "../../services/bookings/bookings.types";
import { CheckInCardView } from "./CheckInCardView";
import { QrScanner } from "./QrScanner";
import { normalizePhone } from "./bookings.labels";

type Mode = "token" | "phone" | "camera";

const MODES: { key: Mode; label: string }[] = [
    { key: "token", label: "Токен" },
    { key: "phone", label: "Телефон" },
    { key: "camera", label: "Камера" },
];

interface CheckInSectionProps {
    lookup: CheckInLookup | null;
    onLookup: (lookup: CheckInLookup | null) => void;
}

export function CheckInSection({ lookup, onLookup }: CheckInSectionProps) {
    const [mode, setMode] = useState<Mode>(lookup?.phone ? "phone" : "token");
    const [token, setToken] = useState(lookup?.token ?? "");
    const [phone, setPhone] = useState(lookup?.phone ?? "");
    const [fieldError, setFieldError] = useState<string | undefined>();

    const query = useCheckIn(lookup);

    const submit = () => {
        if (mode === "token") {
            const value = token.trim();
            if (!value) return setFieldError("Вставте токен");
            setFieldError(undefined);
            onLookup({ token: value });
        } else {
            const value = normalizePhone(phone);
            if (value.replace(/\D/g, "").length < 10) return setFieldError("Введіть номер телефону повністю");
            setFieldError(undefined);
            onLookup({ phone: value });
        }
    };

    const handleScan = (value: string) => {
        setToken(value);
        setMode("token");
        onLookup({ token: value });
    };

    return (
        <section className="flex flex-col gap-4">
            <div role="tablist" aria-label="Спосіб чек-іну" className="flex gap-2">
                {MODES.map((item) => (
                    <Button
                        key={item.key}
                        role="tab"
                        aria-selected={mode === item.key}
                        size="sm"
                        variant={mode === item.key ? "primary" : "secondary"}
                        onClick={() => {
                            setMode(item.key);
                            setFieldError(undefined);
                        }}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>

            {mode === "camera" ? (
                <QrScanner onDetect={handleScan} />
            ) : (
                <form
                    className="flex max-w-xl items-start gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                    }}
                >
                    <div className="flex-1">
                        {mode === "token" ? (
                            <Input
                                aria-label="Токен броні"
                                placeholder="QR_BOOK_…"
                                value={token}
                                error={fieldError}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        ) : (
                            <Input
                                aria-label="Телефон клієнта"
                                placeholder="+380…"
                                inputMode="tel"
                                value={phone}
                                error={fieldError}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        )}
                    </div>
                    <Button type="submit" loading={lookup !== null && query.isFetching}>
                        Знайти
                    </Button>
                </form>
            )}

            {lookup && (
                <QueryState query={query}>{(card) => <CheckInCardView card={card} />}</QueryState>
            )}
        </section>
    );
}
