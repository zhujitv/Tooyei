"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/site";

const formCopy: Record<Locale, { placeholder: string; submit: string; invalid: string; pending: string }> = {
  zh: {
    placeholder: "您的邮箱地址",
    submit: "订阅",
    invalid: "请输入有效的邮箱地址。",
    pending: "订阅功能正在准备中，请直接联系我们获取最新资料。",
  },
  en: {
    placeholder: "Your email address",
    submit: "Subscribe",
    invalid: "Please enter a valid email address.",
    pending: "Newsletter subscriptions are being prepared. Please contact us directly for the latest materials.",
  },
  es: {
    placeholder: "Su correo electrónico",
    submit: "Suscribirse",
    invalid: "Introduzca un correo electrónico válido.",
    pending: "La suscripción está en preparación. Contáctenos para recibir las últimas novedades.",
  },
  de: {
    placeholder: "Ihre E-Mail-Adresse",
    submit: "Abonnieren",
    invalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    pending: "Der Newsletter wird vorbereitet. Kontaktieren Sie uns für aktuelle Unterlagen.",
  },
};

export function NewsletterForm({ locale }: { locale: Locale }) {
  const labels = formCopy[locale];
  const [message, setMessage] = useState("");
  const [invalid, setInvalid] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("email") as HTMLInputElement;

    if (!input.validity.valid) {
      setInvalid(true);
      setMessage(labels.invalid);
      input.focus();
      return;
    }

    setInvalid(false);
    setMessage(labels.pending);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-xl" aria-label={labels.submit}>
      <div className="flex border-b border-[var(--navy)]/25 focus-within:border-[var(--gold)]">
        <label htmlFor="newsletter-email" className="sr-only">
          {labels.placeholder}
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={labels.placeholder}
          aria-invalid={invalid}
          aria-describedby="newsletter-message"
          onChange={() => {
            if (invalid) setInvalid(false);
            if (message) setMessage("");
          }}
          className="min-h-14 min-w-0 flex-1 bg-transparent px-1 text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)]/75"
        />
        <button
          type="submit"
          className="group inline-flex min-h-14 items-center gap-3 px-3 text-sm font-semibold text-[var(--navy)] transition-colors hover:text-[var(--gold)]"
        >
          {labels.submit}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
      <p
        id="newsletter-message"
        role={invalid ? "alert" : "status"}
        className={`mt-3 min-h-6 text-sm leading-6 ${invalid ? "text-red-700" : "text-[var(--muted)]"}`}
      >
        {message}
      </p>
    </form>
  );
}
