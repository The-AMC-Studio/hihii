/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from './lib/audio';
import { getGameById } from './lib/catalog';
import {
  loadPlatformState,
  recordGameResult,
  resolveContextualVictoryNote,
  savePlatformState,
} from './lib/storage';
import type { GameId, NavSection, PlatformState, SecretVictoryNote } from './lib/types';
import { TopNav } from './components/TopNav';
import { HomeView } from './components/HomeView';
import { TrophiesView } from './components/TrophiesView';
import { StatsView } from './components/StatsView';
import { NotesView } from './components/NotesView';
import { StarlightDriftGame } from './components/games/StarlightDriftGame';
import { ChromaFlipGame } from './components/games/ChromaFlipGame';
import { BotanicalMatchGame } from './components/games/BotanicalMatchGame';
import { WordLoomGame } from './components/games/WordLoomGame';

function readInitialQuery(): { gameId: GameId | null; autostart: boolean } {
  if (typeof window === 'undefined') return { gameId: null, autostart: false };
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  const rawGame = params.get('game');
  if (rawGame && getGameById(rawGame)) {
    return { gameId: rawGame as GameId, autostart };
  }
  if (autostart) {
    return { gameId: 'starlight-drift', autostart: true };
  }
  return { gameId: null, autostart: false };
}

export default function App() {
  const [state, setState] = useState<PlatformState>(() => {
    const loaded = loadPlatformState();
    soundEngine.setMuted(loaded.muted);
    return loaded;
  });

  const initialQuery = readInitialQuery();
  const [activeSection, setActiveSection] = useState<NavSection>('games');
  const [activeGame, setActiveGame] = useState<GameId | null>(initialQuery.gameId);
  const [autostartGame, setAutostartGame] = useState<boolean>(initialQuery.autostart);

  useEffect(() => {
    savePlatformState(state);
    soundEngine.setMuted(state.muted);
  }, [state]);

  const handlePlayGame = useCallback((gameId: GameId) => {
    soundEngine.click();
    setAutostartGame(false);
    setActiveGame(gameId);
  }, []);

  const handleToggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const handleSaveNote = useCallback((note: SecretVictoryNote) => {
    setState((prev) => ({
      ...prev,
      secretNotes: {
        ...prev.secretNotes,
        [note.gameId]: note,
      },
    }));
  }, []);

  const handleUnlockEasterEgg = useCallback(() => {
    soundEngine.victory();
    setState((prev) => ({ ...prev, easterEggUnlocked: true }));
  }, []);

  const makeCompleteHandler = useCallback(
    (gameId: GameId) =>
      (result: {
        score: number;
        won: boolean;
        detail: string;
        extraTrophies?: string[];
      }) => {
        let isNewBest = false;
        let surpriseNote = resolveContextualVictoryNote(
          state.secretNotes[gameId],
          result.score,
          result.won ? 'victory' : 'gameover'
        );

        setState((prev) => {
          const outcome = recordGameResult(prev, {
            gameId,
            score: result.score,
            won: result.won,
            detail: result.detail,
            extraTrophies: result.extraTrophies,
          });
          isNewBest = outcome.isNewBest;
          surpriseNote = resolveContextualVictoryNote(
            prev.secretNotes[gameId],
            result.score,
            result.won ? 'victory' : 'gameover'
          );
          return outcome.nextState;
        });

        return { isNewBest, surpriseNote };
      },
    [state.secretNotes]
  );

  // Full-viewport Game Shell when a game is active
  if (activeGame) {
    const best = state.progress[activeGame].bestScore;
    const onExit = () => {
      setActiveGame(null);
      setAutostartGame(false);
    };

    if (activeGame === 'starlight-drift') {
      return (
        <StarlightDriftGame
          bestScore={best}
          muted={state.muted}
          autostart={autostartGame}
          onToggleMute={handleToggleMute}
          onExit={onExit}
          onComplete={makeCompleteHandler('starlight-drift')}
        />
      );
    }
    if (activeGame === 'chroma-flip') {
      return (
        <ChromaFlipGame
          bestScore={best}
          muted={state.muted}
          onToggleMute={handleToggleMute}
          onExit={onExit}
          onComplete={makeCompleteHandler('chroma-flip')}
        />
      );
    }
    if (activeGame === 'botanical-match') {
      return (
        <BotanicalMatchGame
          bestScore={best}
          muted={state.muted}
          onToggleMute={handleToggleMute}
          onExit={onExit}
          onComplete={makeCompleteHandler('botanical-match')}
        />
      );
    }
    return (
      <WordLoomGame
        bestScore={best}
        muted={state.muted}
        onToggleMute={handleToggleMute}
        onExit={onExit}
        onComplete={makeCompleteHandler('word-loom')}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F3] text-[#14161A]">
      <TopNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onQuickPlay={() => handlePlayGame(state.lastGameId)}
      />

      <div className="flex-1">
        {activeSection === 'games' && (
          <HomeView
            state={state}
            onPlayGame={handlePlayGame}
            onOpenTrophies={() => setActiveSection('trophies')}
          />
        )}
        {activeSection === 'trophies' && (
          <TrophiesView
            state={state}
            onUnlockEasterEgg={handleUnlockEasterEgg}
          />
        )}
        {activeSection === 'stats' && (
          <StatsView state={state} onPlayGame={handlePlayGame} />
        )}
        {activeSection === 'notes' && (
          <NotesView state={state} onSaveNote={handleSaveNote} />
        )}
      </div>

      <footer className="border-t border-black/[0.07] py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-[#6B7280]">
          <span>Mehak Arcade</span>
          <span>Four original games · Local progress saved</span>
        </div>
      </footer>
    </div>
  );
}
