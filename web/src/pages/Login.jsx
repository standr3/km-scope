import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  School,
  Shield,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

const HERO_IMAGES = {
  member: "/images/member-login-hero.jpg",
  organization: "/images/organization-login-hero.jpg",
};

const PORTALS = {
  organization: {
    eyebrow: "School management",
    title: "For organizations",
    description:
      "Access the administrative side of the platform for school setup, teacher management and institution-level control.",
    heroKicker: "School management portal",
    heroTitle: "Manage your institution with clarity.",
    heroText:
      "Organize teachers, classes and school-level workflows in one structured workspace.",
    benefits: [
      "Manage school-level access and settings.",
      "Organize teachers, classes and ownership.",
      "Continue directly to the administrator dashboard.",
    ],
    icon: Building2,
  },
  member: {
    eyebrow: "Teacher & student access",
    title: "For teachers & students",
    description:
      "Access the collaborative learning side of the platform for classes, projects and validated knowledge maps.",
    heroKicker: "Member workspace",
    heroTitle: "Welcome back to your learning space.",
    heroText:
      "Continue classroom collaboration, review contributions and work with validated knowledge maps.",
    benefits: [
      "Open your teacher or student workspace.",
      "Continue working on classes and projects.",
      "Review concepts, links and classroom activity.",
    ],
    icon: UsersRound,
  },
};

function getApiMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function getRoleLabel(role) {
  if (role === "teacher") return "Teacher";
  if (role === "student") return "Student";
  return "Member";
}

function BackNavButton({ onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition",
        "hover:bg-slate-50 hover:text-slate-950",
        className,
      ].join(" ")}
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}

function DarkField({ id, label, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </label>

      {children}
    </div>
  );
}

