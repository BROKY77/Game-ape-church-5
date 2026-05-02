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
    showAutoSelectedTiles: boolean;
    revealAllTiles: boolean;
    pendingRevealTiles: number[];
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
    revealAllTiles: boolean,
): TileState => {
    if (index === explodedMine) return "exploded";
    if (revealAllTiles && minePositions.includes(index)) return "mine-revealed";
    if (revealAllTiles) return "gem";
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
    showAutoSelectedTiles,
    revealAllTiles,
    pendingRevealTiles,
    autoSelectedTiles,
    canReveal,
    onRevealTile,
    onToggleAutoTile,
}) => {
    const handleTileAction = (
        index: number,
        isRevealClickable: boolean,
        isSelectClickable: boolean,
    ): void => {
        if (isRevealClickable) {
            onRevealTile(index);
            return;
        }

        if (isSelectClickable) {
            onToggleAutoTile(index);
        }
    };

    return (
        <div className="mines-grid-root">
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${BOARD_COLUMNS}, 1fr)`,
                    gridTemplateRows: `repeat(${BOARD_COLUMNS}, minmax(0, 1fr))`,
                    gap: "clamp(11px, 2.1vw, 16px)",
                    width: "100%",
                    height: "100%",
                }}
            >
                {Array.from({ length: BOARD_TILE_COUNT }, (_, i) => {
                    const state = getTileState(i, minePositions, revealedTiles, explodedMine, revealAllTiles);
                    const isRevealClickable = isRoundActive && canReveal && state === "unrevealed" && !isAutoBetting;
                    const isSelectClickable = isAutoSelectionMode && state === "unrevealed";
                    const isManualHoverPreview = !isRoundActive && !isAutoSelectionMode && !isAutoBetting && state === "unrevealed";
                    const isPendingReveal = pendingRevealTiles.includes(i) && state === "unrevealed";
                    const isInteractive = (isRevealClickable && !isPendingReveal) || isSelectClickable;
                    const isAutoSelected = showAutoSelectedTiles && autoSelectedTiles.includes(i);
                    return (
                        <button
                            key={i}
                            onPointerDown={(event) => {
                                if (!isInteractive) return;
                                event.preventDefault();
                                handleTileAction(i, isRevealClickable, isSelectClickable);
                            }}
                            onKeyDown={(event) => {
                                if (!isInteractive) return;
                                if (event.key !== "Enter" && event.key !== " ") return;
                                event.preventDefault();
                                handleTileAction(i, isRevealClickable, isSelectClickable);
                            }}
                            disabled={!isInteractive && !isManualHoverPreview}
                            className="mines-tile"
                            data-state={state}
                            data-auto-selected={isAutoSelected ? "true" : "false"}
                            data-auto-mode={showAutoSelectedTiles ? "true" : "false"}
                            data-pending-reveal={isPendingReveal ? "true" : "false"}
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
