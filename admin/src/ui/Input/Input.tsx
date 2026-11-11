import { useId, type ComponentProps } from "react";
import { cn } from "../../helpers/cn";

export interface InputProps extends ComponentProps<"input"> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900",
          "placeholder:text-gray-400",
          "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-blue-600",
          "disabled:cursor-not-allowed disabled:bg-gray-100",
          error ? "border-red-500" : "border-gray-300",
          className,
        )}
        {...rest}
      />
      {message && (
        <p id={messageId} className={cn("text-xs", error ? "text-red-600" : "text-gray-500")}>
          {message}
        </p>
      )}
    </div>
  );
}
