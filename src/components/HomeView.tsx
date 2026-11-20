import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { GAME_CATALOG, HERO_STAGE_IMAGE, TROPHY_CATALOG } from '../lib/catalog';
import type { GameCategory, GameId, PlatformState } from '../lib/types';
import { SafeImage } from './SafeImage';

interface HomeViewProps {
  state: PlatformState;
  onPlayGame: (gameId: GameId) => void;
  onOpenTrophies: () => void;
}

const CATEGORIES: GameCategory[] = ['All', 'Arcade', 'Puzzle', 'Memory', 'Word'];

export function HomeView({ state, onPlayGame, onOpenTrophies }: HomeViewProps) {
  const [category, setCategory] = useState<GameCategory>('All');

  const filteredGames =
    category === 'All'
      ? GAME_CATALOG
      : GAME_CATALOG.filter((g) => g.category === category);

  const totalPlays = Object.values(state.progress).reduce((sum, p) => sum + p.plays, 0);
  const totalWins = Object.values(state.progress).reduce((sum, p) => sum + p.wins, 0);
  const lastGame = GAME_CATALOG.find((g) => g.id === state.lastGameId) ?? GAME_CATALOG[0];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      {/* Editorial 2-Column Hero — strictly uses "Mehak" only */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between py-2">
          <div>
            <p className="text-sm font-medium text-[#5A606E]">
              Personal Game Collection
            </p>
            <h1
              className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#14161A] leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              Welcome back, Mehak.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[#4B5563]">
              Four tactile arcade, puzzle, memory, and word games built for crisp sessions,
              personal bests, and quiet focus.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onPlayGame(lastGame.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                <span>Play {lastGame.title}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenTrophies}
                className="text-sm font-medium text-[#14161A] underline decoration-black/25 underline-offset-4 transition-colors hover:decoration-[#2563EB] hover:text-[#2563EB] whitespace-nowrap"
              >
                View Trophies
              </button>
            </div>
          </div>

          {/* Clean unboxed summary strip */}
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-black/[0.08] pt-6">
            <div>
              <div className="text-xs text-[#6B7280]">Games Played</div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#14161A]">
                {totalPlays}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6B7280]">Victories</div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#14161A]">
                {totalWins}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#6B7280]">Trophies</div>
              <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#14161A]">
                {state.unlockedTrophies.length}/{TROPHY_CATALOG.length}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-full min-h-[260px] overflow-hidden rounded-xl border border-black/[0.08] bg-[#E9EAE4]">
            <SafeImage
              src={HERO_STAGE_IMAGE}
              alt="Minimalist wooden puzzle blocks, cobalt glass spheres, and ceramic tiles on a sunlit studio table"
              fallbackLabel="Mehak Arcade Studio"
              className="h-full w-full object-cover object-right scale-[2] origin-right"
            />
          </div>
        </div>
      </section>

      {/* Game Library Section */}
      <section aria-labelledby="library-heading" className="mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/[0.08] pb-5">
          <div>
            <h2 id="library-heading" className="font-display text-2xl font-bold tracking-tight text-[#14161A]">
              Game Library
            </h2>
            <p className="mt-1 text-sm text-[#5A606E]">
              Choose a game to start playing immediately.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div
            role="tablist"
            aria-label="Filter games by category"
            className="inline-flex items-center gap-1 rounded-lg bg-[#EAEAE4] p-1 self-start sm:self-auto"
          >
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(cat)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-[#14161A] shadow-xs'
                      : 'text-[#5A606E] hover:text-[#14161A]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Showcase Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredGames.map((game) => {
            const prog = state.progress[game.id];
            return (
              <article
                key={game.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#EAEAE4]">
                  <SafeImage
                    src={game.coverImage}
                    alt={`${game.title} game illustration`}
                    fallbackLabel={game.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    {/* Clean unboxed metadata with typographic separator */}
                    <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                      <span>{game.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{game.durationLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {prog.bestScore > 0 ? `Best ${prog.bestScore}` : 'Not played yet'}
                      </span>
                    </div>

                    <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-[#14161A]">
                      {game.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4B5563]">
                      {game.summary}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-black/[0.06] pt-4">
                    <span className="text-xs text-[#6B7280] font-mono tabular-nums">
                      {prog.plays === 1 ? '1 session' : `${prog.plays} sessions`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPlayGame(game.id)}
                      aria-label={`Play ${game.title}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#14161A] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2563EB] whitespace-nowrap"
                    >
                      <span>Play</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
