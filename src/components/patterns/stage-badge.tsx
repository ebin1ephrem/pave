import { STAGES } from "../../../framework/schema";
import { cn } from "@/lib/utils";

export type Band = (typeof STAGES)[number]["band"];
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export function bandOf(stage: number): Band {
  return STAGES.find((s) => s.stage === stage)?.band ?? "Explore";
}

/** Bands use the three existing surface tones, so no new colours enter the palette. */
const BAND_TONE: Record<Band, string> = {
  Explore: "border-line bg-subtle text-ink",
  Validate: "border-ink bg-ink text-white",
  Scale: "border-accent bg-accent text-ink",
};

const CONFIDENCE_DOT: Record<Confidence, string> = { HIGH: "bg-ok", MEDIUM: "bg-warn", LOW: "bg-danger" };

/** "Stage 4" coloured by band, with an optional confidence dot. Stages have numbers only. */
export function StageBadge({
  stage,
  confidence,
  showBand = false,
  className,
}: {
  stage: number | null;
  confidence?: Confidence;
  showBand?: boolean;
  className?: string;
}) {
  if (stage === null) {
    return <span className={cn("pill text-faint", className)}>Not scored</span>;
  }
  const band = bandOf(stage);
  return (
    <span className={cn("pill tabular-nums", BAND_TONE[band], className)}>
      {confidence ? (
        <span
          className={cn("size-1.5 rounded-full", CONFIDENCE_DOT[confidence])}
          role="img"
          aria-label={`${confidence.toLowerCase()} confidence`}
        />
      ) : null}
      Stage {stage}
      {showBand ? <span className="opacity-70">· {band}</span> : null}
    </span>
  );
}

export function BandBadge({ band }: { band: Band }) {
  return <span className={cn("pill", BAND_TONE[band])}>{band}</span>;
}
