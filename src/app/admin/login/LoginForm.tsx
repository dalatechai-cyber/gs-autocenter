"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction, type LoginState } from "../actions";

const INITIAL: LoginState = { error: null };

export default function LoginForm() {
  const [state, action] = useActionState(loginAction, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-[0.24em] text-graphite">
          Нууц үг
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          autoFocus
          required
          className="h-12 border border-charcoal/80 bg-ink-card px-4 text-base text-paper outline-none transition-colors duration-150 ease-out focus:border-gs-red"
        />
      </label>

      {state.error ? (
        <p
          role="alert"
          className="bg-gs-red/10 px-3 py-2 text-sm text-gs-red"
        >
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="pressable cta-shine h-12 bg-gs-red text-snow text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-150 ease-out hover:bg-gs-red-600 disabled:opacity-60"
    >
      {pending ? "Шалгаж байна…" : "Нэвтрэх"}
    </button>
  );
}
