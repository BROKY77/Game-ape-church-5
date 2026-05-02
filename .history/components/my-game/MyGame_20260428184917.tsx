"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { bytesToHex } from "viem";
import GameWindow from "@/components/shared/GameWindow";
import MyGameSetupCard from "./MyGameSetupCard";
import MyGameWindow from "./MyGameWindow";
import { Game, randomBytes } from "@/lib/games";
import "./my-game.style.css";
import {
    DEFAULT_MINE_COUNT,
    HOUSE_EDGE,
    MAX_MINE_COUNT,
    MIN_MINE_COUNT,
    createMinePositions,
    createRevealOrder,
    getMinesMultiplier,
} from "@/components/my-game/myGameConfig";

interface MyGameProps {
    game: Game;
}

interface MinesRoundState {
    randomWord: `0x${string}` | null;
    minePositions: number[];
    revealOrder: number[];
    revealedTiles: number[];
    explodedMine: number | null;
    safeReveals: number;
    currentMultiplier: number;
    payout: number | null;
    resultText: string;
    isLoading: boolean;
    isResolving: boolean;
}

interface ChainRoundData {
    roundId: bigint;
    randomWord: `0x${string}`;
    houseEdge: number;
    maxPayout: number;
}

const DEFAULT_POOL_MAX_PAYOUT = 10000;
const AUTO_ACTION_DELAY_MS = 260;
const AUTO_NEXT_ROUND_DELAY_MS = 420;
const RESOLVE_DELAY_MS = 520;
const ROUND_DEAL_DELAY_MS = 260;

const INITIAL_ROUND_STATE: MinesRoundState = {
    randomWord: null,
    minePositions: [],
    revealOrder: [],
    revealedTiles: [],
    explodedMine: null,
    safeReveals: 0,
    currentMultiplier: 1,
    payout: null,
    resultText: "Set your mine count, reveal gems, and cash out before you hit a mine.",
    isLoading: false,
    isResolving: false,
};

const clampHouseEdge = (value: number) => Math.min(0.9999, Math.max(0.9, value));

