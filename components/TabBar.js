const TABS = [
  {
    id: "home",
    label: "Home",
    icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  },
  {
    id: "discover",
    label: "Discover",
    icon: (
      <path d="M12 21s-7.5-4.6-9.5-9.2C1.1 8.4 3.2 5 6.6 5c2 0 3.6 1.1 4.4 2.6h2C13.8 6.1 15.4 5 17.4 5c3.4 0 5.5 3.4 4.1 6.8C19.5 16.4 12 21 12 21z" />
    ),
  },
];

export default function TabBar({ tab, onChange }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`tab ${tab === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
          aria-current={tab === t.id ? "page" : undefined}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            {t.icon}
          </svg>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
