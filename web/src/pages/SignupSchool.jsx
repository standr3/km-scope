import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
} from "lucide-react";

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 flex h-10 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}

function PageBadge({ icon: Icon, children }) {
  return (
    <div className="mb-8 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
      <Icon size={14} />
      {children}
    </div>
  );
}

function Field({ id, label, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </label>

      {children}
    </div>
  );
}

function TextInput({ id, className = "", ...props }) {
  return (
    <input
      id={id}
      className={[
        "h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-white shadow-sm outline-none transition",
        "placeholder:text-slate-500",
        "hover:border-white/20",
        "focus:border-slate-400 focus:ring-2 focus:ring-slate-500/30",
        "disabled:cursor-not-allowed disabled:bg-white/[0.02] disabled:text-slate-500",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

function BenefitItem({ children }) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
        <Check size={15} strokeWidth={3} />
      </span>

      <span className="text-sm leading-6 text-slate-600">{children}</span>
    </li>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-slate-200 ring-1 ring-white/10">
        <Icon size={16} />
      </span>

      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  );
}

function ActionError({ message }) {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200">
      {message}
    </div>
  );
}

function SuccessCard({ school, onLogin }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

      <div className="relative">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
          <CheckCircle2 size={22} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Request submitted
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
          Your school request is pending approval.
        </h2>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          {school?.name
            ? `${school.name} was registered as a pending school access request.`
            : "Your school was registered as a pending access request."}{" "}
          After approval, use Organization Login with the school contact email.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Contact email
          </p>

          <p className="mt-1 break-words text-sm font-semibold text-white">
            {school?.contact_email || "—"}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            If the request is still pending, login will show a waiting screen.
            After approval, the first administrator setup becomes available.
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100"
          >
            Go to login
            <ArrowRight size={16} />
          </button>

          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupSchool() {
  const { registerSchool } = useAuth();
  const nav = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [submittedSchool, setSubmittedSchool] = useState(null);
  const [error, setError] = useState("");

  const [school, setSchool] = useState({
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
  });

  const onS = (k) => (e) => {
    setSchool((s) => ({ ...s, [k]: e.target.value }));
  };

  const disabled =
    submitting || !school.name.trim() || !school.contact_email.trim();

  async function onSubmit(e) {
    e.preventDefault();

    if (disabled) return;

    try {
      setSubmitting(true);
      setError("");

      const result = await registerSchool({
        school: {
          name: school.name.trim(),
          address: school.address.trim() || null,
          contact_email: school.contact_email.trim(),
          contact_phone: school.contact_phone.trim() || null,
        },
      });

      setSubmittedSchool(result.school || school);
    } catch (err) {
      setError(getApiMessage(err, "Could not submit school access request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <style>
        {`
          @keyframes signupPageIn {
            0% {
              opacity: 0;
              transform: scale(0.965) translateY(18px);
              filter: blur(6px);
            }

            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0);
            }
          }

          .signup-page-enter {
            animation: signupPageIn 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
            transform-origin: center center;
          }
        `}
      </style>

      <main className="signup-page-enter mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="max-w-2xl">
          <BackButton onClick={() => nav(-1)} />

          <PageBadge icon={GraduationCap}>
            School access request
          </PageBadge>

          <h1 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Request access
            <span className="mt-2 block text-5xl font-light tracking-tight text-slate-700 sm:text-6xl">
              for your school.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Submit the school details for approval. The administrator account is
            created later, after the request is approved.
          </p>

          <ul className="mt-10 space-y-5">
            <BenefitItem>
              Create a pending access request for the school workspace.
            </BenefitItem>

            <BenefitItem>
              Use the contact email later in Organization Login to check the
              approval status.
            </BenefitItem>

            <BenefitItem>
              After approval, create the first administrator account securely.
            </BenefitItem>

            <BenefitItem>
              Continue into the school management dashboard after admin setup.
            </BenefitItem>
          </ul>
        </section>

        <section className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-slate-300/50 blur-3xl" />

          {submittedSchool ? (
            <SuccessCard
              school={submittedSchool}
              onLogin={() => nav("/login")}
            />
          ) : (
            <form
              onSubmit={onSubmit}
              className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl sm:p-6 lg:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

              <div className="relative">
                <div className="mb-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Request access
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                    School details
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Fill in the school information. No administrator account is
                    created until the request is approved.
                  </p>
                </div>

                <div className="grid gap-7">
                  <ActionError message={error} />

                  <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
                    <SectionHeader icon={Building2} title="School info" />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Field id="school_name" label="School name*">
                          <TextInput
                            id="school_name"
                            placeholder="School name"
                            value={school.name}
                            onChange={onS("name")}
                            disabled={submitting}
                            required
                          />
                        </Field>
                      </div>

                      <div className="sm:col-span-2">
                        <Field id="school_address" label="Address">
                          <TextInput
                            id="school_address"
                            placeholder="Street, city"
                            value={school.address}
                            onChange={onS("address")}
                            disabled={submitting}
                          />
                        </Field>
                      </div>

                      <Field id="school_contact_email" label="Contact email*">
                        <TextInput
                          id="school_contact_email"
                          type="email"
                          placeholder="office@school.edu"
                          value={school.contact_email}
                          onChange={onS("contact_email")}
                          disabled={submitting}
                          required
                        />
                      </Field>

                      <Field id="school_contact_phone" label="Contact phone">
                        <TextInput
                          id="school_contact_phone"
                          placeholder="+40..."
                          value={school.contact_phone}
                          onChange={onS("contact_phone")}
                          disabled={submitting}
                        />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-sm">
                    <SectionHeader icon={Mail} title="Approval flow" />

                    <div className="space-y-3 text-sm leading-6 text-slate-400">
                      <p>
                        The request will be created with{" "}
                        <span className="font-semibold text-white">
                          PENDING
                        </span>{" "}
                        status.
                      </p>

                      <p>
                        After platform approval, use the contact email in
                        Organization Login to create the first administrator
                        account.
                      </p>
                    </div>
                  </section>

                  <button
                    type="submit"
                    disabled={disabled}
                    className={[
                      "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition",
                      "hover:bg-slate-100",
                      "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                      "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
                    ].join(" ")}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Request access
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}