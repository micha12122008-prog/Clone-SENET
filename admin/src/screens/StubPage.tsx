import { useCallback, useState } from "react";
import { Button, Input, Modal, StatusBadge, Table, type Column } from "../ui";
import { StubService } from "../services/stub.service";
import type { ApiError } from "../services/api/http-client";

interface StubPageProps {
    title: string;
}

interface SentItem {
    id: number;
    text: string;
    ok: boolean;
}

const columns: Column<SentItem>[] = [
    { key: "text", header: "Текст", render: (item) => item.text },
    {
        key: "status",
        header: "Статус",
        render: (item) => (
            <StatusBadge tone={item.ok ? "success" : "danger"}>
                {item.ok ? "Відправлено" : "Помилка"}
            </StatusBadge>
        ),
    },
];

export function StubPage({ title }: StubPageProps) {
    const [text, setText] = useState("");
    const [fieldError, setFieldError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<SentItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const closeError = useCallback(() => setErrorMessage(null), []);

    const addToHistory = (value: string, ok: boolean) =>
        setHistory((prev) => [{ id: Date.now(), text: value, ok }, ...prev]);

    async function handleSubmit() {
        const value = text.trim();
        if (!value) {
            setFieldError("Введіть текст");
            return;
        }

        setFieldError(undefined);
        setLoading(true);
        try {
            await StubService.send(value);
            addToHistory(value, true);
            setText("");
        } catch (e) {
            addToHistory(value, false);
            setErrorMessage((e as ApiError).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="flex max-w-2xl flex-col gap-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Розділ у розробці. Нижче демо: поле, кнопка й запит через API-клієнт.
                </p>
            </div>

            <form
                className="flex items-start gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
            >
                <div className="flex-1">
                    <Input
                        placeholder="Введіть текст"
                        aria-label="Текст для відправки"
                        value={text}
                        error={fieldError}
                        onChange={(e) => {
                            setText(e.target.value);
                            if (fieldError) setFieldError(undefined);
                        }}
                    />
                </div>
                <Button type="submit" loading={loading}>
                    Відправити
                </Button>
            </form>

            <Table
                columns={columns}
                data={history}
                getRowId={(item) => item.id}
                emptyText="Ще нічого не відправлено"
            />

            <Modal
                open={errorMessage !== null}
                onClose={closeError}
                title="Не вдалося відправити"
                size="sm"
                footer={
                    <Button variant="secondary" onClick={closeError}>
                        Закрити
                    </Button>
                }
            >
                <p className="text-sm text-gray-700">{errorMessage}</p>
            </Modal>
        </section>
    );
}
