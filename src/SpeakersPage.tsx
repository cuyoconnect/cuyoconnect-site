import { useEffect, useId, useMemo, useState } from "react";

import { BlurText } from "@/components/ui/blur-text";
import { GitHubJoinCta } from "@/components/GitHubJoinCta";
import { SpeakerThanksOverlay } from "@/components/SpeakerThanksOverlay";
import { HERO_CONTENT_WIDTH_CLASS } from "@/lib/content-width";
import { heroTopicTailHighlight } from "@/lib/hero-topic-highlight";
import {
  submitSpeakerProposal,
  type SpeakerProposalDuration,
} from "@/lib/speaker-proposals";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

const PAGE_HEADING = "¿Querés ser speaker?";

const DURATION_OPTIONS = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
] as const;

const SPEAKERS_DRAFT_KEY = "cuyoconnect:speakers-draft-v1";

const GUIDANCE_ITEMS = [
  {
    title: "Título o tema",
    body: "Que se entienda en una línea de qué va la sesión.",
  },
  {
    title: "Idea central",
    body: "Qué vas a mostrar, contar o debatir.",
  },
  {
    title: "Formato",
    body: "Charla, workshop, debate, mesa u otro.",
  },
  {
    title: "Audiencia",
    body: "Para quién es y qué deberían saber antes.",
  },
] as const;

function parseDraft(raw: string | null): {
  topics: string;
  duration: (typeof DURATION_OPTIONS)[number]["value"];
} | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { topics?: unknown; duration?: unknown };
    const topics = typeof data.topics === "string" ? data.topics : "";
    const d = data.duration;
    const duration =
      d === "30" || d === "45" || d === "60" ? d : DURATION_OPTIONS[0]!.value;
    return { topics, duration };
  } catch {
    return null;
  }
}

