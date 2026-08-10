import { AppLogo } from "./AppLogo";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[var(--line)] pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <AppLogo size="compact" className="mb-2" />
        <h1 className="mt-1 text-balance text-3xl font-black leading-tight text-[var(--ink)] md:text-4xl">{title}</h1>
        {description ? <p className="muted mt-2 max-w-3xl text-pretty">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}
