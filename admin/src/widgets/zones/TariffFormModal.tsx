import { useForm } from "react-hook-form";
import { Button, Input, Modal, Select } from "../../ui";
import { useCreateTariff, useUpdateTariff } from "../../hooks/tariffs/tariffs.hooks";
import type { Tariff, TariffType } from "../../services/tariffs/tariffs.types";
import type { Zone } from "../../services/zones/zones.types";
import { ActionError } from "./SectionHeader";
import { TARIFF_TYPES, TARIFF_TYPE_LABEL, errorText } from "./zones.labels";

interface TariffFormValues {
    name: string;
    type: TariffType;
    price: number;
    durationMinutes: number | undefined;
    zoneId: string;
}

interface TariffFormModalProps {
    tariff: Tariff | null;//null — створення
    zones: Zone[];
    onClose: () => void;
}

const FORM_ID = "tariff-form";

export function TariffFormModal({ tariff, zones, onClose }: TariffFormModalProps) {
    const create = useCreateTariff();
    const update = useUpdateTariff();
    const mutation = tariff ? update : create;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TariffFormValues>({
        defaultValues: {
            name: tariff?.name ?? "",
            type: tariff?.type ?? "HOURLY",
            price: tariff?.price ?? 50,
            durationMinutes: tariff?.durationMinutes,
            zoneId: tariff?.zoneId ?? "",
        },
    });

    const onSubmit = handleSubmit(async (values) => {
        const input = {
            name: values.name.trim(),
            type: values.type,
            price: values.price,
            durationMinutes: values.durationMinutes,
            zoneId: values.zoneId || undefined,
        };
        try {
            if (tariff) await update.mutateAsync({ id: tariff.id, input });
            else await create.mutateAsync(input);
            onClose();
        } catch {
            // помилку показує mutation.error
        }
    });

    return (
        <Modal
            open
            onClose={onClose}
            title={tariff ? "Редагувати тариф" : "Новий тариф"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={mutation.isPending}>
                        Зберегти
                    </Button>
                </>
            }
        >
            <form
                id={FORM_ID}
                noValidate
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                    void onSubmit(e);
                }}
            >
                <ActionError message={mutation.isError ? errorText(mutation.error) : null} />

                <Input
                    label="Назва"
                    error={errors.name?.message}
                    {...register("name", { required: "Введіть назву" })}
                />

                <Select label="Тип" {...register("type")}>
                    {TARIFF_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {TARIFF_TYPE_LABEL[type]}
                        </option>
                    ))}
                </Select>

                <Input
                    label="Ціна, грн"
                    type="number"
                    step="0.01"
                    error={errors.price?.message}
                    {...register("price", {
                        valueAsNumber: true,
                        required: "Вкажіть ціну",
                        min: { value: 0, message: "Ціна не може бути від'ємною" },
                    })}
                />

                <Input
                    label="Тривалість, хв"
                    type="number"
                    hint="Необов'язково"
                    {...register("durationMinutes", {
                        setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)),
                    })}
                />

                <Select label="Зона" hint="Без зони тариф діє для всіх" {...register("zoneId")}>
                    <option value="">Усі зони</option>
                    {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                            {zone.name}
                        </option>
                    ))}
                </Select>
            </form>
        </Modal>
    );
}