const MyGame: React.FC<MyGameProps> = ({ game }) => {
    const [currentGameId, setCurrentGameId] = useState<bigint>(BigInt(bytesToHex(new Uint8Array(randomBytes(32)))));
    const [currentView, setCurrentView] = useState<0 | 1 | 2>(0);
    const [betAmount, setBetAmount] = useState(1);
    const [mineCount, setMineCount] = useState(DEFAULT_MINE_COUNT);
    const [betMode, setBetMode] = useState<"manual" | "auto">("manual");
    const [autoBetCount, setAutoBetCount] = useState(10);
    const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState(2);
    const [walletBalance, setWalletBalance] = useState(25);
    const [walletShake, setWalletShake] = useState(false);
    const [autoTotalPayout, setAutoTotalPayout] = useState(0);
    const [autoRoundsPlayed, setAutoRoundsPlayed] = useState(0);
    const [remainingAutoBets, setRemainingAutoBets] = useState(0);
    const [isAutoBetting, setIsAutoBetting] = useState(false);
    const [roundState, setRoundState] = useState<MinesRoundState>(INITIAL_ROUND_STATE);
    const [, setIsSfxMuted] = useState(false);
    const [, setIsMusicMuted] = useState(false);
    const [chainHouseEdge, setChainHouseEdge] = useState(() => clampHouseEdge(HOUSE_EDGE));
    const [maxPayoutPerGame, setMaxPayoutPerGame] = useState(DEFAULT_POOL_MAX_PAYOUT);

    const autoActionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const walletShakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const houseEdge = clampHouseEdge(chainHouseEdge);

    const resetTimers = (): void => {
        if (autoActionTimeoutRef.current !== null) {
            clearTimeout(autoActionTimeoutRef.current);
            autoActionTimeoutRef.current = null;
        }
        if (resolveTimeoutRef.current !== null) {
            clearTimeout(resolveTimeoutRef.current);
            resolveTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            resetTimers();
            if (walletShakeTimeoutRef.current !== null) {
                clearTimeout(walletShakeTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setMineCount((previous) => Math.max(MIN_MINE_COUNT, Math.min(MAX_MINE_COUNT, previous)));
    }, []);

    const triggerWalletShake = (): void => {
        setWalletShake(false);
        if (walletShakeTimeoutRef.current !== null) {
            clearTimeout(walletShakeTimeoutRef.current);
        }
        requestAnimationFrame(() => {
            setWalletShake(true);
            walletShakeTimeoutRef.current = setTimeout(() => setWalletShake(false), 500);
        });
    };

    const requestRoundFromChain = async (): Promise<ChainRoundData> => {
        const useMockChain = process.env.NEXT_PUBLIC_APE_CHAIN_MODE !== "live";

        if (!useMockChain) {
            throw new Error("On-chain adapter not configured. Connect Ape Church round request/settlement APIs.");
        }

        const randomWord = bytesToHex(new Uint8Array(randomBytes(32))) as `0x${string}`;
        const roundId = BigInt(bytesToHex(new Uint8Array(randomBytes(32))));

        return {
            roundId,
            randomWord,
            houseEdge: clampHouseEdge(HOUSE_EDGE),
            maxPayout: DEFAULT_POOL_MAX_PAYOUT,
        };
    };

    const finishRound = (roundPayout: number, text: string): void => {
        const cappedRoundPayout = Number(Math.min(roundPayout, maxPayoutPerGame).toFixed(2));
        if (cappedRoundPayout > 0) {
            setWalletBalance((previous) => Number((previous + cappedRoundPayout).toFixed(2)));
        }

        setRoundState((previous) => ({
            ...previous,
            payout: cappedRoundPayout,
            resultText:
                cappedRoundPayout < roundPayout
                    ? `${text} Payout capped by house pool liquidity.`
                    : text,
            isResolving: false,
        }));
        setCurrentView(2);

        if (isAutoBetting) {
            setAutoRoundsPlayed((previous) => previous + 1);
            setAutoTotalPayout((previous) => Number((previous + cappedRoundPayout).toFixed(2)));
            setRemainingAutoBets((previous) => Math.max(0, previous - 1));
        }
    };

    const startRound = async (options?: { fromAuto?: boolean }): Promise<void> => {
        if (betAmount <= 0) {
            return;
        }

        if (walletBalance < betAmount) {
            triggerWalletShake();
            setRoundState((previous) => ({
                ...previous,
                resultText: "Not enough balance to start this round.",
                isLoading: false,
            }));
            setIsAutoBetting(false);
            return;
        }

        resetTimers();
        setCurrentView(0);
        setRoundState((previous) => ({
            ...previous,
            isLoading: true,
            isResolving: false,
            payout: null,
            resultText: options?.fromAuto ? "Autobet is buying the next board..." : "Buying a fresh board...",
        }));
        setWalletBalance((previous) => Number((previous - betAmount).toFixed(2)));

        try {
            const chainRound = await requestRoundFromChain();
            setCurrentGameId(chainRound.roundId);
            setChainHouseEdge(chainRound.houseEdge);
            setMaxPayoutPerGame(Number(Math.max(1, chainRound.maxPayout).toFixed(2)));

            const nextMinePositions = createMinePositions(chainRound.randomWord, mineCount);
            const nextRevealOrder = createRevealOrder(chainRound.randomWord);

            window.setTimeout(() => {
                setRoundState({
                    randomWord: chainRound.randomWord,
                    minePositions: nextMinePositions,
                    revealOrder: nextRevealOrder,
                    revealedTiles: [],
                    explodedMine: null,
                    safeReveals: 0,
                    currentMultiplier: 1,
                    payout: null,
                    resultText: "Round live. Click a tile to reveal a gem or a mine.",
                    isLoading: false,
                    isResolving: false,
                });
                setCurrentView(1);
            }, ROUND_DEAL_DELAY_MS);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to retrieve on-chain randomness.";
            setWalletBalance((previous) => Number((previous + betAmount).toFixed(2)));
            setRoundState((previous) => ({
                ...previous,
                isLoading: false,
                resultText: message,
            }));
            setIsAutoBetting(false);
        }
    };

    const handleRevealTile = (tileIndex: number): void => {
        if (
            currentView !== 1 ||
            roundState.isLoading ||
            roundState.isResolving ||
            roundState.revealedTiles.includes(tileIndex)
        ) {
            return;
        }

        const hitMine = roundState.minePositions.includes(tileIndex);
        const nextRevealedTiles = [...roundState.revealedTiles, tileIndex];

        if (hitMine) {
            setRoundState((previous) => ({
                ...previous,
                revealedTiles: nextRevealedTiles,
                explodedMine: tileIndex,
                isResolving: true,
                resultText: "Mine hit. Round lost.",
            }));

            resolveTimeoutRef.current = setTimeout(() => {
                finishRound(0, "Mine hit. You lost the round.");
            }, RESOLVE_DELAY_MS);
            return;
        }

        const nextSafeReveals = roundState.safeReveals + 1;
        const nextMultiplier = getMinesMultiplier(mineCount, nextSafeReveals, houseEdge);
        const allSafeTilesCleared = nextSafeReveals >= 25 - mineCount;

        setRoundState((previous) => ({
            ...previous,
            revealedTiles: nextRevealedTiles,
            safeReveals: nextSafeReveals,
            currentMultiplier: nextMultiplier,
            resultText: allSafeTilesCleared
                ? "All safe tiles revealed. Forced cashout incoming."
                : `Gem found. Multiplier climbed to ${nextMultiplier.toFixed(2)}x.`,
        }));

        if (allSafeTilesCleared) {
            resolveTimeoutRef.current = setTimeout(() => {
                finishRound(betAmount * nextMultiplier, `Perfect clear. Cashed out at ${nextMultiplier.toFixed(2)}x.`);
            }, RESOLVE_DELAY_MS);
        }
    };

    const handleCashOut = (): void => {
        if (currentView !== 1 || roundState.isLoading || roundState.isResolving || roundState.safeReveals <= 0) {
            return;
        }

        finishRound(
            betAmount * roundState.currentMultiplier,
            `Cashed out at ${roundState.currentMultiplier.toFixed(2)}x after ${roundState.safeReveals} safe pick${roundState.safeReveals === 1 ? "" : "s"}.`
        );
    };

    const stopAutobet = (): void => {
        resetTimers();
        setIsAutoBetting(false);
        setRoundState((previous) => ({
            ...previous,
            isResolving: false,
            resultText: currentView === 1 ? "Autobet stopped. You can finish this board manually or cash out." : "Autobet stopped.",
        }));
    };

    const startAutobet = async (): Promise<void> => {
        if (isAutoBetting) {
            return;
        }

        if (walletBalance < betAmount) {
            triggerWalletShake();
            setRoundState((previous) => ({
                ...previous,
                resultText: "Not enough balance to start autobet.",
            }));
            return;
        }

        setAutoTotalPayout(0);
        setAutoRoundsPlayed(0);
        setRemainingAutoBets(autoBetCount);
        setIsAutoBetting(true);
        setBetMode("auto");
        await startRound({ fromAuto: true });
    };

    const handleReset = (): void => {
        resetTimers();
        setCurrentView(0);
        setRoundState(INITIAL_ROUND_STATE);
        setIsAutoBetting(false);
        setRemainingAutoBets(0);
    };

    const handlePlayAgain = (): void => {
        if (betMode === "auto") {
            void startAutobet();
            return;
        }

        void startRound();
    };

    const handleBetModeChange = (mode: "manual" | "auto"): void => {
        resetTimers();
        setIsAutoBetting(false);
        setRemainingAutoBets(0);
        setBetMode(mode);
        setCurrentView(0);
        setRoundState(INITIAL_ROUND_STATE);
    };

    const nextMultiplier = useMemo(
        () => getMinesMultiplier(mineCount, roundState.safeReveals + 1, houseEdge),
        [mineCount, roundState.safeReveals, houseEdge]
    );
    const currentPayout = Number(Math.min(betAmount * roundState.currentMultiplier, maxPayoutPerGame).toFixed(2));
    const modalPayout = betMode === "auto" && !isAutoBetting && autoRoundsPlayed > 0 ? autoTotalPayout : roundState.payout;
    const canReveal = currentView === 1 && !roundState.isLoading && !roundState.isResolving;
    const canCashOut = canReveal && roundState.safeReveals > 0;

    useEffect(() => {
        if (!isAutoBetting || currentView !== 1 || roundState.isLoading || roundState.isResolving) {
            return;
        }

        if (roundState.safeReveals > 0 && roundState.currentMultiplier >= autoCashoutMultiplier) {
            autoActionTimeoutRef.current = setTimeout(() => {
                handleCashOut();
            }, AUTO_ACTION_DELAY_MS);
            return;
        }

        const nextAutoTile = roundState.revealOrder.find((tileIndex) => !roundState.revealedTiles.includes(tileIndex));
        if (nextAutoTile === undefined) {
            return;
        }

        autoActionTimeoutRef.current = setTimeout(() => {
            handleRevealTile(nextAutoTile);
        }, AUTO_ACTION_DELAY_MS);

        return () => {
            if (autoActionTimeoutRef.current !== null) {
                clearTimeout(autoActionTimeoutRef.current);
                autoActionTimeoutRef.current = null;
            }
        };
    }, [
        isAutoBetting,
        currentView,
        roundState.isLoading,
        roundState.isResolving,
        roundState.safeReveals,
        roundState.currentMultiplier,
        roundState.revealOrder,
        roundState.revealedTiles,
        autoCashoutMultiplier,
        handleCashOut,
        handleRevealTile,
    ]);

    useEffect(() => {
        if (!isAutoBetting || currentView !== 2) {
            return;
        }

        if (remainingAutoBets <= 0) {
            setIsAutoBetting(false);
            return;
        }

        autoActionTimeoutRef.current = setTimeout(() => {
            void startRound({ fromAuto: true });
        }, AUTO_NEXT_ROUND_DELAY_MS);

        return () => {
            if (autoActionTimeoutRef.current !== null) {
                clearTimeout(autoActionTimeoutRef.current);
                autoActionTimeoutRef.current = null;
            }
        };
    }, [isAutoBetting, currentView, remainingAutoBets, startRound]);

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
            <GameWindow
                game={game}
                currentGameId={currentGameId}
                isLoading={roundState.isLoading && currentView !== 1}
                isGameFinished={currentView === 2 && modalPayout !== null}
                onPlayAgain={handlePlayAgain}
                playAgainText={betMode === "auto" ? "Run Again" : "Play Again"}
                onReset={handleReset}
                betAmount={betAmount}
                payout={modalPayout}
                inReplayMode={false}
                isUserOriginalPlayer
                showPNL={(modalPayout ?? 0) > betAmount}
                isGamePaused={false}
                resultModalDelayMs={250}
                disableBuiltInSong
                onMusicMutedChange={setIsMusicMuted}
                onSfxMutedChange={setIsSfxMuted}
            >
                <MyGameWindow
                    minePositions={roundState.minePositions}
                    revealedTiles={roundState.revealedTiles}
                    explodedMine={roundState.explodedMine}
                    mineCount={mineCount}
                    safeReveals={roundState.safeReveals}
                    currentMultiplier={roundState.currentMultiplier}
                    nextMultiplier={nextMultiplier}
                    betAmount={betAmount}
                    isAutoBetting={isAutoBetting}
                    isRoundActive={currentView === 1}
                    canReveal={canReveal}
                    canCashOut={canCashOut}
                    resultText={roundState.resultText}
                    onRevealTile={handleRevealTile}
                    onCashOut={handleCashOut}
                    onStartRound={() => void startRound()}
                />
            </GameWindow>

            <MyGameSetupCard
                currentView={currentView}
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                mineCount={mineCount}
                setMineCount={setMineCount}
                betMode={betMode}
                setBetMode={handleBetModeChange}
                autoBetCount={autoBetCount}
                setAutoBetCount={setAutoBetCount}
                autoCashoutMultiplier={autoCashoutMultiplier}
                setAutoCashoutMultiplier={setAutoCashoutMultiplier}
                isAutoBetting={isAutoBetting}
                remainingAutoBets={remainingAutoBets}
                autoTotalPayout={autoTotalPayout}
                autoRoundsPlayed={autoRoundsPlayed}
                currentPayout={currentPayout}
                walletBalance={walletBalance}
                walletShake={walletShake}
                maxPayoutPerGame={maxPayoutPerGame}
                isBusy={roundState.isLoading || roundState.isResolving}
                resultText={roundState.resultText}
                onStartManual={() => void startRound()}
                onStartAutobet={() => void startAutobet()}
                onStopAutobet={stopAutobet}
            />
        </div>
    );
};

export default MyGame;
