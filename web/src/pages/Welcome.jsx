import React, { useEffect, useState } from "react";
import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const navItems = [
  { label: "Product", opensMenu: true },
  { label: "For Teachers", opensMenu: true },
  { label: "For Schools", opensMenu: true },
  { label: "Contact", opensMenu: false },
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
    position: { x: 800, y: 230 },
    data: { label: <span className="text-black">Lesson Scope</span> },
  },
  {
    id: "2",
    position: { x: 1080, y: 330 },
    data: { label: <span className="text-black">Student Concept</span> },
  },
  {
    id: "3",
    position: { x: 850, y: 470 },
    data: { label: <span className="text-black">Teacher Validation</span> },
  },
];

const compactPreviewNodes = [
  {
    id: "1",
    position: { x: 24, y: 500 },
    data: { label: <span className="text-black">Lesson Scope</span> },
  },
  {
    id: "2",
    position: { x: 170, y: 590 },
    data: { label: <span className="text-black">Student Concept</span> },
  },
  {
    id: "3",
    position: { x: 24, y: 700 },
    data: { label: <span className="text-black">Teacher Validation</span> },
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
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      onlyRenderVisibleElements
      className="[&_.react-flow__node]:text-black"
    >
      <Background />
    </ReactFlow>
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
      className="h-screen overflow-y-auto bg-black text-white"
    >
      <header
        className={`fixed left-0 top-0 z-50 h-[97px] w-full transition-all duration-300 ease-in-out ${
          headerIsHidden ? "-translate-y-[97px]" : "translate-y-0"
        } ${
          menuOpen
            ? "bg-white text-black"
            : "bg-black text-white hover:bg-white hover:text-black"
        }`}
        onMouseLeave={() => setMenuOpen(false)}
      >
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 sm:px-10 lg:px-16">
          <div className="font-bold">Knowledge Maps</div>

          <nav className="hidden h-full items-center gap-8 text-sm md:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onMouseEnter={() => setMenuOpen(item.opensMenu)}
                onFocus={() => setMenuOpen(item.opensMenu)}
                className="h-full border-b-2 border-transparent hover:border-current focus:border-current focus:outline-none"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            aria-expanded={menuOpen}
            className="md:hidden"
            onClick={() => setMenuOpen((current) => !current)}
          >
            Menu
          </button>
        </div>

        <div
          className={`absolute left-0 top-[97px] w-full bg-white text-black transition-[max-height,opacity] duration-300 ${
            menuOpen
              ? "max-h-[calc(100vh-97px)] overflow-y-auto opacity-100 md:max-h-[430px]"
              : "max-h-0 overflow-hidden opacity-0"
          }`}
        >
          <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-8 sm:px-10 md:grid-cols-2 lg:grid-cols-4 lg:px-16 lg:py-12">
            {dropdownItems.map((item) => (
              <div
                key={item.title}
                className="border-l border-neutral-200 pl-6 lg:pl-8"
              >
                <div className="mb-6 h-12 w-12 bg-neutral-900"></div>
                <h3 className="mb-4 text-xl font-semibold">{item.title}</h3>
                <p className="text-sm leading-6 text-neutral-500">
                  {item.description}
                </p>
              </div>
            ))}

            <div className="rounded-sm bg-neutral-100 p-6 lg:p-8">
              <h3 className="mb-4 text-xl font-semibold">Invite-only beta</h3>
              <p className="mb-6 text-sm leading-6 text-neutral-500">
                Schools and teachers can request access before creating
                classrooms and projects.
              </p>

              <button type="button" className="text-sm font-semibold">
                Request access →
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[920px] overflow-hidden bg-neutral-900 xl:min-h-screen">
          <div className="absolute inset-0">
            <HeroReactFlowCanvas />
          </div>

          <div className="pointer-events-none relative z-10 px-6 pt-[150px] sm:px-10 sm:pt-[170px] xl:px-16 xl:pt-[190px]">
            <div className="mx-auto w-full max-w-[1440px]">
              <div className="max-w-2xl">
                <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">
                  Collaborative knowledge mapping
                </p>

                <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Turn lessons into validated knowledge maps.
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-neutral-300 sm:text-lg">
                  Students propose the concepts and connections they believe
                  matter. Classmates review them. Teachers validate the final
                  map and get a clearer view of how the class understands the
                  lesson.
                </p>

                <div className="pointer-events-auto mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onLogin}
                    className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-black"
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Request access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-neutral-950 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
                How it works
              </p>

              <h2 className="text-3xl font-bold sm:text-4xl">
                A project becomes the shared space for understanding a lesson.
              </h2>

              <p className="mt-6 text-base leading-7 text-neutral-300">
                Each project contains a map of concepts and relationships.
                Students contribute to it, review each other’s work and learn
                from the teacher’s final validation.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {processSteps.map((step) => (
                <article
                  key={step.title}
                  className="border border-white/10 bg-white/[0.03] p-6"
                >
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-neutral-400">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-neutral-900 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
                Teacher validation
              </p>

              <h2 className="text-3xl font-bold sm:text-4xl">
                Not every concept belongs in the map.
              </h2>
            </div>

            <div className="space-y-6 text-base leading-7 text-neutral-300">
              <p>
                A good concept is relevant to the lesson, has the right level
                of detail and helps students understand the topic. It should not
                be too generic, too narrow or disconnected from the subject.
              </p>

              <p>
                When a teacher rejects a concept, the connected relationships
                can also become invalid. This makes the graph more than a visual
                board: it becomes a structured model of what the class is
                expected to understand.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-neutral-800 px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">
                Learning insights
              </p>

              <h2 className="text-3xl font-bold sm:text-4xl">
                See how students think, not only what they submit.
              </h2>

              <p className="mt-6 text-base leading-7 text-neutral-300">
                Reviews, contributions and teacher decisions can reveal
                patterns in how students identify, evaluate and connect ideas.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {insightItems.map((item) => (
                <article
                  key={item.title}
                  className="border border-white/10 bg-black/20 p-6"
                >
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-neutral-300">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}