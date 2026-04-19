import { useEffect, useId, useMemo, useState } from "react";

import { BlurText } from "@/components/ui/blur-text";
import { FaqAccordion, type FAQItem } from "@/components/ui/faq-chat-accordion";
import { GitHubJoinCta } from "@/components/GitHubJoinCta";
import { SideCircuitDecor } from "@/components/SideCircuitDecor";
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

const SPEAKER_FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: "¿Tengo que ser experto/a en el tema?",
    answer:
      "Para nada. Las mejores charlas suelen venir de gente que está aprendiendo y comparte el camino. Si lo entendés lo suficiente como para explicárselo a un amigo, podés contarlo acá.",
  },
  {
    id: 2,
    question: "¿Hace falta tener slides o se puede improvisar?",
    answer:
      "Como prefieras. Hay charlas con slides, otras tipo demo en vivo y otras de pizarra. Mientras tengas claro lo que querés transmitir, el formato es libre.",
  },
  {
    id: 3,
    question: "¿Puedo dar la charla en pareja o con alguien más?",
    answer:
      "Sí, las charlas en dúo funcionan muy bien, sobre todo cuando son experiencias compartidas. Aclaranos en la propuesta quiénes serían los speakers.",
  },
  {
    id: 4,
    question: "Nunca hablé en público, ¿igual puedo proponerme?",
    answer:
      "Sí, y es uno de los mejores lugares para arrancar. El público es chico, va con buena onda y te acompañamos en el ensayo si querés. Mucha gente que hoy da charlas debutó acá.",
  },
];

function parseDraft(raw: string | null): {
  talkMain: string;
  talkSpeaker: string;
  duration: (typeof DURATION_OPTIONS)[number]["value"];
} | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as {
      topics?: unknown;
      talkMain?: unknown;
      talkTitle?: unknown;
      talkAbout?: unknown;
      talkSpeaker?: unknown;
      duration?: unknown;
    };
    const d = data.duration;
    const duration =
      d === "30" || d === "45" || d === "60" ? d : DURATION_OPTIONS[0]!.value;

    const talkSpeaker =
      typeof data.talkSpeaker === "string" ? data.talkSpeaker : "";

    if (typeof data.talkMain === "string") {
      return { talkMain: data.talkMain, talkSpeaker, duration };
    }

    const talkTitle =
      typeof data.talkTitle === "string" ? data.talkTitle : "";
    const talkAbout =
      typeof data.talkAbout === "string" ? data.talkAbout : "";
    if (talkTitle.trim() || talkAbout.trim() || talkSpeaker.trim()) {
      const talkMain = [talkTitle, talkAbout]
        .map((s) => s.trim())
        .filter(Boolean)
        .join("\n\n");
      return { talkMain, talkSpeaker, duration };
    }

    const legacyTopics = typeof data.topics === "string" ? data.topics : "";
    return {
      talkMain: legacyTopics,
      talkSpeaker: "",
      duration,
    };
  } catch {
    return null;
  }
}

function buildTopicsField(talkMain: string, talkSpeaker: string): string {
  const m = talkMain.trim();
  const s = talkSpeaker.trim();
  const parts: string[] = [];
  if (m) {
    parts.push(`De qué trata la charla:\n${m}`);
  }
  if (s) {
    parts.push(`Sobre vos: ${s}`);
  }
  return parts.join("\n\n");
}

const fieldInputClass = cn(
  "w-full rounded-xl border border-neutral-200 bg-neutral-50/40 px-4 py-3.5 text-[0.9375rem] leading-relaxed text-neutral-950",
  "placeholder:text-neutral-400",
  "focus-visible:border-neutral-400 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300/70",
);

const textareaFieldClass = cn(
  fieldInputClass,
  "min-h-[3.75rem] resize-y sm:min-h-[4.25rem]",
);

const talkMainTextareaClass = cn(
  fieldInputClass,
  "min-h-[7rem] resize-y sm:min-h-[7.5rem]",
);

