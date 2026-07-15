const groups = [
  { title: 'Demandes', tabs: ['Messages', 'Réservations', 'Présences'] },
  { title: 'Participants', tabs: ['Clients', 'Membres', 'Parcours'] },
  { title: 'Organisation', tabs: ['Services', 'Calendrier', 'Paiements'] },
  { title: 'Communication', tabs: ['Notifications', 'Journaux d’e-mails'] },
  { title: 'Contenu', tabs: ['Contenu pages', 'Téléchargements', 'Imports'] },
  { title: 'Pilotage', tabs: ['Statistiques', 'Export CSV'] },
];

export default function AdminTabs() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-label="Navigation administration par catégories">
      {groups.map((group) => (
        <section key={group.title} className="rounded-3xl border border-brand-border/60 bg-white/80 p-4">
          <h3 className="text-center text-sm font-bold text-brand-text">{group.title}</h3>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {group.tabs.map((tab) => <button key={tab} type="button" className="min-h-[44px] rounded-full border border-brand-border px-3 text-sm font-semibold">{tab}</button>)}
          </div>
        </section>
      ))}
    </div>
  );
}
