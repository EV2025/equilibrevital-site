export default function DashboardCard({ title, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-brand-border/60 bg-white/80 p-6 shadow-sm ${className}`}>
      <h2 className="text-xl font-bold tracking-tight text-brand-text">{title}</h2>
      <div className="mt-4 text-brand-body">{children}</div>
    </section>
  );
}
