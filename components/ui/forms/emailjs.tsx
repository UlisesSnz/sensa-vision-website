"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { stegaClean } from "next-sanity";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import SectionContainer, {
  ISectionContainer,
  ISectionPadding,
} from "@/components/ui/section-container";

type FormValues = Record<string, string>;

type FormFieldType = "text" | "email" | "tel" | "textarea";

interface FormEmailJsField {
  _key?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  fieldType?: FormFieldType;
  required?: boolean;
}

interface NormalizedFormEmailJsField {
  _key: string;
  name: string;
  label: string;
  placeholder: string;
  fieldType: FormFieldType;
  required: boolean;
}

interface FormEmailJsProps {
  padding: ISectionPadding;
  colorVariant: ISectionContainer["color"];
  stackAlign: "left" | "center";
  internalName: string;
  templateKey: "contact" | "quote" | "support";
  title: string;
  description: string;
  fields: FormEmailJsField[];
  consentText: string;
  buttonText: string;
  successMessage: string;
  errorMessage: string;
  formMessages: {
    required: string;
    invalidEmail: string;
    invalidPhone: string;
    sendMessage: string;
    contactSuccess: string;
    contactError: string;
  };
}

const emailValidator = z.string().email();
const phoneRegex = /^[0-9+()\-\s]{7,20}$/;
const validFieldTypes: FormFieldType[] = ["text", "email", "tel", "textarea"];

function toFieldType(value?: string): FormFieldType {
  if (value && validFieldTypes.includes(value as FormFieldType)) {
    return value as FormFieldType;
  }

  return "text";
}

function getFieldError(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return undefined;
}

function buildFieldSchema(
  field: NormalizedFormEmailJsField,
  messages: FormEmailJsProps["formMessages"],
): z.ZodType<string> {
  const label = field.label || field.name;

  if (field.fieldType === "email") {
    if (field.required !== false) {
      return z
        .string()
        .trim()
        .min(1, { message: `${label} ${messages.required}` })
        .email({ message: messages.invalidEmail });
    }

    return z
      .string()
      .trim()
      .refine(
        (value) =>
          value.length === 0 || emailValidator.safeParse(value).success,
        {
          message: messages.invalidEmail,
        },
      );
  }

  if (field.fieldType === "tel") {
    if (field.required !== false) {
      return z
        .string()
        .trim()
        .min(1, { message: `${label} ${messages.required}` })
        .regex(phoneRegex, { message: messages.invalidPhone });
    }

    return z
      .string()
      .trim()
      .refine((value) => value.length === 0 || phoneRegex.test(value), {
        message: messages.invalidPhone,
      });
  }

  if (field.required !== false) {
    return z
      .string()
      .trim()
      .min(1, { message: `${label} ${messages.required}` });
  }

  return z.string().trim();
}

