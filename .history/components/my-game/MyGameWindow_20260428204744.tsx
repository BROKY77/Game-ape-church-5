"use client";

import React from "react";
import { BOARD_TILE_COUNT, BOARD_COLUMNS } from "@/components/my-game/myGameConfig";

interface MyGameWindowProps {
    minePositions: number[];
    revealedTiles: number[];
    explodedMine: number | null;
    isRoundActive: boolean;
    isAutoBetting: boolean;
    isAutoSelectionMode: boolean;
    autoSelectedTiles: number[];
    canReveal: boolean;
    onRevealTile: (index: number) => void;
    onToggleAutoTile: (index: number) => void;
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
    isAutoSelectionMode,
    autoSelectedTiles,
    canReveal,
    onRevealTile,
    onToggleAutoTile,
}) => {
    return (
        <div className="mines-grid-root">
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)`,
                    gridTemplateRows: `repeat(${BOARD_COLUMNS}, minmax(0, 1fr))`,
                    gap: "clamp(6px, 1.4vw, 10px)",
                    width: "100%",
                    height: "100%",
                }}
            >
                {Array.from({ length: BOARD_TILE_COUNT }, (_, i) => {
                    const state = getTileState(i, minePositions, revealedTiles, explodedMine);
                    const isRevealClickable = isRoundActive && canReveal && state === "unrevealed" && !isAutoBetting;
                    const isSelectClickable = isAutoSelectionMode && state === "unrevealed";
                    const isInteractive = isRevealClickable || isSelectClickable;
                    return (
                        <button
                            key={i}
                            onClick={() => {
                                if (isRevealClickable) {
                                    onRevealTile(i);
                                    return;
                                }

                                if (isSelectClickable) {
                                    onToggleAutoTile(i);
                                }
                            }}
                            disabled={!isInteractive}
                            className="mines-tile"
                            data-state={state}
                            data-auto-selected={isAutoSelectionMode && autoSelectedTiles.includes(i) ? "true" : "false"}
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
