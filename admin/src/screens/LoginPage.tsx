import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation } from "react-router";
import type { ApiError } from "../services/api/http-client";
import { selectIsAdminSession, useAuthStore } from "../hooks/auth.store";
import { Button, Input } from "../ui";

interface LoginFormValues {
    login: string;
    password: string;
}

function errorText(error: unknown): string {
    const apiError = error as Partial<ApiError>;
    if (apiError.status === null) {
        return "Не вдалося з’єднатися із сервером. Перевірте, чи запущено API.";
    }
    return apiError.message ?? "Не вдалося увійти. Спробуйте ще раз.";
}

export function LoginPage() {
    const isAdmin = useAuthStore(selectIsAdminSession);
    const signIn = useAuthStore((state) => state.signIn);
    const location = useLocation();
    const [formError, setFormError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({ defaultValues: { login: "", password: "" } });

    const onSubmit = handleSubmit(async (values) => {
        setFormError(null);
        try {
            await signIn(values.login.trim(), values.password);
        } catch (e) {
            setFormError(errorText(e));
        }
    });

    if (isAdmin) {
        const from = (location.state as { from?: string } | null)?.from;
        return <Navigate to={from && from !== "/login" ? from : "/"} replace />;
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <form
                aria-labelledby="login-title"
                noValidate
                className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6"
                onSubmit={(e) => {
                    void onSubmit(e);
                }}
            >
                <div>
                    <h1 id="login-title" className="text-xl font-semibold text-gray-900">
                        Вхід в адмінку
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Увійдіть за email або телефоном і паролем.
                    </p>
                </div>

                {formError && (
                    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {formError}
                    </p>
                )}

                <Input
                    label="Email або телефон"
                    autoComplete="username"
                    error={errors.login?.message}
                    {...register("login", {
                        validate: (value) => value.trim() !== "" || "Введіть email або телефон",
                    })}
                />

                <Input
                    label="Пароль"
                    type="password"
                    autoComplete="current-password"
                    error={errors.password?.message}
                    {...register("password", { required: "Введіть пароль" })}
                />

                <Button type="submit" loading={isSubmitting}>
                    Увійти
                </Button>
            </form>
        </main>
    );
}