export default function FormEmailJs({
  padding,
  colorVariant,
  stackAlign,
  internalName,
  templateKey,
  title,
  description,
  fields,
  consentText,
  buttonText,
  successMessage,
  errorMessage,
  formMessages = {
    required: "es obligatorio",
    invalidEmail: "Ingresa un correo electrónico válido",
    invalidPhone: "Ingresa un número de teléfono válido",
    sendMessage: "Enviar mensaje",
    contactSuccess: "Gracias, mensaje enviado correctamente.",
    contactError: "No pudimos enviar tu mensaje. Inténtalo de nuevo.",
  },
}: Partial<FormEmailJsProps>) {
  const pathname = usePathname();
  const [botField, setBotField] = useState("");

  const align = stegaClean(stackAlign) === "center" ? "center" : "left";
  const color = stegaClean(colorVariant) as ISectionContainer["color"];
  const cleanTitle = stegaClean(title);
  const cleanDescription = stegaClean(description);
  const cleanConsentText = stegaClean(consentText);
  const cleanButtonText = stegaClean(buttonText) || formMessages.sendMessage;
  const cleanSuccessMessage =
    stegaClean(successMessage) || formMessages.contactSuccess;
  const cleanErrorMessage =
    stegaClean(errorMessage) || formMessages.contactError;
  const cleanTemplateKey = stegaClean(templateKey) || "contact";
  const cleanInternalName = stegaClean(internalName) || "form-emailjs";

  const normalizedFields = useMemo(() => {
    const mapped = (fields || [])
      .map((field) => {
        const name = stegaClean(field?.name)?.trim();
        const label = stegaClean(field?.label)?.trim();

        if (!name || !label) {
          return null;
        }

        return {
          _key: field?._key || name,
          name,
          label,
          placeholder: stegaClean(field?.placeholder) || "",
          fieldType: toFieldType(stegaClean(field?.fieldType)),
          required: field?.required !== false,
        } satisfies NormalizedFormEmailJsField;
      })
      .filter((field): field is NormalizedFormEmailJsField => field !== null);

    const uniqueByName = new Map<string, NormalizedFormEmailJsField>();
    mapped.forEach((field) => {
      if (!uniqueByName.has(field.name)) {
        uniqueByName.set(field.name, field);
      }
    });

    return [...uniqueByName.values()];
  }, [fields]);

  const formSchema = useMemo(() => {
    const shape: Record<string, z.ZodType<string>> = {};

    normalizedFields.forEach((field) => {
      shape[field.name] = buildFieldSchema(field, formMessages);
    });

    return z.object(shape);
  }, [formMessages, normalizedFields]);

  const defaultValues = useMemo<FormValues>(() => {
    const entries = normalizedFields.map((field) => [field.name, ""] as const);
    return Object.fromEntries(entries);
  }, [normalizedFields]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const { isSubmitting } = form.formState;

  const onSubmit = useCallback(
    async (values: FormValues) => {
      try {
        const response = await fetch("/api/forms/emailjs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateKey: cleanTemplateKey,
            formName: cleanInternalName,
            pagePath: pathname,
            fields: values,
            botField,
          }),
        });

        await response.json().catch(() => ({}));

        if (!response.ok) {
          toast.error(cleanErrorMessage);
          return;
        }

        toast(cleanSuccessMessage);
        form.reset(defaultValues);
        setBotField("");
      } catch {
        toast.error(cleanErrorMessage);
      }
    },
    [
      botField,
      cleanErrorMessage,
      cleanInternalName,
      cleanSuccessMessage,
      cleanTemplateKey,
      defaultValues,
      form,
      pathname,
    ],
  );

  if (normalizedFields.length === 0) {
    return null;
  }

  return (
    <SectionContainer color={color} padding={padding}>
      <div
        className={cn(
          align === "center" ? "max-w-[48rem] text-center mx-auto" : undefined,
        )}
      >
        <div
          className={cn(color === "primary" ? "text-background" : undefined)}
        >
          {cleanTitle && (
            <h2 className="text-3xl md:text-5xl mb-4">{cleanTitle}</h2>
          )}
          {cleanDescription && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {cleanDescription}
            </p>
          )}
        </div>

        <Form {...form}>
          <form
            className="pt-8"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              value={botField}
              onChange={(event) => setBotField(event.target.value)}
            />

            <div className="grid grid-cols-1 gap-4">
              {normalizedFields.map((field) => {
                const error = getFieldError(form.formState.errors[field.name]);
                const placeholder = field.placeholder || field.label;

                return (
                  <div
                    key={field._key || field.name}
                    className={cn(align === "center" ? "text-left" : undefined)}
                  >
                    <label className="text-sm font-medium block mb-2">
                      {field.label}
                      {field.required ? " *" : ""}
                    </label>

                    {field.fieldType === "textarea" ? (
                      <textarea
                        {...form.register(field.name)}
                        rows={5}
                        placeholder={placeholder}
                        autoComplete="off"
                        data-1p-ignore
                        className="flex min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                    ) : (
                      <Input
                        {...form.register(field.name)}
                        type={field.fieldType}
                        placeholder={placeholder}
                        autoComplete="off"
                        data-1p-ignore
                      />
                    )}

                    {error && (
                      <p className="text-[0.8rem] font-medium text-destructive mt-1">
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div
              className={cn(
                "mt-6 flex flex-wrap gap-4",
                align === "center" ? "justify-center" : undefined,
              )}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-40"
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {cleanButtonText}
              </Button>
            </div>

            {cleanConsentText && (
              <p
                className={cn(
                  "mt-4 text-xs text-muted-foreground",
                  align === "center" ? "text-center" : undefined,
                )}
              >
                {cleanConsentText}
              </p>
            )}
          </form>
        </Form>
      </div>
    </SectionContainer>
  );
}
