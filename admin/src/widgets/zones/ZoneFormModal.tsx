import { useForm } from "react-hook-form";
import { Button, Input, Modal, Select } from "../../ui";
import { useCreateZone, useUpdateZone } from "../../hooks/zones/zones.hooks";
import type { DeviceType, Zone } from "../../services/zones/zones.types";
import { ActionError } from "./SectionHeader";
import { DEVICE_TYPES, errorText } from "./zones.labels";

interface ZoneFormValues {
    name: string;
    description: string;
    baseHourlyRate: number;
    colorHex: string;
    deviceType: DeviceType;
}

interface ZoneFormModalProps {
    // null — Creating a new zone. The modal is mounted only in an open state, ensuring the form is clean every time
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
        },
    });

    const onSubmit = handleSubmit(async (values) => {
        try {
            if (zone) {
                await update.mutateAsync({
                    id: zone.id,
                    input: {
                        name: values.name.trim(),
                        description: values.description.trim(),
                        baseHourlyRate: values.baseHourlyRate,
                        colorHex: values.colorHex,
                        deviceType: values.deviceType,
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
            //setPlaceStatus.error shows an error
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

                <Input label="Опис" {...register("description")} />

                <Select label="Тип" {...register("deviceType")}>
                    {DEVICE_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </Select>

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
            </form>
        </Modal>
    );
}