function DarkInput({ id, className = "", ...props }) {
  return (
    <input
      id={id}
      className={[
        "h-11 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white shadow-sm outline-none transition",
        "placeholder:text-slate-500",
        "hover:border-white/20",
        "focus:border-slate-400 focus:ring-2 focus:ring-slate-500/30",
        "disabled:cursor-not-allowed disabled:bg-white/[0.03] disabled:text-slate-500",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

function LightField({ id, label, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function LightInput({ id, className = "", ...props }) {
  return (
    <input
      id={id}
      className={[
        "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition",
        "placeholder:text-slate-400",
        "hover:border-slate-300",
        "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

function BenefitItem({ children, dark = false }) {
  return (
    <li className="flex items-start gap-4">
      <span
        className={[
          "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm",
          dark ? "bg-white text-slate-950" : "bg-slate-900 text-white",
        ].join(" ")}
      >
        <Check size={15} strokeWidth={3} />
      </span>

      <span
        className={[
          "text-sm leading-6",
          dark ? "text-slate-300" : "text-slate-600",
        ].join(" ")}
      >
        {children}
      </span>
    </li>
  );
}

function ActionError({ message, dark = false }) {
  if (!message) return null;

  return (
    <div
      className={[
        "rounded-lg px-3 py-2 text-sm font-medium",
        dark
          ? "border border-rose-300/20 bg-rose-500/10 text-rose-200"
          : "border border-rose-200 bg-rose-50 text-rose-700",
      ].join(" ")}
    >
      {message}
    </div>
  );
}

function StatusCard({
  icon: Icon,
  tone,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  loading,
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "danger"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={[
          "mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset",
          toneClass,
        ].join(" ")}
      >
        <Icon size={20} />
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {primaryLabel ? (
          <button
            type="button"
            onClick={onPrimary}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {primaryLabel}
          </button>
        ) : null}

        {secondaryLabel ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PortalOption({ portalKey, onSelect }) {
  const portal = PORTALS[portalKey];
  const Icon = portal.icon;

  return (
    <section className="flex min-h-[50vh] items-center justify-center px-6 py-16 text-center lg:min-h-screen lg:px-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-sm">
          <Icon size={14} />
          {portal.eyebrow}
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          {portal.title}
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-slate-600">
          {portal.description}
        </p>

        <button
          type="button"
          onClick={() => onSelect(portalKey)}
          className="mt-14 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          <LogIn size={16} />
          Login
        </button>

        <div className="mt-20 text-sm text-slate-600">
          {portalKey === "organization" ? (
            <p>
              Don’t have a school account?{" "}
              <Link
                to="/signup/school"
                className="font-semibold text-slate-950 underline underline-offset-4 hover:text-slate-700"
              >
                Request access
              </Link>
            </p>
          ) : (
            <p>
              Don’t have an account?{" "}
              <span className="font-semibold text-slate-950">
                Ask your school administrator.
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function LoginChoiceScreen({ onSelect, onBack, sceneClass }) {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <BackNavButton onClick={onBack} />
      </div>

      <main
        className={[
          "relative grid min-h-screen lg:grid-cols-2",
          sceneClass,
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-slate-200/70 via-white to-sky-100/40" />

        <div className="relative border-b border-slate-200 lg:border-b-0 lg:border-r">
          <PortalOption portalKey="organization" onSelect={onSelect} />
        </div>

        <div className="relative">
          <PortalOption portalKey="member" onSelect={onSelect} />
        </div>
      </main>
    </div>
  );
}

function MemberHero() {
  const portal = PORTALS.member;
  const imageUrl = HERO_IMAGES.member;

  return (
    <section
      className="relative min-h-[280px] overflow-hidden lg:min-h-screen"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(2,6,23,0.85), rgba(2,6,23,0.72)), url("${imageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.12),transparent_30%)]" />

      <div className="relative flex h-full min-h-[280px] flex-col justify-between p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-2 text-white">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur ring-1 ring-white/10">
            <UsersRound size={18} />
          </div>

          <span className="text-sm font-semibold tracking-wide text-slate-200">
            Knowledge Maps
          </span>
        </div>

        <div className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            {portal.heroKicker}
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {portal.heroTitle}
          </h2>

          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
            {portal.heroText}
          </p>

          <ul className="mt-8 space-y-4">
            {portal.benefits.map((benefit) => (
              <BenefitItem key={benefit} dark>
                {benefit}
              </BenefitItem>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function MemberDarkCard({ children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.14),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.08),transparent_30%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function MemberIntroHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-7">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-slate-200 ring-1 ring-white/10">
        <Icon size={18} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {eyebrow}
      </p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
        {title}
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function MemberFormPane({
  memberStep,
  memberEmail,
  onMemberEmailChange,
  memberLoginPassword,
  onMemberLoginPasswordChange,
  memberSetupForm,
  onMemberSetupChange,
  memberInvite,
  onCheckMemberAccess,
  onMemberLogin,
  onAcceptMemberInvite,
  onBackToChoice,
  onResetMember,
  submitting,
  error,
}) {
  const emailDisabled = submitting || !memberEmail.trim();
  const loginDisabled = submitting || !memberLoginPassword;
  const setupDisabled =
    submitting || !memberSetupForm.name.trim() || !memberSetupForm.password;

  return (
    <section className="relative flex min-h-[420px] items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:min-h-screen lg:px-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onBackToChoice}
          className="mb-6 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {memberStep === "email" ? (
          <MemberDarkCard>
            <MemberIntroHeader
              icon={Mail}
              eyebrow="Member access"
              title="Start with your school email."
              description="Teacher and student accounts are created by invitation. Enter the email address your school administrator invited."
            />

            <form
              onSubmit={onCheckMemberAccess}
              className="grid gap-5"
              autoComplete="off"
            >
              <ActionError message={error} dark />

              <DarkField id="member_email" label="Email">
                <DarkInput
                  id="member_email"
                  type="email"
                  placeholder="name@example.com"
                  value={memberEmail}
                  onChange={onMemberEmailChange}
                  required
                  disabled={submitting}
                />
              </DarkField>

              <button
                type="submit"
                disabled={emailDisabled}
                className={[
                  "mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition",
                  "hover:bg-slate-100",
                  "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                  "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
                ].join(" ")}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    Continue
                    <LogIn size={16} />
                  </>
                )}
              </button>
            </form>
          </MemberDarkCard>
        ) : null}

        {memberStep === "login" ? (
          <MemberDarkCard>
            <MemberIntroHeader
              icon={Shield}
              eyebrow="Existing member"
              title="Login to your account."
              description="This email already has an account. Enter your password to continue."
            />

            <form
              onSubmit={onMemberLogin}
              className="grid gap-5"
              autoComplete="off"
            >
              <ActionError message={error} dark />

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Email
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-white">
                  {memberEmail}
                </p>
              </div>

              <DarkField id="member_password" label="Password">
                <DarkInput
                  id="member_password"
                  type="password"
                  placeholder="••••••••"
                  value={memberLoginPassword}
                  onChange={onMemberLoginPasswordChange}
                  required
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </DarkField>

              <button
                type="submit"
                disabled={loginDisabled}
                className={[
                  "mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition",
                  "hover:bg-slate-100",
                  "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                  "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
                ].join(" ")}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Login
                    <LogIn size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onResetMember}
                className="text-sm font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
              >
                Use another email
              </button>
            </form>
          </MemberDarkCard>
        ) : null}

        {memberStep === "setup" ? (
          <MemberDarkCard>
            <MemberIntroHeader
              icon={UserRound}
              eyebrow="Invitation found"
              title="Set up your profile."
              description="Create your account details. After setup, your school administrator still needs to approve your access."
            />

            <form
              onSubmit={onAcceptMemberInvite}
              className="grid gap-5"
              autoComplete="off"
            >
              <ActionError message={error} dark />

              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Invitation
                </p>

                <p className="mt-1 break-words text-sm font-semibold text-white">
                  {memberEmail}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {memberInvite?.school_name || "Your school"} invited you as{" "}
                  <span className="font-semibold text-white">
                    {getRoleLabel(memberInvite?.user_role)}
                  </span>
                  .
                </p>
              </div>

              <DarkField id="member_name" label="Name">
                <DarkInput
                  id="member_name"
                  placeholder="Your name"
                  value={memberSetupForm.name}
                  onChange={onMemberSetupChange("name")}
                  required
                  disabled={submitting}
                />
              </DarkField>

              <DarkField id="member_setup_password" label="Password">
                <DarkInput
                  id="member_setup_password"
                  type="password"
                  placeholder="••••••••"
                  value={memberSetupForm.password}
                  onChange={onMemberSetupChange("password")}
                  required
                  autoComplete="new-password"
                  disabled={submitting}
                />
              </DarkField>

              <button
                type="submit"
                disabled={setupDisabled}
                className={[
                  "mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm transition",
                  "hover:bg-slate-100",
                  "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                  "disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400",
                ].join(" ")}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <KeyRound size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onResetMember}
                className="text-sm font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
              >
                Use another email
              </button>
            </form>
          </MemberDarkCard>
        ) : null}

        {memberStep === "not_invited" ? (
          <StatusCard
            icon={XCircle}
            tone="danger"
            title="No invitation found"
            message="This email does not have a pending invitation. Ask your school administrator to invite you before creating a teacher or student account."
            primaryLabel="Use another email"
            onPrimary={onResetMember}
            secondaryLabel="Back"
            onSecondary={onBackToChoice}
          />
        ) : null}
      </div>
    </section>
  );
}

function MemberLoginScreen(props) {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <main
        className={[
          "grid min-h-screen lg:grid-cols-[1.15fr_0.85fr]",
          props.sceneClass,
        ].join(" ")}
      >
        <MemberHero />

        <MemberFormPane {...props} />
      </main>
    </div>
  );
}

function OrganizationInfoPanel({ orgStep, school }) {
  const imageUrl = HERO_IMAGES.organization;

  return (
    <aside
      className="relative hidden min-h-screen overflow-hidden bg-slate-950 lg:block"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(2,6,23,0.9), rgba(15,23,42,0.82)), url("${imageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(148,163,184,0.2),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_30%)]" />

      <div className="relative flex min-h-screen flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
            <School size={20} />
          </div>

          <div>
            <p className="text-sm font-semibold">Knowledge Maps</p>
            <p className="text-xs text-slate-400">Organization workspace</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
            School management
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-white">
            Request access, get approved, then create your administrator.
          </h2>

          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            Organization access is separate from teacher and student login. The
            school request must be approved before the first admin account can
            be created.
          </p>

          <div className="mt-8 grid gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <Clock3 size={18} className="mt-0.5 text-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Approval controlled by platform owner
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Until approval, the school remains pending and cannot create
                    an administrator account.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
              <div className="flex items-start gap-3">
                <KeyRound size={18} className="mt-0.5 text-slate-300" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    First admin setup
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    After approval, the school contact can create the first
                    administrator account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Current step
          </p>

          <p className="mt-2 text-sm font-semibold text-white">
            {orgStep === "contact" && "Verify school access request"}
            {orgStep === "pending" && "Waiting for approval"}
            {orgStep === "rejected" && "Request rejected"}
            {orgStep === "setup" && "Create first administrator"}
            {orgStep === "login" && "Administrator login"}
          </p>

          {school?.name ? (
            <p className="mt-1 text-sm text-slate-400">{school.name}</p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function OrganizationFormPane({
  orgStep,
  school,
  contactEmail,
  onContactEmailChange,
  adminForm,
  onAdminChange,
  loginForm,
  onLoginChange,
  onCheckAccess,
  onSetupAdmin,
  onLoginAdmin,
  onBackToChoice,
  onResetToContact,
  submitting,
  error,
}) {
  const contactDisabled = submitting || !contactEmail.trim();
  const setupDisabled =
    submitting || !adminForm.admin_email.trim() || !adminForm.password;
  const loginDisabled =
    submitting || !loginForm.email.trim() || !loginForm.password;

  return (
    <section className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onBackToChoice}
          className="mb-8 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {orgStep === "contact" ? (
          <div>
            <div className="mb-8">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Building2 size={20} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Organization access
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                Continue with your school account.
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Enter the contact email used when the school access request was
                created.
              </p>
            </div>

            <form onSubmit={onCheckAccess} className="grid gap-5">
              <ActionError message={error} />

              <LightField id="org_contact_email" label="School contact email">
                <LightInput
                  id="org_contact_email"
                  type="email"
                  placeholder="office@school.edu"
                  value={contactEmail}
                  onChange={onContactEmailChange}
                  disabled={submitting}
                  required
                />
              </LightField>

              <button
                type="submit"
                disabled={contactDisabled}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    Continue
                    <LogIn size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : null}

        {orgStep === "pending" ? (
          <StatusCard
            icon={Clock3}
            tone="warning"
            title="Request pending"
            message="Your school access request is still waiting for approval. After approval, you will be able to create the first administrator account."
            primaryLabel="Check again"
            onPrimary={onCheckAccess}
            secondaryLabel="Use another email"
            onSecondary={onResetToContact}
            loading={submitting}
          />
        ) : null}

        {orgStep === "rejected" ? (
          <StatusCard
            icon={XCircle}
            tone="danger"
            title="Request rejected"
            message="This school access request was rejected. Use another contact email or submit a new request."
            primaryLabel="Use another email"
            onPrimary={onResetToContact}
          />
        ) : null}

        {orgStep === "setup" ? (
          <div>
            <div className="mb-8">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle2 size={20} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Approved school
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                Set up the first administrator.
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {school?.name
                  ? `${school.name} was approved. Create the first administrator account.`
                  : "Your school was approved. Create the first administrator account."}
              </p>
            </div>

            <form onSubmit={onSetupAdmin} className="grid gap-5">
              <ActionError message={error} />

              <LightField id="admin_name" label="Admin name">
                <LightInput
                  id="admin_name"
                  placeholder="Demo Admin"
                  value={adminForm.name}
                  onChange={onAdminChange("name")}
                  disabled={submitting}
                />
              </LightField>

              <LightField id="admin_email" label="Admin email">
                <LightInput
                  id="admin_email"
                  type="email"
                  placeholder="admin@school.edu"
                  value={adminForm.admin_email}
                  onChange={onAdminChange("admin_email")}
                  disabled={submitting}
                  required
                />
              </LightField>

              <LightField id="admin_password" label="Password">
                <LightInput
                  id="admin_password"
                  type="password"
                  placeholder="••••••••"
                  value={adminForm.password}
                  onChange={onAdminChange("password")}
                  disabled={submitting}
                  required
                />
              </LightField>

              <button
                type="submit"
                disabled={setupDisabled}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating admin…
                  </>
                ) : (
                  <>
                    Create admin account
                    <KeyRound size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : null}

        {orgStep === "login" ? (
          <div>
            <div className="mb-8">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Shield size={20} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                School management login
              </p>

              <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                Login as administrator.
              </h1>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {school?.name
                  ? `${school.name} is ready. Use your administrator credentials to continue.`
                  : "Use your administrator credentials to continue."}
              </p>
            </div>

            <form onSubmit={onLoginAdmin} className="grid gap-5">
              <ActionError message={error} />

              <LightField id="org_admin_email" label="Admin email">
                <LightInput
                  id="org_admin_email"
                  type="email"
                  placeholder="admin@school.edu"
                  value={loginForm.email}
                  onChange={onLoginChange("email")}
                  disabled={submitting}
                  required
                />
              </LightField>

              <LightField id="org_admin_password" label="Password">
                <LightInput
                  id="org_admin_password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={onLoginChange("password")}
                  disabled={submitting}
                  required
                />
              </LightField>

              <button
                type="submit"
                disabled={loginDisabled}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Login
                    <LogIn size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onResetToContact}
                className="text-sm font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950"
              >
                Use another school contact email
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function OrganizationLoginScreen(props) {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <main
        className={[
          "grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]",
          props.sceneClass,
        ].join(" ")}
      >
        <OrganizationFormPane {...props} />

        <OrganizationInfoPanel
          orgStep={props.orgStep}
          school={props.school}
        />
      </main>
    </div>
  );
}

export default function Login() {
  const {
    login,
    refetchAuth,
    checkOrganizationAccess,
    setupOrganizationAdmin,
    checkMemberInvite,
    acceptMemberInvite,
  } = useAuth();

  const nav = useNavigate();

  const [view, setView] = React.useState("choice");
  const [portal, setPortal] = React.useState(null);
  const [sceneClass, setSceneClass] = React.useState("scene-enter");

  const [memberStep, setMemberStep] = React.useState("email");
  const [memberEmail, setMemberEmail] = React.useState("");
  const [memberLoginPassword, setMemberLoginPassword] = React.useState("");
  const [memberInvite, setMemberInvite] = React.useState(null);
  const [memberSetupForm, setMemberSetupForm] = React.useState({
    name: "",
    password: "",
  });

  const [orgStep, setOrgStep] = React.useState("contact");
  const [orgContactEmail, setOrgContactEmail] = React.useState("");
  const [selectedSchool, setSelectedSchool] = React.useState(null);

  const [orgAdminForm, setOrgAdminForm] = React.useState({
    name: "",
    admin_email: "",
    password: "",
  });

  const [orgLoginForm, setOrgLoginForm] = React.useState({
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const timeoutsRef = React.useRef([]);

  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const resetActionState = () => {
    setSubmitting(false);
    setError("");
  };

  const redirectByRoles = (roles) => {
    if (roles.includes("admin")) {
      nav("/dashboard/admin/teachers", { replace: true });
      return;
    }

    if (roles.includes("teacher")) {
      nav("/dashboard/teacher/classes", { replace: true });
      return;
    }

    nav("/dashboard/notes", { replace: true });
  };

  const resetMemberFlow = () => {
    resetActionState();
    setMemberStep("email");
    setMemberEmail("");
    setMemberLoginPassword("");
    setMemberInvite(null);
    setMemberSetupForm({
      name: "",
      password: "",
    });
  };

  const goToPortal = (nextPortal) => {
    clearTimers();
    resetActionState();

    const exitClass =
      nextPortal === "member" ? "scene-exit-right" : "scene-exit-left";
    const enterClass =
      nextPortal === "member" ? "scene-enter-right" : "scene-enter-left";

    setSceneClass(exitClass);

    const t1 = setTimeout(() => {
      setPortal(nextPortal);
      setView("login");
      setSceneClass(enterClass);
    }, 360);

    const t2 = setTimeout(() => {
      setSceneClass("");
    }, 980);

    timeoutsRef.current.push(t1, t2);
  };

  const backToChoice = () => {
    clearTimers();
    resetActionState();
    setView("choice");
    setPortal(null);
    setSceneClass("scene-enter");

    resetMemberFlow();

    setOrgStep("contact");
    setSelectedSchool(null);
  };

  const resetOrganizationToContact = () => {
    resetActionState();
    setOrgStep("contact");
    setSelectedSchool(null);
  };

  const onOrgAdminChange = (k) => (e) => {
    setOrgAdminForm((s) => ({ ...s, [k]: e.target.value }));
  };

  const onOrgLoginChange = (k) => (e) => {
    setOrgLoginForm((s) => ({ ...s, [k]: e.target.value }));
  };

  const onMemberSetupChange = (k) => (e) => {
    setMemberSetupForm((s) => ({ ...s, [k]: e.target.value }));
  };

  async function handleCheckMemberAccess(e) {
    e.preventDefault();

    if (submitting || !memberEmail.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const result = await checkMemberInvite({
        email: memberEmail.trim(),
      });

      if (result.status === "EXISTING_USER") {
        setMemberInvite(null);
        setMemberLoginPassword("");
        setMemberStep("login");
        return;
      }

      if (result.status === "INVITED") {
        setMemberInvite(result.invite);
        setMemberSetupForm({
          name: "",
          password: "",
        });
        setMemberStep("setup");
        return;
      }

      setError("Unexpected member access status.");
    } catch (err) {
      const status = err?.response?.data?.status;

      if (status === "NOT_INVITED") {
        setMemberStep("not_invited");
        setError("");
        return;
      }

      setError(
        getApiMessage(
          err,
          "Could not check member access for this email."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMemberLogin(e) {
    e.preventDefault();

    if (submitting || !memberEmail.trim() || !memberLoginPassword) return;

    try {
      setSubmitting(true);
      setError("");

      await login({
        email: memberEmail.trim(),
        password: memberLoginPassword,
      });

      const r = await refetchAuth();
      const roles = r.data?.roles || [];

      redirectByRoles(roles);
    } catch (err) {
      setError(getApiMessage(err, "Could not sign in. Check your password."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcceptMemberInvite(e) {
    e.preventDefault();

    if (
      submitting ||
      !memberEmail.trim() ||
      !memberSetupForm.name.trim() ||
      !memberSetupForm.password
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const result = await acceptMemberInvite({
        email: memberEmail.trim(),
        name: memberSetupForm.name.trim(),
        password: memberSetupForm.password,
      });

      redirectByRoles(result.roles || []);
    } catch (err) {
      setError(getApiMessage(err, "Could not create member account."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOrganizationAccess(e) {
    e?.preventDefault();

    if (submitting || !orgContactEmail.trim()) return;

    try {
      setSubmitting(true);
      setError("");

      const result = await checkOrganizationAccess({
        contact_email: orgContactEmail.trim(),
      });

      setSelectedSchool(result.school || null);

      if (result.status === "PENDING") {
        setOrgStep("pending");
        return;
      }

      if (result.status === "REJECTED") {
        setOrgStep("rejected");
        return;
      }

      if (result.status === "NEEDS_ADMIN_SETUP") {
        setOrgStep("setup");
        return;
      }

      if (result.status === "READY") {
        setOrgStep("login");
        return;
      }

      setError("Unexpected organization access status.");
    } catch (err) {
      setSelectedSchool(null);
      setOrgStep("contact");
      setError(
        getApiMessage(
          err,
          "No school access request was found for this contact email."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetupOrganizationAdmin(e) {
    e.preventDefault();

    if (
      submitting ||
      !selectedSchool?.id ||
      !orgAdminForm.admin_email.trim() ||
      !orgAdminForm.password
    ) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const result = await setupOrganizationAdmin({
        school_id: selectedSchool.id,
        admin_email: orgAdminForm.admin_email.trim(),
        password: orgAdminForm.password,
        name: orgAdminForm.name.trim() || null,
      });

      redirectByRoles(result.roles || ["admin"]);
    } catch (err) {
      setError(
        getApiMessage(err, "Could not create the administrator account.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOrganizationLogin(e) {
    e.preventDefault();

    if (submitting || !orgLoginForm.email.trim() || !orgLoginForm.password) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await login({
        email: orgLoginForm.email.trim(),
        password: orgLoginForm.password,
      });

      const r = await refetchAuth();
      const roles = r.data?.roles || [];

      redirectByRoles(roles);
    } catch (err) {
      setError(getApiMessage(err, "Could not sign in. Check your credentials."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>
        {`
          @keyframes sceneEnter {
            0% {
              opacity: 0;
              transform: scale(0.97) translateY(18px);
              filter: blur(6px);
            }

            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
              filter: blur(0);
            }
          }

          @keyframes sceneExitRight {
            0% {
              opacity: 1;
              transform: scale(1) translateX(0);
              filter: blur(0);
            }

            100% {
              opacity: 0;
              transform: scale(0.94) translateX(84px);
              filter: blur(4px);
            }
          }

          @keyframes sceneExitLeft {
            0% {
              opacity: 1;
              transform: scale(1) translateX(0);
              filter: blur(0);
            }

            100% {
              opacity: 0;
              transform: scale(0.94) translateX(-84px);
              filter: blur(4px);
            }
          }

          @keyframes sceneEnterRight {
            0% {
              opacity: 0;
              transform: scale(0.975) translateX(64px);
              filter: blur(6px);
            }

            100% {
              opacity: 1;
              transform: scale(1) translateX(0);
              filter: blur(0);
            }
          }

          @keyframes sceneEnterLeft {
            0% {
              opacity: 0;
              transform: scale(0.975) translateX(-64px);
              filter: blur(6px);
            }

            100% {
              opacity: 1;
              transform: scale(1) translateX(0);
              filter: blur(0);
            }
          }

          .scene-enter {
            animation: sceneEnter 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .scene-exit-right {
            animation: sceneExitRight 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .scene-exit-left {
            animation: sceneExitLeft 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .scene-enter-right {
            animation: sceneEnterRight 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .scene-enter-left {
            animation: sceneEnterLeft 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        `}
      </style>

      {view === "choice" ? (
        <LoginChoiceScreen
          onSelect={goToPortal}
          onBack={() => nav(-1)}
          sceneClass={sceneClass}
        />
      ) : null}

      {view === "login" && portal === "member" ? (
        <MemberLoginScreen
          sceneClass={sceneClass}
          memberStep={memberStep}
          memberEmail={memberEmail}
          onMemberEmailChange={(e) => setMemberEmail(e.target.value)}
          memberLoginPassword={memberLoginPassword}
          onMemberLoginPasswordChange={(e) =>
            setMemberLoginPassword(e.target.value)
          }
          memberSetupForm={memberSetupForm}
          onMemberSetupChange={onMemberSetupChange}
          memberInvite={memberInvite}
          onCheckMemberAccess={handleCheckMemberAccess}
          onMemberLogin={handleMemberLogin}
          onAcceptMemberInvite={handleAcceptMemberInvite}
          onBackToChoice={backToChoice}
          onResetMember={resetMemberFlow}
          submitting={submitting}
          error={error}
        />
      ) : null}

      {view === "login" && portal === "organization" ? (
        <OrganizationLoginScreen
          sceneClass={sceneClass}
          orgStep={orgStep}
          school={selectedSchool}
          contactEmail={orgContactEmail}
          onContactEmailChange={(e) => setOrgContactEmail(e.target.value)}
          adminForm={orgAdminForm}
          onAdminChange={onOrgAdminChange}
          loginForm={orgLoginForm}
          onLoginChange={onOrgLoginChange}
          onCheckAccess={handleCheckOrganizationAccess}
          onSetupAdmin={handleSetupOrganizationAdmin}
          onLoginAdmin={handleOrganizationLogin}
          onBackToChoice={backToChoice}
          onResetToContact={resetOrganizationToContact}
          submitting={submitting}
          error={error}
        />
      ) : null}
    </>
  );
}