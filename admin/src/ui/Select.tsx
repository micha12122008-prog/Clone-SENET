import { useId, type ComponentProps } from "react";
import { cn } from "../helpers/cn.ts";

export interface SelectProps extends ComponentProps<"select"> {
    label?: string;
    error?: string;
    hint?: string;
}

export function Select({ label, error, hint, className, id, children, ...rest }: SelectProps) {
    const autoId = useId();
    const selectId = id ?? autoId;
    const messageId = `${selectId}-message`;
    const message = error ?? hint;

    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                aria-invalid={error ? true : undefined}
                aria-describedby={message ? messageId : undefined}
                className={cn(
                    "h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900",
                    "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-600",
                    "disabled:cursor-not-allowed disabled:bg-gray-100",
                    error ? "border-red-500" : "border-gray-300",
                    className,
                )}
                {...rest}
            >
                {children}
            </select>
            {message && (
                <p id={messageId} className={cn("text-xs", error ? "text-red-600" : "text-gray-500")}>
                    {message}
                </p>
            )}
        </div>
    );
}
