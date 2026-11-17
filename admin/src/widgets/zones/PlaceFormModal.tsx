import { useForm } from "react-hook-form";
import { Button, Input, Modal, Select } from "../../ui";
import { useCreatePlace } from "../../hooks/places/places.hooks";
import type { PlaceSpecs } from "../../services/places/places.types";
import type { Zone } from "../../services/zones/zones.types";
import { ActionError } from "./SectionHeader";
import { errorText } from "./zones.labels";

interface PlaceFormValues {
    number: number;
    name: string;
    zoneId: string;
    cpu: string;
    gpu: string;
    ram: string;
    monitor: string;
}

const FORM_ID = "place-form";
const SPEC_FIELDS = [
    { key: "cpu", label: "Процесор" },
    { key: "gpu", label: "Відеокарта" },
    { key: "ram", label: "Пам'ять" },
    { key: "monitor", label: "Монітор" },
] as const;

export function PlaceFormModal({ zones, onClose }: { zones: Zone[]; onClose: () => void }) {
    const create = useCreatePlace();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PlaceFormValues>({
        defaultValues: { name: "", zoneId: zones[0]?.id ?? "", cpu: "", gpu: "", ram: "", monitor: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        const specs: PlaceSpecs = {};
        for (const { key } of SPEC_FIELDS) {
            const value = values[key].trim();
            if (value) specs[key] = value;
        }

        try {
            await create.mutateAsync({
                number: values.number,
                name: values.name.trim(),
                zoneId: values.zoneId,
                specs: Object.keys(specs).length > 0 ? specs : undefined,
            });
            onClose();
        } catch {
            // помилку показує create.error
        }
    });

    return (
        <Modal
            open
            onClose={onClose}
            title="Нове місце"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Скасувати
                    </Button>
                    <Button type="submit" form={FORM_ID} loading={create.isPending}>
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
                <ActionError message={create.isError ? errorText(create.error) : null} />

                <Select label="Зона" error={errors.zoneId?.message} {...register("zoneId", { required: "Оберіть зону" })}>
                    {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                            {zone.name}
                        </option>
                    ))}
                </Select>

                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Номер"
                        type="number"
                        error={errors.number?.message}
                        {...register("number", {
                            valueAsNumber: true,
                            required: "Вкажіть номер",
                            min: { value: 1, message: "Від 1" },
                        })}
                    />
                    <div className="col-span-2">
                        <Input
                            label="Назва"
                            placeholder="PC-01"
                            error={errors.name?.message}
                            {...register("name", { required: "Введіть назву" })}
                        />
                    </div>
                </div>

                <fieldset className="grid grid-cols-2 gap-4">{/*контейнер. Об'єднує пов'язані між собою елементи форми*/}
                    <legend className="mb-2 text-sm font-medium text-gray-700">Характеристики</legend>{/*заголовок для всієї групи полів*/}
                    {SPEC_FIELDS.map(({ key, label }) => (
                        <Input key={key} label={label} {...register(key)} />
                    ))}
                </fieldset>
            </form>
        </Modal>
    );
}
