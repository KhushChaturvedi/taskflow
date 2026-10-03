import { User } from "@/lib/types";

type Props = {
  user: User | null;
  size?: "sm" | "md";
};

export default function Avatar({ user, size = "sm" }: Props) {
  const dimensions = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  if (!user) {
    return (
      <div
        className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400`}
      >
        ?
      </div>
    );
  }

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name || user.email}
        referrerPolicy="no-referrer"
        className={`${dimensions} shrink-0 rounded-full object-cover`}
      />
    );
  }

  const initials = (user.name || user.email)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700`}
    >
      {initials}
    </div>
  );
}
