import { useNavigate } from "react-router";
import { Button } from "../ui";

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-6xl font-bold text-gray-300">404</p>
            <h1 className="text-2xl font-semibold text-gray-900">Сторінку не знайдено</h1>
            <p className="max-w-md text-sm text-gray-500">
                Такої адреси немає, або сторінку було переміщено. Перевірте посилання або поверніться на головну.
            </p>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate(-1)}>
                    Назад
                </Button>
                <Button onClick={() => navigate("/")}>На головну</Button>
            </div>
        </section>
    );
}