import { useForm } from "react-hook-form";
import { Button, Input, Modal, Select } from "../../ui";
import { useCreateZone, useUpdateZone } from "../../hooks/zones/zones.hooks";
import { BACKEND_ACCEPTS_DEVICE_TYPE } from "../../services/zones/zones.service";
import type { DeviceType, Zone } from "../../services/zones/zones.types";
import { ActionError } from "./SectionHeader";
import { DEVICE_TYPES, errorText } from "./zones.labels";

interface ZoneFormValues {
    name: string;
    description: string;
    baseHourlyRate: number;
    colorHex: string;
    deviceType: DeviceType;
    isActive: boolean;
}

interface ZoneFormModalProps {
    /** null — створення нової зони. Модалку монтують лише відкритою, тож форма щоразу чиста. */
    zone: Zone | null;
    onClose: () => void;
}

const FORM_ID = "zone-form";

export function ZoneFormModal({ zone, onClose }: ZoneFormModalProps) {
    const create = useCreateZone();
    const update = useUpdateZone();
    const mutation = zone ? update : create;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ZoneFormValues>({
        defaultValues: {
            name: zone?.name ?? "",
            description: zone?.description ?? "",
            baseHourlyRate: zone?.baseHourlyRate ?? 50,
            colorHex: zone?.colorHex ?? "#3B82F6",
            deviceType: zone?.deviceType ?? "PC",
            isActive: zone?.isActive ?? true,
        },
    });

    const onSubmit = handleSubmit(async (values) => {
        try {
            if (zone) {
                await update.mutateAsync({
                    id: zone.id,
                    input: {
                        name: values.name.trim(),
                        baseHourlyRate: values.baseHourlyRate,
                        colorHex: values.colorHex,
                        isActive: values.isActive,
                    },
                });
            } else {
                await create.mutateAsync({
                    name: values.name.trim(),
                    description: values.description.trim() || undefined,
                    baseHourlyRate: values.baseHourlyRate,
                    colorHex: values.colorHex,
                    deviceType: values.deviceType,
                });
            }
            onClose();
        } catch {
            // помилку показує mutation.error
        }
    });

    return (
        <Modal
            open
            onClose={onClose}
            title={zone ? "Редагувати зону" : "Нова зона"}
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

                {!zone && <Input label="Опис" {...register("description")} />}

                {BACKEND_ACCEPTS_DEVICE_TYPE && !zone && (
                    <Select label="Тип" {...register("deviceType")}>
                        {DEVICE_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </Select>
                )}

                <Input
                    label="Тариф, грн за годину"
                    type="number"
                    step="0.01"
                    error={errors.baseHourlyRate?.message}
                    {...register("baseHourlyRate", {
                        valueAsNumber: true,
                        required: "Вкажіть ціну",
                        min: { value: 0, message: "Ціна не може бути від'ємною" },
                    })}
                />

                <Input
                    label="Колір"
                    type="color"
                    className="p-1"
                    {...register("colorHex", { required: true })}
                />

                {zone && (
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" {...register("isActive")} />
                        Зона активна
                    </label>
                )}
            </form>
        </Modal>
    );
}
