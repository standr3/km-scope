import React, { useEffect, useState } from "react";
import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Product", opensMenu: true },
  { label: "For Teachers", opensMenu: true },
  { label: "For Schools", opensMenu: true },
  { label: "Contact", href: "#contact", opensMenu: false },
];

const dropdownItems = [
  {
    title: "Knowledge Maps",
    description:
      "Build visual maps of the concepts students need to understand for a lesson.",
  },
  {
    title: "Peer Review",
    description:
      "Students can approve or reject concepts and connections proposed by their classmates.",
  },
  {
    title: "Teacher Validation",
    description:
      "Teachers make the final decision and turn the map into a validated learning structure.",
  },
];

const desktopPreviewNodes = [
  {
    id: "1",
    position: { x: 1090, y: 200 },
    data: { label: <span className="text-slate-900">Lesson Scope</span> },
  },
  {
    id: "2",
    position: { x: 1480, y: 400 },
    data: { label: <span className="text-slate-900">Student Concept</span> },
  },
  {
    id: "3",
    position: { x: 1260, y: 600 },
    data: { label: <span className="text-slate-900">Teacher Validation</span> },
  },
];

const compactPreviewNodes = [
  {
    id: "1",
    position: { x: 24, y: 650 },
    data: { label: <span className="text-slate-900">Lesson Scope</span> },
  },
  {
    id: "2",
    position: { x: 200, y: 750 },
    data: { label: <span className="text-slate-900">Student Concept</span> },
  },
  {
    id: "3",
    position: { x: 24, y: 800 },
    data: { label: <span className="text-slate-900">Teacher Validation</span> },
  },
];

const previewEdges = [
  {
    id: "1-2",
    source: "1",
    target: "2",
    type: "smoothstep",
  },
  {
    id: "2-3",
    source: "2",
    target: "3",
    type: "smoothstep",
  },
];

const processSteps = [
  {
    title: "Create a project",
    description:
      "A teacher starts a project around a lesson, topic, seminar or exam preparation session.",
  },
  {
    title: "Students contribute",
    description:
      "Students add concepts and connections that they believe are important for understanding the lesson.",
  },
  {
    title: "The class reviews",
    description:
      "Students approve or reject contributions before the teacher makes the final validation.",
  },
  {
    title: "The teacher validates",
    description:
      "Approved concepts become part of the trusted map and rejected ones become learning feedback.",
  },
];

const insightItems = [
  {
    title: "Concept understanding",
    description:
      "See which students identify relevant concepts and which areas are misunderstood.",
  },
  {
    title: "Review accuracy",
    description:
      "Track how often students agree with the teacher’s final validation.",
  },
  {
    title: "Learning behavior",
    description:
      "Identify participation patterns such as initiative, hesitation and peer-review reliability.",
  },
];

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

function HeroReactFlowCanvas() {
  const isCompact = useMediaQuery("(max-width: 1279px)");
  const nodes = isCompact ? compactPreviewNodes : desktopPreviewNodes;

  return (
    <ReactFlow
      key={isCompact ? "compact-flow" : "desktop-flow"}
      defaultNodes={nodes}
      defaultEdges={previewEdges}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      onlyRenderVisibleElements
      className={[
        "[&_.react-flow__node]:rounded-xl",
        "[&_.react-flow__node]:border",
        "[&_.react-flow__node]:border-slate-200",
        "[&_.react-flow__node]:bg-white",
        "[&_.react-flow__node]:px-4",
        "[&_.react-flow__node]:py-2",
        "[&_.react-flow__node]:text-sm",
        "[&_.react-flow__node]:font-semibold",
        "[&_.react-flow__node]:shadow-sm",
        "[&_.react-flow__edge-path]:stroke-slate-300",
      ].join(" ")}
    >
      <Background color="#e2e8f0" gap={24} />
    </ReactFlow>
  );
}

function HeaderNavItem({ item, onMenuChange }) {
  if (item.href) {
    return (
      <a
        href={item.href}
        onMouseEnter={() => onMenuChange(false)}
        onFocus={() => onMenuChange(false)}
        className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950 focus:outline-none"
      >
        {item.label}
      </a>
    );
  }

  return (
    <button
      type="button"
      onMouseEnter={() => onMenuChange(item.opensMenu)}
      onFocus={() => onMenuChange(item.opensMenu)}
      className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:bg-slate-100 focus:text-slate-950 focus:outline-none"
    >
      {item.label}
    </button>
  );
}

