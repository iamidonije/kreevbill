import { avatarHue } from "@/lib/presets";

export function ItemAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const h = avatarHue(name);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-2xl font-display font-bold"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: `oklch(0.92 0.06 ${h})`, color: `oklch(0.38 0.12 ${h})`,
      }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
