"use client";

import React from "react";
import { BOARD_TILE_COUNT, BOARD_COLUMNS } from "@/components/my-game/myGameConfig";

interface MyGameWindowProps {
    minePositions: number[];
    revealedTiles: number[];
    explodedMine: number | null;
    isRoundActive: boolean;
    isAutoBetting: boolean;
    canReveal: boolean;
    onRevealTile: (index: number) => void;
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
    isRoundActive,
    isAutoBetting,
    canReveal,
    onRevealTile,
}) => {
    return (
        <div className="mines-grid-root">
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)`,
                    gap: "clamp(6px, 1.4vw, 10px)",
                    width: "100%",
                    height: "100%",
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
    );
};

export default MyGameWindow;