export function SpeakersPage() {
  const talkMainId = useId();
  const talkSpeakerId = useId();
  const durationGroupId = useId();
  const { user, hasAuthConfigured, signInWithGitHub, isSigningIn } = useAuth();

  const [talkMain, setTalkMain] = useState("");
  const [talkSpeaker, setTalkSpeaker] = useState("");
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
      setTalkMain(parsed.talkMain);
      setTalkSpeaker(parsed.talkSpeaker);
      setDuration(parsed.duration);
    }
    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated || typeof window === "undefined") return;
    sessionStorage.setItem(
      SPEAKERS_DRAFT_KEY,
      JSON.stringify({
        talkMain,
        talkSpeaker,
        duration,
      }),
    );
  }, [talkMain, talkSpeaker, duration, draftHydrated]);

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

    const combined = buildTopicsField(talkMain, talkSpeaker);
    if (!combined) {
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
        topics: combined,
        durationMinutes,
        user,
      });
      setThanksVariant("proposal");
      setThanksOpen(true);
      setTalkMain("");
      setTalkSpeaker("");
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
    <div className="relative isolate flex min-h-0 flex-1 flex-col overflow-x-hidden bg-white text-neutral-950 [color-scheme:light] lg:justify-center">
      <SideCircuitDecor />

      <section
        className={cn(
          "relative isolate",
          "px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20",
          "lg:py-10",
        )}
        aria-labelledby="speakers-heading"
      >
        <div className={cn(HERO_CONTENT_WIDTH_CLASS, "relative z-10 min-w-0")}>
          {/* Cabecera de sección al estilo del resto de la landing (FaqSection / TeamSection). */}
          <header className="mb-8 flex flex-col gap-3 sm:mb-10">
            <h1
              id="speakers-heading"
              className={cn(
                "text-balance text-2xl font-semibold tracking-tight text-neutral-950",
                "sm:text-3xl md:text-4xl",
              )}
            >
              <BlurText
                text={PAGE_HEADING}
                className="text-inherit"
                segmentDelay={0.14}
                duration={0.95}
                tailHighlight={titleTailHighlight}
                inViewInitial
              />
            </h1>
            <p className="max-w-2xl text-pretty text-neutral-600 sm:text-lg">
              En CuyoConnect compartimos lo que estamos aprendiendo y
              construyendo en tecnología. Si querés contar un proyecto, una
              experiencia o algo que aprendiste, mandanos tu propuesta y la
              sumamos a la próxima agenda.
            </p>
          </header>

          <div
            className={cn(
              "overflow-hidden rounded-2xl bg-white",
              "border-0 shadow-none sm:border sm:border-neutral-200/90 sm:shadow-[0_12px_40px_-28px_rgba(0,0,0,0.2)]",
              /* Rompe el px-4 del section solo en móvil: tarjeta a ancho de pantalla */
              "max-sm:-mx-4",
            )}
          >
            <div
              className={cn(
                "grid items-stretch",
                "lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]",
              )}
            >
              <aside
                className={cn(
                  "relative order-2 min-w-0 overflow-hidden border-neutral-700/80 p-6 sm:p-8",
                  "border-t bg-neutral-900 lg:order-1 lg:border-t-0 lg:border-r",
                  "lg:flex lg:min-h-0 lg:flex-col lg:py-10 lg:pl-8 lg:pr-7 xl:pl-10 xl:pr-8",
                )}
                aria-labelledby="speakers-faq-heading"
              >
                <div className="relative">
                  <h2
                    id="speakers-faq-heading"
                    className="text-base font-semibold tracking-tight text-neutral-200 sm:text-lg"
                  >
                    Preguntas frecuentes
                  </h2>

                  <div className="mt-4 min-w-0">
                    <FaqAccordion
                      data={SPEAKER_FAQ_ITEMS}
                      className="border-t border-neutral-700/60 divide-neutral-700/60"
                      questionClassName="py-3.5 text-sm text-neutral-300 hover:text-neutral-100 sm:text-sm"
                      answerClassName="pb-4 pr-6 text-[0.8125rem] leading-relaxed text-neutral-500 sm:text-[0.875rem]"
                    />
                  </div>

                  {user ? (
                    <div
                      className="mt-6 flex items-center gap-2 border-t border-neutral-700/60 pt-6 text-sm text-neutral-300"
                      role="status"
                    >
                      {typeof avatarUrl === "string" ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-7 w-7 shrink-0 rounded-full border border-neutral-700/60 object-cover"
                        />
                      ) : null}
                      <span className="min-w-0 truncate">
                        {login
                          ? `@${login}`
                          : (user.email ?? "Sesión con GitHub")}
                      </span>
                    </div>
                  ) : null}
                </div>
              </aside>

              <div className="order-1 min-w-0 px-6 pt-6 pb-8 sm:px-8 sm:pt-7 sm:pb-9 lg:order-2 lg:pl-9 lg:pr-8 lg:pt-9 xl:pl-11 xl:pr-10">
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
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor={talkMainId}
                            className="text-sm font-medium text-neutral-800"
                          >
                            ¿De qué trata la charla?
                          </label>
                          <textarea
                            id={talkMainId}
                            name="talkMain"
                            rows={4}
                            value={talkMain}
                            onChange={(e) => setTalkMain(e.target.value)}
                            placeholder="Qué vas a mostrar, contar o debatir y a quién apunta."
                            className={talkMainTextareaClass}
                            autoComplete="off"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor={talkSpeakerId}
                            className="text-sm font-medium text-neutral-800"
                          >
                            Sobre vos
                          </label>
                          <textarea
                            id={talkSpeakerId}
                            name="talkSpeaker"
                            rows={2}
                            value={talkSpeaker}
                            onChange={(e) => setTalkSpeaker(e.target.value)}
                            placeholder="Quién sos y por qué creés que es interesante este tema"
                            className={textareaFieldClass}
                            autoComplete="off"
                          />
                        </div>
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
