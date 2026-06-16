import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  LogIn,
  School,
} from "lucide-react";

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

function BackLink() {
  return (
    <Link
      to="/"
      className="mb-5 flex h-10 w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
    >
      <ArrowLeft size={16} />
      Back
    </Link>
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

export default function SignupChoice() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="max-w-2xl">
          <BackLink />

          <PageBadge icon={School}>
            Access setup
          </PageBadge>

          <h1 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
            Start with
            <span className="mt-2 block text-5xl font-light tracking-tight text-slate-700 sm:text-6xl">
              school access.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Schools request organization access first. Teachers and students no
            longer create public accounts; they join later through administrator
            invitations.
          </p>

          <ul className="mt-10 space-y-5">
            <BenefitItem>
              Schools submit an access request and wait for approval.
            </BenefitItem>

            <BenefitItem>
              After approval, the first administrator account can be created.
            </BenefitItem>

            <BenefitItem>
              Administrators invite teachers and students by email.
            </BenefitItem>

            <BenefitItem>
              Invited members set up their account and wait for admin approval.
            </BenefitItem>
          </ul>
        </section>

        <section className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-slate-300/50 blur-3xl" />

          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl sm:p-6 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />

            <div className="relative grid gap-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-950 shadow-sm">
                  <Building2 size={20} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Organization
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  Request school access
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Submit your school details. After the request is approved, you
                  can create the first administrator account.
                </p>

                <Link
                  to="/signup/school"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100"
                >
                  Request access
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-slate-200 ring-1 ring-white/10">
                  <GraduationCap size={20} />
                </div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Teachers & students
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
                  Join by administrator invitation
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Teacher and student accounts are no longer registered
                  publicly. Use Member Login with the email invited by your
                  school administrator.
                </p>

                <Link
                  to="/login"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                >
                  Go to login
                  <LogIn size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}