import { GAME_CATALOG } from '../lib/catalog';
import type { GameId, PlatformState } from '../lib/types';

interface StatsViewProps {
  state: PlatformState;
  onPlayGame: (gameId: GameId) => void;
}

export function StatsView({ state, onPlayGame }: StatsViewProps) {
  const totalPlays = Object.values(state.progress).reduce((sum, p) => sum + p.plays, 0);
  const totalWins = Object.values(state.progress).reduce((sum, p) => sum + p.wins, 0);
  const winRate = totalPlays > 0 ? Math.round((totalWins / totalPlays) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
      <div className="border-b border-black/[0.08] pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#14161A]">
          Stats
        </h1>
        <p className="mt-1.5 text-sm text-[#5A606E]">
          Session totals, personal bests, and recent activity for Mehak.
        </p>
      </div>

      {/* Overview Row */}
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-xl border border-black/[0.08] bg-white p-6">
          <div className="text-xs text-[#6B7280]">Total Sessions</div>
          <div className="mt-1.5 font-mono text-3xl font-semibold tabular-nums text-[#14161A]">
            {totalPlays}
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.08] bg-white p-6">
          <div className="text-xs text-[#6B7280]">Total Victories</div>
          <div className="mt-1.5 font-mono text-3xl font-semibold tabular-nums text-[#14161A]">
            {totalWins}
          </div>
        </div>
        <div className="rounded-xl border border-black/[0.08] bg-white p-6">
          <div className="text-xs text-[#6B7280]">Completion Rate</div>
          <div className="mt-1.5 font-mono text-3xl font-semibold tabular-nums text-[#14161A]">
            {winRate}%
          </div>
        </div>
      </section>

      {/* Per-Game Breakdown */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-tight text-[#14161A]">
          Personal Bests
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-black/[0.08] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.07] text-xs text-[#6B7280]">
                <th className="px-5 py-3.5 font-medium">Game</th>
                <th className="px-5 py-3.5 font-medium">Category</th>
                <th className="px-5 py-3.5 font-medium text-right">Sessions</th>
                <th className="px-5 py-3.5 font-medium text-right">Wins</th>
                <th className="px-5 py-3.5 font-medium text-right">Best Score</th>
                <th className="px-5 py-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {GAME_CATALOG.map((game) => {
                const prog = state.progress[game.id];
                return (
                  <tr key={game.id} className="hover:bg-[#F6F6F3]/60">
                    <td className="px-5 py-4 font-semibold text-[#14161A]">{game.title}</td>
                    <td className="px-5 py-4 text-[#5A606E]">{game.category}</td>
                    <td className="px-5 py-4 text-right font-mono tabular-nums">{prog.plays}</td>
                    <td className="px-5 py-4 text-right font-mono tabular-nums">{prog.wins}</td>
                    <td className="px-5 py-4 text-right font-mono font-semibold tabular-nums">
                      {prog.bestScore > 0 ? prog.bestScore : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onPlayGame(game.id)}
                        className="text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        Play
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Sessions */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-bold tracking-tight text-[#14161A]">
          Recent Activity
        </h2>
        {state.sessions.length === 0 ? (
          <div className="mt-4 rounded-xl border border-black/[0.08] bg-white p-8 text-center">
            <p className="text-sm text-[#5A606E]">
              No sessions recorded yet. Finish a game to log your first score.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-black/[0.07] rounded-xl border border-black/[0.08] bg-white">
            {state.sessions.slice(0, 10).map((session) => {
              const game = GAME_CATALOG.find((g) => g.id === session.gameId);
              return (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 text-sm"
                >
                  <div>
                    <span className="font-semibold text-[#14161A]">
                      {game?.title ?? session.gameId}
                    </span>
                    <span className="mx-2 text-[#9CA3AF]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#5A606E]">{session.detail}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-semibold tabular-nums text-[#14161A]">
                      {session.score} pts
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      {new Date(session.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
