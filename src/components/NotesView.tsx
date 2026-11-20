import { useState } from 'react';
import { Check } from 'lucide-react';
import { GAME_CATALOG } from '../lib/catalog';
import type { GameId, PlatformState, SecretVictoryNote } from '../lib/types';

interface NotesViewProps {
  state: PlatformState;
  onSaveNote: (note: SecretVictoryNote) => void;
}

export function NotesView({ state, onSaveNote }: NotesViewProps) {
  const [selectedGame, setSelectedGame] = useState<GameId>('chroma-flip');
  const current = state.secretNotes[selectedGame];

  const [enabled, setEnabled] = useState(current.enabled);
  const [nickname, setNickname] = useState(current.nickname);
  const [message, setMessage] = useState(current.message);
  const [minScore, setMinScore] = useState(String(current.minScore ?? 0));
  const [savedFlag, setSavedFlag] = useState(false);

  const handleSelectGame = (gameId: GameId) => {
    setSelectedGame(gameId);
    const next = state.secretNotes[gameId];
    setEnabled(next.enabled);
    setNickname(next.nickname);
    setMessage(next.message);
    setMinScore(String(next.minScore ?? 0));
    setSavedFlag(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedScore = Math.max(0, Number.parseInt(minScore, 10) || 0);
    onSaveNote({
      gameId: selectedGame,
      enabled,
      nickname: nickname.trim(),
      message: message.trim(),
      minScore: parsedScore,
    });
    setSavedFlag(true);
    window.setTimeout(() => setSavedFlag(false), 2400);
  };

  const selectedMeta = GAME_CATALOG.find((g) => g.id === selectedGame)!;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
      <div className="border-b border-black/[0.08] pb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#14161A]">
          Victory Notes
        </h1>
        <p className="mt-1.5 text-sm text-[#5A606E] max-w-2xl leading-relaxed">
          Configure optional surprise notes that appear only when Mehak completes a specific game
          above a target score. Personal notes and optional nicknames stay completely hidden from
          the homepage, navigation, cards, and ordinary menus.
        </p>
      </div>

      {/* Game Selector Tabs */}
      <div
        role="tablist"
        aria-label="Select game for victory note"
        className="mt-8 inline-flex flex-wrap items-center gap-1 rounded-lg bg-[#EAEAE4] p-1"
      >
        {GAME_CATALOG.map((game) => {
          const active = game.id === selectedGame;
          const isEnabled = state.secretNotes[game.id]?.enabled;
          return (
            <button
              key={game.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleSelectGame(game.id)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white text-[#14161A] shadow-xs'
                  : 'text-[#5A606E] hover:text-[#14161A]'
              }`}
            >
              {game.title}
              {isEnabled ? ' · Active' : ''}
            </button>
          );
        })}
      </div>

      {/* Configuration Form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-black/[0.08] bg-white p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] pb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#14161A]">
              {selectedMeta.title} Surprise Card
            </h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              Shown exclusively on the victory dialog when the score threshold is reached.
            </p>
          </div>
          <label className="inline-flex items-center gap-2.5 text-sm font-medium text-[#14161A] cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
                setSavedFlag(false);
              }}
              className="h-4 w-4 rounded border-black/20 accent-[#2563EB]"
            />
            <span>Enable note</span>
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="note-nickname"
              className="block text-xs font-semibold text-[#374151]"
            >
              Optional Nickname (Victory Card Only)
            </label>
            <input
              id="note-nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setSavedFlag(false);
              }}
              placeholder="Leave blank to omit"
              maxLength={32}
              className="mt-1.5 w-full rounded-lg border border-black/15 bg-[#FAFAF8] px-3.5 py-2 text-sm text-[#14161A] placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="note-min-score"
              className="block text-xs font-semibold text-[#374151]"
            >
              Minimum Score to Trigger
            </label>
            <input
              id="note-min-score"
              type="number"
              min={0}
              step={10}
              value={minScore}
              onChange={(e) => {
                setMinScore(e.target.value);
                setSavedFlag(false);
              }}
              className="mt-1.5 w-full rounded-lg border border-black/15 bg-[#FAFAF8] px-3.5 py-2 font-mono text-sm tabular-nums text-[#14161A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="note-message"
            className="block text-xs font-semibold text-[#374151]"
          >
            Surprise Victory Message
          </label>
          <textarea
            id="note-message"
            rows={3}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setSavedFlag(false);
            }}
            placeholder="Write a brief, natural note for this game's victory card..."
            maxLength={220}
            className="mt-1.5 w-full rounded-lg border border-black/15 bg-[#FAFAF8] px-3.5 py-2.5 text-sm leading-relaxed text-[#14161A] placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="text-xs text-[#6B7280]">
            {savedFlag ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-[#0F766E]">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Saved for {selectedMeta.title}
              </span>
            ) : (
              <span>Saved locally on this device.</span>
            )}
          </div>
          <button
            type="submit"
            className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
          >
            Save Note
          </button>
        </div>
      </form>
    </main>
  );
}
