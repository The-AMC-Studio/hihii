import { useState } from 'react';
import { Award, Check, Lock, Sparkles } from 'lucide-react';
import { GAME_CATALOG, TROPHY_CATALOG } from '../lib/catalog';
import type { PlatformState } from '../lib/types';

interface TrophiesViewProps {
  state: PlatformState;
  onUnlockEasterEgg: () => void;
}

export function TrophiesView({ state, onUnlockEasterEgg }: TrophiesViewProps) {
  const [starClicks, setStarClicks] = useState(0);
  const unlockedSet = new Set(state.unlockedTrophies);
  const unlockedCount = state.unlockedTrophies.length;
  const eggAvailable = state.easterEggUnlocked || unlockedCount >= 3;

  const handleHiddenStarClick = () => {
    if (eggAvailable) return;
    const next = starClicks + 1;
    setStarClicks(next);
    if (next >= 3) {
      onUnlockEasterEgg();
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <div className="border-b border-black/[0.08] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#14161A]">
            Trophies
          </h1>
          <p className="mt-1.5 text-sm text-[#5A606E]">
            Milestones earned by Mehak across all four games.
          </p>
        </div>
        <div className="font-mono text-sm font-semibold tabular-nums text-[#14161A]">
          {unlockedCount} of {TROPHY_CATALOG.length} unlocked
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {TROPHY_CATALOG.map((trophy) => {
          const unlocked = unlockedSet.has(trophy.id);
          const gameTitle = trophy.gameId
            ? GAME_CATALOG.find((g) => g.id === trophy.gameId)?.title
            : 'Collection';
          return (
            <div
              key={trophy.id}
              className={`rounded-xl border p-5 transition-colors ${
                unlocked
                  ? 'border-[#2563EB]/25 bg-white'
                  : 'border-black/[0.07] bg-[#EFEFE9]/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">{gameTitle}</span>
                {unlocked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Unlocked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Locked
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                    unlocked
                      ? 'bg-[#2563EB]/10 text-[#2563EB]'
                      : 'bg-black/[0.05] text-[#6B7280]'
                  }`}
                >
                  <Award className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="font-display text-base font-bold text-[#14161A]">
                  {trophy.title}
                </h2>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#4B5563]">
                {trophy.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Subtle Hidden Easter Egg Keepsake */}
      <section className="mt-14 border-t border-black/[0.08] pt-8">
        {eggAvailable ? (
          <div className="rounded-xl border border-black/[0.08] bg-white p-6 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D97706]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Secret Keepsake Unlocked</span>
            </div>
            <h2 className="mt-2 font-display text-xl font-bold text-[#14161A]">
              Quiet Star Award
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
              You found the hidden keepsake inside the Trophy Room. Every game here was built
              to reward patience, curiosity, and sharp instincts—thanks for playing, Mehak.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 text-xs text-[#6B7280]">
            <span>Unlock 3 trophies to reveal the hidden keepsake.</span>
            <button
              type="button"
              onClick={handleHiddenStarClick}
              aria-label="Inspect hidden star emblem"
              className="rounded-md p-2 text-[#9CA3AF] transition-colors hover:text-[#2563EB]"
              title="A quiet star emblem"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
