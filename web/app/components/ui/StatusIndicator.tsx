import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";

type Status = "in-progress" | "completed" | "now-playing" | "locked";

const config: Record<Status, { label: string; icon: typeof Circle; className: string }> = {
  "in-progress": { label: "In Progress", icon: Circle, className: "text-neutral-500" },
  completed: { label: "Completed", icon: CheckCircle2, className: "text-success" },
  "now-playing": { label: "Now Playing", icon: PlayCircle, className: "text-primary-500" },
  locked: { label: "Locked", icon: Lock, className: "text-neutral-300" },
};

export function StatusIndicator({ status }: { status: Status }) {
  const { label, icon: Icon, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${className}`}>
      <Icon size={16} strokeWidth={2} />
      {label}
    </span>
  );
}
