export function Corners({ className = "" }: { className?: string }) {
  return (
    <span className={`corners${className ? ` ${className}` : ""}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
