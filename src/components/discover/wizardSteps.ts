import { CalendarIcon, CheckIcon, FishIcon, GaugeIcon, WalletIcon, WavesIcon } from "./WizardIcons";

export const STEPS = [
  {
    label: "Dates",
    title: "When would you like to dive?",
    subtitle: "We match destinations where conditions are verified as good during your window — not just popular picks.",
    icon: CalendarIcon,
  },
  {
    label: "Budget",
    title: "What's your budget?",
    subtitle: "Only destinations with real indicative pricing get scored on this dimension — never a guess.",
    icon: WalletIcon,
  },
  {
    label: "Level",
    title: "Your level & experience",
    subtitle: "Used for safety filters, never to gatekeep — we'll always explain if a site needs more experience.",
    icon: GaugeIcon,
  },
  {
    label: "Wildlife",
    title: "Any animals you want to see?",
    subtitle: "We check verified seasonality data for each pick, not a generic species checklist.",
    icon: FishIcon,
  },
  {
    label: "Conditions",
    title: "Conditions & dive type",
    subtitle: "Tell us what you're comfortable with so mismatches get flagged honestly, not hidden.",
    icon: WavesIcon,
  },
  {
    label: "Review",
    title: "Ready to see results?",
    subtitle: "Everything below feeds your match score — jump back to any step to change it.",
    icon: CheckIcon,
  },
] as const;
