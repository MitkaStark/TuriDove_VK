"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {props.type === "select" ? (
        <Select
          value={props.value}
          onValueChange={props.onValueChange}
          disabled={props.disabled}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          type={props.inputType ?? "text"}
          placeholder={props.placeholder}
          disabled={props.disabled}
          {...props.registration}
          className={cn(error && "border-destructive")}
        />
      )}

      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  );
}
