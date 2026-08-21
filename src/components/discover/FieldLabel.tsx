export function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-medium text-abyss-700">
      {children}
      {optional && <span className="ml-1 font-normal text-abyss-400">(optional)</span>}
    </label>
  );
}
