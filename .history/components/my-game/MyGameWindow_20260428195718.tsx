"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { BOARD_TILE_COUNT, BOARD_COLUMNS } from "@/components/my-game/myGameConfig";

interface MyGameWindowProps {
    minePositions: number[];
    revealedTiles: number[];
    explodedMine: number | null;
    mineCount: number;
    isRoundActive: boolean;
    isAutoBetting: boolean;
    canReveal: boolean;
    canCashOut: boolean;
    canDeal: boolean;
    betAmount: number;
    currentMultiplier: number;
    onRevealTile: (index: number) => void;
    onCashOut: () => void;
    onDeal: () => void;
}

type TileState = "unrevealed" | "gem" | "exploded" | "mine-revealed";

const getTileState = (
    index: number,
    minePositions: number[],
    revealedTiles: number[],
    explodedMine: number | null,
): TileState => {
    if (index === explodedMine) return "exploded";
    if (revealedTiles.includes(index)) return "gem";
    if (explodedMine !== null && minePositions.includes(index)) return "mine-revealed";
    return "unrevealed";
};

const MyGameWindow: React.FC<MyGameWindowProps> = ({
    minePositions,
    revealedTiles,
    explodedMine,
    mineCount,
    isRoundActive,
    isAutoBetting,
    canReveal,
    canCashOut,
    canDeal,
    betAmount,
    currentMultiplier,
    onRevealTile,
    onCashOut,
    onDeal,
}) => {
    const safeTileCount = BOARD_TILE_COUNT - mineCount;
    const revealedCount = revealedTiles.length;
    const cashoutAmount = Number((betAmount * currentMultiplier).toFixed(2));

    return (
        <div className={"hilo-root"}>
            <div className={"hilo-vignette"} />

            {/* Stats row */}
            <div className="relative z-[2] grid grid-cols-3 gap-2">
                <div className={"hilo-stat"}>
                    <span>Mines</span>
                    <strong className={"hilo-nohemi-number"}>{mineCount}</strong>
                </div>
                <div className={"hilo-stat"} style={{ alignItems: "center" }}>
                    <span>Multiplier</span>
                    <strong
                        className={"hilo-nohemi-number"}
                        style={{ color: currentMultiplier > 1 ? "#8CFF00" : undefined }}
                    >
                        {currentMultiplier.toFixed(2)}x
                    </strong>
                </div>
                <div className={"hilo-stat"} style={{ alignItems: "flex-end" }}>
                    <span>Gems Left</span>
                    <strong className={"hilo-nohemi-number"}>
                        {Math.max(0, safeTileCount - revealedCount)}
                    </strong>
                </div>
            </div>

            {/* Tile grid */}
            <div className="relative z-[2] flex flex-1 items-center justify-center">
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${BOARD_COLUMNS}, minmax(0, 1fr))`,
                        gap: "7px",
                        width: "100%",
                        maxWidth: "300px",
                    }}
                >
                    {Array.from({ length: BOARD_TILE_COUNT }, (_, i) => {
                        const state = getTileState(i, minePositions, revealedTiles, explodedMine);
                        const isClickable = isRoundActive && canReveal && state === "unrevealed" && !isAutoBetting;
                        return (
                            <button
                                key={i}
                                onClick={() => { if (isClickable) onRevealTile(i); }}
                                disabled={!isClickable}
                                className="mines-tile"
                                data-state={state}
                                aria-label={`Tile ${i + 1}`}
                            >
                                {state === "gem" && (
                                    <span className="mines-tile-gem">◆</span>
                                )}
                                {(state === "exploded" || state === "mine-revealed") && (
                                    <span className={state === "exploded" ? "mines-tile-exploded-icon" : "mines-tile-mine-icon"}>
                                        ✕
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Action button */}
            <div className="relative z-[2]">
                {isRoundActive ? (
                    <Button
                        onClick={onCashOut}
                        disabled={!canCashOut || isAutoBetting}
                        className={"hilo-cashout-btn w-full"}
                    >
                        {canCashOut
                            ? `Cash Out - ${cashoutAmount.toFixed(2)} APE`
                            : "Reveal a gem first"}
                    </Button>
                ) : (
                    <Button
                        onClick={onDeal}
                        disabled={!canDeal}
                        className={"hilo-cashout-btn w-full"}
                    >
                        <span className={"hilo-deal-label"}>Deal</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default MyGameWindow;