export function SpeakersPage() {
  const topicsId = useId();
  const durationGroupId = useId();
  const { user, hasAuthConfigured, signInWithGitHub, isSigningIn } = useAuth();

  const [topics, setTopics] = useState("");
  const [duration, setDuration] =
    useState<(typeof DURATION_OPTIONS)[number]["value"]>("30");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [thanksOpen, setThanksOpen] = useState(false);
  const [thanksVariant, setThanksVariant] = useState<"proposal" | "community">(
    "proposal",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleTailHighlight = useMemo(() => heroTopicTailHighlight(2), []);

  const durationSegmentIndex = useMemo(
    () =>
      Math.max(0, DURATION_OPTIONS.findIndex((o) => o.value === duration)),
    [duration],
  );

  const meta = user?.user_metadata as
    | Record<string, string | undefined>
    | undefined;
  const login = meta?.user_name ?? meta?.preferred_username;
  const avatarUrl = meta?.avatar_url;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parseDraft(sessionStorage.getItem(SPEAKERS_DRAFT_KEY));
    if (parsed) {
      setTopics(parsed.topics);
      setDuration(parsed.duration);
    }
    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated || typeof window === "undefined") return;
    sessionStorage.setItem(
      SPEAKERS_DRAFT_KEY,
      JSON.stringify({ topics, duration }),
    );
  }, [topics, duration, draftHydrated]);

  /** Tras OAuth desde la galería (landing), Supabase redirige a /speakers?thanks=miembros */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("thanks") !== "miembros") return;

    const t = window.setTimeout(() => {
      setThanksVariant("community");
      setThanksOpen(true);
      params.delete("thanks");
      const qs = params.toString();
      const next = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
    }, 0);

    return () => window.clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!hasAuthConfigured) {
      setErrorMessage(
        "El login con GitHub no está configurado en este entorno. No podemos guardar la propuesta desde acá.",
      );
      return;
    }

    const trimmed = topics.trim();
    if (!trimmed) {
      setErrorMessage("Contanos sobre qué te gustaría hablar.");
      return;
    }

    if (!user) {
      try {
        await signInWithGitHub({
          redirectTo: `${window.location.origin}/speakers`,
        });
      } catch (err) {
        console.error("No se pudo iniciar sesión con GitHub.", err);
        setErrorMessage(
          "No pudimos abrir el login con GitHub. Intentá de nuevo.",
        );
      }
      return;
    }

    const durationMinutes = Number(duration) as SpeakerProposalDuration;
    setIsSubmitting(true);
    try {
      await submitSpeakerProposal({
        topics: trimmed,
        durationMinutes,
        user,
      });
      setThanksVariant("proposal");
      setThanksOpen(true);
      setTopics("");
      setDuration(DURATION_OPTIONS[0]!.value);
      try {
        sessionStorage.removeItem(SPEAKERS_DRAFT_KEY);
      } catch {
        /* ignore */
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "No pudimos guardar tu propuesta.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const primaryBusy = isSigningIn || isSubmitting;
  const submitDisabled = !hasAuthConfigured || primaryBusy;

  const primaryLabel = (() => {
    if (isSigningIn) return "Abriendo GitHub…";
    if (isSubmitting) return "Guardando…";
    if (!user) return "Enviar";
    return "Enviar propuesta";
  })();

  return (
    <div className="relative overflow-x-hidden bg-white text-neutral-950 [color-scheme:light]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(255,236,107,0.14),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_40%_at_100%_20%,rgba(0,0,0,0.03),transparent_55%)]"
        aria-hidden
      />

      <section
        className={cn(
          "relative isolate",
          "px-4 pb-20 pt-20 sm:px-6 sm:pb-24 sm:pt-20",
          "lg:py-12",
        )}
        aria-labelledby="speakers-heading"
      >
        <div className={cn(HERO_CONTENT_WIDTH_CLASS, "relative z-10 min-w-0")}>
          <h1
            id="speakers-heading"
            className={cn(
              "text-balance text-3xl font-semibold tracking-tight text-neutral-950",
              "sm:text-4xl md:text-[2.65rem] md:leading-[1.12]",
            )}
          >
            <BlurText
              text={PAGE_HEADING}
              className="text-inherit"
              segmentDelay={0.12}
              duration={0.9}
              tailHighlight={titleTailHighlight}
              inViewInitial
            />
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-neutral-600 sm:text-[1.05rem]">
            CuyoConnect es un espacio para compartir experiencias sobre
            producto, tecnología y equipos. Si tenés una charla en mente,
            envianos una propuesta en texto libre: lo usamos para armar la
            agenda y coordinarnos con vos.
          </p>

          <div
            className={cn(
              "mt-10 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white",
              "shadow-[0_12px_40px_-28px_rgba(0,0,0,0.2)]",
            )}
          >
            <div
              className={cn(
                "grid items-stretch",
                "lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)]",
              )}
            >
              <aside
                className={cn(
                  "min-w-0 border-neutral-200/80 p-6 sm:p-7",
                  "border-b bg-neutral-50/70 lg:border-b-0",
                  "lg:flex lg:min-h-0 lg:flex-col lg:py-9 lg:pl-7 lg:pr-6 xl:pl-8",
                )}
              >
                <h2 className="text-base font-bold leading-snug text-neutral-950">
                  Qué conviene incluir
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  No hace falta un formato rígido: podés escribir en párrafos.
                  Con estos puntos cubrís lo que el equipo necesita para evaluar
                  la idea.
                </p>
                <ul className="mt-5 space-y-4">
                  {GUIDANCE_ITEMS.map((item, index) => (
                    <li key={item.title} className="flex gap-2.5">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffec6b]/90 text-xs font-bold tabular-nums text-neutral-950"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug text-neutral-800">
                          <span className="font-bold text-neutral-950">
                            {item.title}.
                          </span>{" "}
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>

              <div className="min-w-0 px-6 py-8 sm:px-8 sm:py-9 lg:pl-9 lg:pr-8 xl:pl-11 xl:pr-10">
                {!hasAuthConfigured ? (
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                      Enviá tu propuesta
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                      Para guardar propuestas hace falta configurar el entorno
                      con Supabase. Cuando esté activo, vas a poder escribir acá
                      y enviar con tu cuenta de GitHub.
                    </p>
                    <GitHubJoinCta intent="speakers" className="mt-8" />
                  </div>
                ) : (
                  <form
                    className="flex flex-col"
                    onSubmit={(e) => void handleSubmit(e)}
                    noValidate
                  >
                    <div>
                      <h2
                        id={`${topicsId}-title`}
                        className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl"
                      >
                        Tu charla
                      </h2>
                    </div>

                    <div className="mt-6 flex flex-col gap-6">
                      <div>
                        <textarea
                          id={topicsId}
                          name="topics"
                          rows={9}
                          value={topics}
                          onChange={(e) => setTopics(e.target.value)}
                          placeholder={`- Título o tema: una línea de qué va la sesión.

- Idea central: qué vas a mostrar, contar o debatir.

- Audiencia: para quién es y qué deberían saber antes.`}
                          aria-labelledby={`${topicsId}-title`}
                          className={cn(
                            "min-h-[13rem] w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/40 px-4 py-3.5 text-[0.9375rem] leading-relaxed text-neutral-950 sm:min-h-[14rem]",
                            "placeholder:text-neutral-400 placeholder:whitespace-pre-wrap",
                            "focus-visible:border-neutral-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300/70",
                          )}
                          autoComplete="off"
                        />
                      </div>

                      {errorMessage ? (
                        <p className="text-sm text-rose-600" role="alert">
                          {errorMessage}
                        </p>
                      ) : null}

                      <div>
                        <div
                          className={cn(
                            "flex flex-col gap-6",
                            "lg:flex-row lg:items-end lg:justify-between lg:gap-8",
                          )}
                        >
                          <div className="min-w-0 lg:max-w-md lg:flex-1">
                            <p
                              id={durationGroupId}
                              className="text-sm font-medium text-neutral-800"
                            >
                              Duración estimada
                            </p>
                            <div
                              className={cn(
                                "relative mt-3 flex w-full rounded-2xl border border-neutral-200/90",
                                "bg-neutral-100/90 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]",
                              )}
                              role="group"
                              aria-labelledby={durationGroupId}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none absolute inset-y-1 left-1 z-0",
                                  "w-[calc((100%-0.5rem)/3)] rounded-xl bg-neutral-950 shadow-sm",
                                  "transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] will-change-transform motion-reduce:transition-none",
                                )}
                                style={{
                                  transform: `translateX(calc(${durationSegmentIndex} * 100%))`,
                                }}
                                aria-hidden
                              />
                              {DURATION_OPTIONS.map((o) => {
                                const selected = duration === o.value;
                                return (
                                  <button
                                    key={o.value}
                                    type="button"
                                    onClick={() =>
                                      setDuration(
                                        o.value as (typeof DURATION_OPTIONS)[number]["value"],
                                      )
                                    }
                                    aria-pressed={selected}
                                    className={cn(
                                      "relative z-10 min-w-0 flex-1 rounded-xl px-2 py-2.5 text-center text-sm font-medium",
                                      "transition-colors duration-300 ease-out",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100",
                                      selected
                                        ? "text-white"
                                        : "text-neutral-600 hover:text-neutral-950",
                                    )}
                                  >
                                    {o.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div
                            className={cn(
                              "flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-4",
                            )}
                          >
                            {user ? (
                              <div
                                className="flex max-w-full items-center justify-end gap-2.5 text-sm text-neutral-600"
                                role="status"
                              >
                                {typeof avatarUrl === "string" ? (
                                  <img
                                    src={avatarUrl}
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded-full border border-neutral-200/80 object-cover"
                                  />
                                ) : null}
                                <span className="min-w-0 truncate">
                                  {login
                                    ? `@${login}`
                                    : (user.email ?? "Sesión con GitHub")}
                                </span>
                              </div>
                            ) : null}

                            <button
                              type="submit"
                              disabled={submitDisabled}
                              className={cn(
                                "inline-flex w-full shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#1d1d1f] px-8 py-3.5 text-sm font-medium text-white transition-colors duration-[420ms] delay-[90ms] ease-[cubic-bezier(0.33,1,0.68,1)] hover:bg-black hover:duration-[240ms] hover:delay-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:w-auto sm:min-w-[11.5rem]",
                                "disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:bg-neutral-300",
                                !user && "sm:max-w-md",
                              )}
                            >
                              {primaryLabel}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SpeakerThanksOverlay
        open={thanksOpen}
        variant={thanksVariant}
        onClose={() => setThanksOpen(false)}
      />
    </div>
  );
}
