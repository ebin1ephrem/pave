import { cn } from "@/lib/utils";

export interface Step {
  title: string;
  body?: string;
  state?: "done" | "current" | "upcoming";
}

/** Numbered sequence: 01, 02, 03 … Use `state` to show progress through the steps. */
export function StepSequence({ steps, columns = 5 }: { steps: Step[]; columns?: 3 | 4 | 5 | 6 }) {
  const cols = { 3: "xl:grid-cols-3", 4: "xl:grid-cols-4", 5: "xl:grid-cols-5", 6: "xl:grid-cols-6" }[columns];
  return (
    <ol className={cn("grid gap-3 sm:grid-cols-2", cols)}>
      {steps.map((step, i) => (
        <li
          key={step.title}
          aria-current={step.state === "current" ? "step" : undefined}
          className={cn(
            "how-step rounded-[12px] border border-line p-5",
            step.state === "current" && "border-ink",
            step.state === "upcoming" && "bg-subtle",
          )}
        >
          <span className="flex items-center justify-between">
            <span
              className={cn(
                "how-step-number font-display text-[13px] font-medium tabular-nums transition-colors duration-200",
                step.state === "current" ? "text-ink" : "text-muted",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            {step.state === "done" ? <span className="text-[11.5px] text-ok">Done</span> : null}
            {step.state === "current" ? <span className="block h-[3px] w-9 rounded-full bg-accent" /> : null}
          </span>
          <p className="mt-3 text-[15.5px] font-medium tracking-[-0.02em]">{step.title}</p>
          {step.body ? <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{step.body}</p> : null}
        </li>
      ))}
    </ol>
  );
}
