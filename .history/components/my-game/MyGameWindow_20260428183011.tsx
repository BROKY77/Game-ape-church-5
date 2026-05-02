"use client";

import React from "react";
import { Bomb, Gem, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    BOARD_COLUMNS,
    BOARD_TILE_COUNT,
    getRemainingSafeTiles,
} from "@/components/my-game/myGameConfig";
import { cn } from "@/lib/utils";

interface MyGameWindowProps {
    minePositions: number[];
    revealedTiles: number[];
    explodedMine: number | null;
    mineCount: number;
    safeReveals: number;
    currentMultiplier: number;
    nextMultiplier: number;
    betAmount: number;
    isAutoBetting: boolean;
    isRoundActive: boolean;
    canReveal: boolean;
    canCashOut: boolean;
    resultText: string;
    onRevealTile: (tileIndex: number) => void;
    onCashOut: () => void;
    onStartRound: () => void;
}

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`;

const MyGameWindow: React.FC<MyGameWindowProps> = ({
    minePositions,
    revealedTiles,
    explodedMine,
    mineCount,
    safeReveals,
    currentMultiplier,
    nextMultiplier,
    betAmount,
    isAutoBetting,
    isRoundActive,
    canReveal,
    canCashOut,
    resultText,
    onRevealTile,
    onCashOut,
    onStartRound,
}) => {
    const mineSet = React.useMemo(() => new Set(minePositions), [minePositions]);
    const revealedSet = React.useMemo(() => new Set(revealedTiles), [revealedTiles]);
    const safeTilesLeft = getRemainingSafeTiles(mineCount, safeReveals);
    const currentPayout = Number((betAmount * currentMultiplier).toFixed(2));
    const nextPayout = Number((betAmount * nextMultiplier).toFixed(2));
    const hitChance = mineCount / (BOARD_TILE_COUNT - safeReveals || 1);

    const renderTile = (tileIndex: number) => {
        const isMine = mineSet.has(tileIndex);
        const isRevealed = revealedSet.has(tileIndex);
        const showMine = isMine && (isRevealed || explodedMine !== null || !isRoundActive);
        const showGem = isRevealed && !isMine;

        return (
            <button
                key={tileIndex}
                type="button"
                disabled={!canReveal || isRevealed}
                onClick={() => onRevealTile(tileIndex)}
                className={cn(
                    "group relative aspect-square rounded-2xl border transition-all duration-150",
                    "flex items-center justify-center overflow-hidden",
                    isRevealed
                        ? isMine
                            ? "border-red-400/70 bg-linear-to-br from-red-500/90 to-rose-700/95"
                            : "border-emerald-300/70 bg-linear-to-br from-emerald-300 to-lime-200 text-slate-900"
                        : "border-slate-500/35 bg-linear-to-br from-slate-800/95 to-slate-950 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:shadow-[0_0_18px_rgba(103,232,249,0.2)]",
                    !canReveal && !isRevealed && "cursor-default opacity-80",
                    explodedMine === tileIndex && "ring-4 ring-red-300/60"
                )}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%)]" />
                {!isRevealed && !showMine && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 transition-colors group-hover:text-cyan-200">
                        Pick
                    </span>
                )}
                {showGem && <Gem className="relative z-10 h-6 w-6" />}
                {showMine && <Bomb className="relative z-10 h-6 w-6 text-white" />}
            </button>
        );
    };

    return (
        <div className="absolute inset-0 z-10 flex flex-col gap-4 bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_30%),linear-gradient(180deg,_rgba(9,14,26,0.84),_rgba(4,8,15,0.96))] p-4 text-slate-100 sm:p-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Mines</p>
                    <p className="mt-1 font-[Nohemi,sans-serif] text-2xl text-cyan-200">{mineCount}</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Safe Picks</p>
                    <p className="mt-1 font-[Nohemi,sans-serif] text-2xl text-emerald-200">{safeReveals}</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Multiplier</p>
                    <p className="mt-1 font-[Nohemi,sans-serif] text-2xl text-white">{currentMultiplier.toFixed(2)}x</p>
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Current Payout</p>
                    <p className="mt-1 font-[Nohemi,sans-serif] text-2xl text-amber-200">{currentPayout.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="rounded-[28px] border border-slate-700/60 bg-slate-950/55 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.3)] sm:p-4">
                    <div
                        className="grid gap-2.5 sm:gap-3"
                        style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: BOARD_TILE_COUNT }, (_, tileIndex) => renderTile(tileIndex))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 rounded-[28px] border border-slate-700/60 bg-slate-950/70 p-4">
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/8 p-4">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-5 w-5 text-emerald-300" />
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/70">Next Safe Tile</p>
                                <p className="font-[Nohemi,sans-serif] text-2xl text-white">{nextMultiplier.toFixed(2)}x</p>
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">Cashout after one more gem: {nextPayout.toFixed(2)} APE</p>
                    </div>

                    <div className="rounded-2xl border border-red-400/15 bg-red-400/8 p-4">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="h-5 w-5 text-red-300" />
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.22em] text-red-200/70">Risk On Next Click</p>
                                <p className="font-[Nohemi,sans-serif] text-2xl text-white">{formatPercent(hitChance)}</p>
                            </div>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">{safeTilesLeft} safe tiles still hiding on the board.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 text-sm text-slate-300">
                        <p>{resultText}</p>
                        {isAutoBetting && <p className="mt-2 text-cyan-200">Autobet is picking tiles automatically.</p>}
                    </div>

                    <div className="mt-auto grid gap-3">
                        <Button
                            type="button"
                            onClick={onCashOut}
                            disabled={!canCashOut}
                            className="h-11 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-300"
                        >
                            Cash Out {currentPayout.toFixed(2)} APE
                        </Button>
                        {!isRoundActive && (
                            <Button
                                type="button"
                                onClick={onStartRound}
                                className="h-11 rounded-xl border border-cyan-300/40 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25"
                            >
                                Start New Round
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyGameWindow;
