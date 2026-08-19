export function SafetyNotice({ className }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-abyss-500 ${className ?? ""}`}>
      DiveFinder provides planning information, not authorization to dive. Site suitability
      depends on current conditions, operator rules, training and individual experience. Confirm
      with a qualified local operator.
    </p>
  );
}
