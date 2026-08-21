import { CheckIcon } from "./WizardIcons";
import { STEPS } from "./wizardSteps";

export function StepProgress({ step }: { step: number }) {
  return (
    <div>
      <ol className="flex items-center" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.label} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                i < step
                  ? "bg-ocean-600 text-white"
                  : i === step
                    ? "bg-ocean-600 text-white ring-4 ring-ocean-100"
                    : "bg-abyss-100 text-abyss-600"
              }`}
            >
              {i < step ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1.5 h-0.5 flex-1 rounded-full ${i < step ? "bg-ocean-600" : "bg-abyss-100"}`} />
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2.5 text-xs font-medium uppercase tracking-wide text-ocean-600">
        Step {step + 1} of {STEPS.length} · {(STEPS[step] ?? STEPS[0]).label}
      </p>
    </div>
  );
}
