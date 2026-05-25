"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  type FieldError,
  type UseFormRegisterReturn,
} from "react-hook-form";

interface BaseFieldProps {
  label: string;
  error?: FieldError;
  className?: string;
  required?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
  type?: "input";
  inputType?: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  disabled?: boolean;
}

interface SelectFieldProps extends BaseFieldProps {
  type: "select";
  placeholder?: string;
  options: { label: string; value: string }[];
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

type FormFieldProps = InputFieldProps | SelectFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, error, className, required } = props;
  const id = React.useId();

  return (
    <div className={cn("", className)}>
      <label
        htmlFor={id}
        className="block text-sm font-body font-medium text-navy-700 mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {props.type === "select" ? (
        <select
          id={id}
          value={props.value}
          onChange={(e) => props.onValueChange(e.target.value)}
          disabled={props.disabled}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 bg-white focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors disabled:opacity-50",
            error && "border-red-400 focus:ring-red-400/50 focus:border-red-400"
          )}
        >
          {props.placeholder && (
            <option value="" disabled>
              {props.placeholder}
            </option>
          )}
          {props.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={props.inputType ?? "text"}
          placeholder={props.placeholder}
          disabled={props.disabled}
          {...props.registration}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border border-navy-200 text-sm font-body text-navy-800 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-colors disabled:opacity-50",
            error && "border-red-400 focus:ring-red-400/50 focus:border-red-400"
          )}
        />
      )}

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      ) : null}
    </div>
  );
}
