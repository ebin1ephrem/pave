import { useSession } from "@/auth/session";

/** Top-bar program switcher. Every program is its own isolated context. */
export function ProgramSwitcher() {
  const { user, programId, setProgramId } = useSession();
  if (!user) return null;

  if (user.role === "merstra_admin") {
    return <p className="text-[13.5px] text-muted">All tenants</p>;
  }
  if (user.programs.length === 0) {
    return <p className="text-[13.5px] text-muted">No programs yet</p>;
  }
  const current = user.programs.find((p) => p.id === programId) ?? user.programs[0]!;
  if (user.programs.length === 1) {
    return (
      <p className="min-w-0 truncate text-[13.5px]">
        <span className="font-medium">{current.name}</span>
        {current.tenant ? <span className="text-muted"> · {current.tenant}</span> : null}
      </p>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <label htmlFor="program-switcher" className="eyebrow shrink-0">
        Program
      </label>
      <select
        id="program-switcher"
        className="field field-sm w-auto max-w-full"
        value={current.id}
        onChange={(e) => setProgramId(e.target.value)}
      >
        {user.programs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.tenant ? `${p.name} · ${p.tenant}` : p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
