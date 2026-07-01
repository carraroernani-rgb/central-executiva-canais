export default function BottomNav({ tab, onTab }) {
  const items = [
    { key: 'home',     icon: '🏠', label: 'Hoje' },
    { key: 'history',  icon: '📋', label: 'Histórico' },
    { key: 'settings', icon: '⚙️', label: 'Config.' },
  ]
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around items-center h-16 max-w-mobile mx-auto z-50"
      style={{ left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
      {items.map(it => (
        <button key={it.key} onClick={() => onTab(it.key)}
          className={`flex flex-col items-center gap-0.5 px-4 py-2 transition-colors ${
            tab === it.key ? 'text-accent' : 'text-text3'
          }`}>
          <span className="text-xl">{it.icon}</span>
          <span className="text-xs font-medium">{it.label}</span>
        </button>
      ))}
    </nav>
  )
}
