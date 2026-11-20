import type { NavSection } from '../lib/types';

interface TopNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onQuickPlay: () => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string }> = [
  { id: 'games', label: 'Games' },
  { id: 'trophies', label: 'Trophies' },
  { id: 'stats', label: 'Stats' },
  { id: 'notes', label: 'Notes' },
];

export function TopNav({ activeSection, onSelectSection, onQuickPlay }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.07] bg-[#F6F6F3]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element brand wordmark (strictly "Mehak") */}
        <button
          type="button"
          onClick={() => onSelectSection('games')}
          className="font-display text-xl font-bold tracking-tight text-[#14161A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]"
        >
          Mehak
        </button>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav aria-label="Primary" className="flex items-center gap-4 sm:gap-8">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB] ${
                  active
                    ? 'text-[#14161A]'
                    : 'text-[#5A606E] hover:text-[#14161A]'
                }`}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[19px] h-[2px] bg-[#2563EB]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="hidden sm:flex items-center shrink-0">
          <button
            type="button"
            onClick={onQuickPlay}
            className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] active:scale-[0.99] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            Quick Play
          </button>
        </div>
      </div>
    </header>
  );
}