export default function WelcomePage({ onLogin }) {
  const [isAtTop, setIsAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleScroll = (event) => {
    const nextIsAtTop = event.currentTarget.scrollTop <= 1;

    setIsAtTop((current) => {
      if (current === nextIsAtTop) {
        return current;
      }

      return nextIsAtTop;
    });

    if (!nextIsAtTop) {
      setMenuOpen(false);
    }
  };

  const headerIsHidden = !isAtTop;

  return (
    <div
      onScroll={handleScroll}
      className="h-screen overflow-y-auto bg-slate-50 text-slate-950"
    >
      <header
        className={`fixed left-0 top-0 z-50 h-20 w-full border-b border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur transition-all duration-300 ease-in-out ${
          headerIsHidden ? "-translate-y-20" : "translate-y-0"
        }`}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="text-base font-bold tracking-tight text-slate-950"
          >
            KmScope
          </Link>

          <nav className="hidden h-full items-center gap-1 text-sm md:flex">
            {navItems.map((item) => (
              <HeaderNavItem
                key={item.label}
                item={item}
                onMenuChange={setMenuOpen}
              />
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              onClick={onLogin}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Login
            </Link>

            <Link
              to="/signup"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Request access
            </Link>
          </div>

          <button
            type="button"
            aria-expanded={menuOpen}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm md:hidden"
            onClick={() => setMenuOpen((current) => !current)}
          >
            Menu
          </button>
        </div>

        <div
          className={`absolute left-0 top-20 w-full border-b border-slate-200 bg-white text-slate-950 shadow-lg transition-[max-height,opacity] duration-300 ${
            menuOpen
              ? "max-h-[calc(100vh-80px)] overflow-y-auto opacity-100 md:max-h-[420px]"
              : "max-h-0 overflow-hidden opacity-0"
          }`}
        >
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8 lg:py-6">
            {dropdownItems.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <div className="h-4 w-4 rounded-full bg-slate-900" />
                </div>

                <h3 className="text-base font-semibold text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-semibold text-slate-950">
                Invite-only onboarding
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Schools can request access. Teachers and students join later
                through administrator invitations.
              </p>

              <div className="mt-5 grid gap-2">
                <Link
                  to="/signup/school"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  Request access
                </Link>

                <Link
                  to="/login"
                  onClick={onLogin}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[860px] overflow-hidden bg-slate-50 xl:min-h-screen">
          <div className="absolute inset-0 opacity-80">
            <HeroReactFlowCanvas />
          </div>

          <div className="pointer-events-none relative z-10 px-4 pt-32 sm:px-6 sm:pt-36 lg:px-8 xl:pt-40">
            <div className="mx-auto w-full max-w-7xl">
              <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Collaborative knowledge mapping
                </p>

                <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  Turn lessons into validated knowledge maps.
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Students propose the concepts and connections they believe
                  matter. Classmates review them. Teachers validate the final
                  map and get a clearer view of how the class understands the
                  lesson.
                </p>

                <div className="pointer-events-auto mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup/school"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
                  >
                    Request school access
                  </Link>

                  <Link
                    to="/login"
                    onClick={onLogin}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                How it works
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                A project becomes the shared space for understanding a lesson.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600">
                Each project contains a map of concepts and relationships.
                Students contribute to it, review each other’s work and learn
                from the teacher’s final validation.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {processSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                    {index + 1}
                  </div>

                  <h3 className="text-base font-semibold text-slate-950">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Teacher validation
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Not every concept belongs in the map.
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-base leading-7 text-slate-600 shadow-sm sm:p-8">
              <p>
                A good concept is relevant to the lesson, has the right level
                of detail and helps students understand the topic. It should not
                be too generic, too narrow or disconnected from the subject.
              </p>

              <p className="mt-5">
                When a teacher rejects a concept, the connected relationships
                can also become invalid. This makes the graph more than a visual
                board: it becomes a structured model of what the class is
                expected to understand.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto w-full max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Learning insights
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                See how students think, not only what they submit.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600">
                Reviews, contributions and teacher decisions can reveal
                patterns in how students identify, evaluate and connect ideas.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {insightItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-base font-semibold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="border-t border-slate-200 bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Access
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Start with a school access request.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-300">
                Organization accounts are approved first. After approval, the
                first administrator can invite teachers and students by email.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                to="/signup/school"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-100"
              >
                Request school access
              </Link>

              <Link
                to="/login"
                onClick={onLogin}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}