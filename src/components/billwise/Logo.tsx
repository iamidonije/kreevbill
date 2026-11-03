export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
        ₦
      </span>
      <span className="font-display text-xl font-bold text-foreground">Billwise</span>
    </div>
  );
}
