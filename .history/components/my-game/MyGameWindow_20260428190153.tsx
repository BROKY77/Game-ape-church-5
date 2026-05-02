"use client";

import React from "react";
import { Bomb, Gem } from "lucide-react";
import { BOARD_COLUMNS, BOARD_TILE_COUNT } from "@/components/my-game/myGameConfig";
import { cn } from "@/lib/utils";

interface MyGameWindowProps {
    minePositions: number[];
    revealedTiles: number[];
    explodedMine: number | null;
    isRoundActive: boolean;
    canReveal: boolean;
    onRevealTile: (tileIndex: number) => void;
}

const MyGameWindow: React.FC<MyGameWindowProps> = ({
    minePositions,
    revealedTiles,
    explodedMine,
    isRoundActive,
    canReveal,
    onRevealTile,
}) => {
    const mineSet = React.useMemo(() => new Set(minePositions), [minePositions]);
    const revealedSet = React.useMemo(() => new Set(revealedTiles), [revealedTiles]);

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-linear-to-b from-[#0f2534]/85 to-[#091826]/95 p-4 sm:p-6">
            <div className="rounded-[12px] border border-[#1c3a4f] bg-[#0a2030]/85 p-3 sm:p-4 lg:p-5">
                <div
                    className="grid gap-2.5 sm:gap-3"
                    style={{ gridTemplateColumns: `repeat(${BOARD_COLUMNS}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: BOARD_TILE_COUNT }, (_, tileIndex) => {
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
                                    "group relative aspect-square w-[74px] rounded-[10px] border transition-all duration-150 sm:w-[84px] lg:w-[96px]",
                                    "flex items-center justify-center overflow-hidden",
                                    isRevealed
                                        ? isMine
                                            ? "border-[#a73445] bg-linear-to-b from-[#b43f50] to-[#7c2433]"
                                            : "border-[#3c7f98] bg-linear-to-b from-[#2b5168] to-[#213f53]"
                                        : "border-[#37566a] bg-linear-to-b from-[#395468] to-[#2b465a] hover:-translate-y-0.5 hover:brightness-110",
                                    !canReveal && !isRevealed && "cursor-default opacity-80",
                                    explodedMine === tileIndex && "ring-2 ring-[#ff667b]"
                                )}
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)]" />
                                {!isRevealed && !showMine && (
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#95afbf] transition-colors group-hover:text-[#d8e8f2]">
                                        Tile
                                    </span>
                                )}
                                {showGem && <Gem className="relative z-10 h-6 w-6 text-[#8fd4f2]" />}
                                {showMine && <Bomb className="relative z-10 h-6 w-6 text-white" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MyGameWindow;
