"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const EXPLOSION_SPRITE_SRC = "/my-game/explosion-sprite.png";
const EXPLOSION_FRAME_COUNT = 64;
const EXPLOSION_COLUMNS = 8;
const EXPLOSION_FPS = 48;
const EXPLOSION_BOMB_PRE_DELAY_MS = 110;
const EXPLOSION_BOMB_POST_DELAY_MS = 120;

interface ExplosionSpriteProps {
    src: string;
    frameCount: number;
    columns: number;
    fps: number;
    className?: string;
}

const ExplosionSprite: React.FC<ExplosionSpriteProps> = ({
    src,
    frameCount,
    columns,
    fps,
    className,
}) => {
    const [frame, setFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
        const image = new Image();
        image.onload = () => setImageFailed(false);
        image.onerror = () => setImageFailed(true);
        image.src = src;
    }, [src]);

    useEffect(() => {
        setFrame(0);
        setIsPlaying(false);
        const totalFrames = Math.max(1, frameCount);
        const msPerFrame = Math.max(16, Math.round(1000 / Math.max(1, fps)));
        let frameTimer: number | null = null;
        let hideTimer: number | null = null;

        const introTimer = window.setTimeout(() => {
            setIsPlaying(true);
            frameTimer = window.setInterval(() => {
                setFrame((prev) => {
                    if (prev >= totalFrames - 1) {
                        if (frameTimer !== null) {
                            window.clearInterval(frameTimer);
                            frameTimer = null;
                        }
                        if (hideTimer === null) {
                            hideTimer = window.setTimeout(() => {
                                setIsPlaying(false);
                            }, EXPLOSION_BOMB_POST_DELAY_MS);
                        }
                        return prev;
                    }
                    return prev + 1;
                });
            }, msPerFrame);
        }, EXPLOSION_BOMB_PRE_DELAY_MS);

        return () => {
            window.clearTimeout(introTimer);
            if (frameTimer !== null) {
                window.clearInterval(frameTimer);
            }
            if (hideTimer !== null) {
                window.clearTimeout(hideTimer);
            }
        };
    }, [frameCount, fps]);

    const rows = useMemo(() => Math.max(1, Math.ceil(frameCount / Math.max(1, columns))), [frameCount, columns]);
    const col = frame % Math.max(1, columns);
    const row = Math.floor(frame / Math.max(1, columns));

    const xPercent = columns <= 1 ? 0 : (col / (columns - 1)) * 100;
    const yPercent = rows <= 1 ? 0 : (row / (rows - 1)) * 100;

    if (imageFailed || !isPlaying) return null;

    return (
        <span
            aria-hidden="true"
            className={className}
            style={{
                backgroundImage: `url(${src})`,
                backgroundSize: `${columns * 100}% ${rows * 100}%`,
                backgroundPosition: `${xPercent}% ${yPercent}%`,
            }}
        />
    );
};

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
                    const isManualChosen = !isAutoBetting && !showAutoSelectedTiles && (revealedTiles.includes(i) || i === explodedMine);
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
                            data-manual-chosen={isManualChosen ? "true" : "false"}
                            aria-label={`Tile ${i + 1}`}
                        >
                            {state === "gem" && (
                                <img
                                    src="/my-game/diamond.svg"
                                    alt="Diamond"
                                    className="mines-tile-icon mines-tile-gem"
                                    draggable={false}
                                />
                            )}
                            {state === "exploded" && (
                                <>
                                    <img
                                        src="/my-game/bomb.svg"
                                        alt="Bomb"
                                        className="mines-tile-icon mines-tile-exploded-icon"
                                        draggable={false}
                                    />
                                    <ExplosionSprite
                                        key={`${i}-explosion`}
                                        src={EXPLOSION_SPRITE_SRC}
                                        frameCount={EXPLOSION_FRAME_COUNT}
                                        columns={EXPLOSION_COLUMNS}
                                        fps={EXPLOSION_FPS}
                                        className="mines-tile-icon mines-explosion-sprite"
                                    />
                                </>
                            )}
                            {state === "mine-revealed" && (
                                <img
                                    src="/my-game/bomb.svg"
                                    alt="Bomb"
                                    className="mines-tile-icon mines-tile-mine-icon"
                                    draggable={false}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MyGameWindow;
