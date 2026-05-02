import { Game } from "@/lib/games";

export const myGame: Game = {
    title: "Mines",
    description: "Reveal gems, avoid mines, and cash out before the board bites back.",
    gameAddress: "0x1234567890123456789012345678901234567890",
    gameBackground: "/my-game/background.png",
    card: "/my-game/card.png",
    banner: "/my-game/banner.png",
    advanceToNextStateAsset: "/my-game/advance-button.png",
    themeColorBackground: "#22c55e",
    song: "/my-game/audio/song.mp3",
    payouts: {
        0: { 0: { 0: 10000 } },
    },
};

export const BOARD_TILE_COUNT = 25;
export const BOARD_COLUMNS = 5;
export const HOUSE_EDGE = 0.9885;
export const DEFAULT_MINE_COUNT = 3;
export const MIN_MINE_COUNT = 1;
export const MAX_MINE_COUNT = 24;

const PRNG_MASK_64 = (BigInt(1) << BigInt(64)) - BigInt(1);
const PRNG_A = BigInt("6364136223846793005");
const PRNG_C = BigInt("1442695040888963407");

const normalizeRandomWord = (randomWord: `0x${string}`): bigint => {
    const parsed = BigInt(randomWord);
    return (parsed & PRNG_MASK_64) || BigInt(1);
};

const nextSeed = (seed: bigint): bigint => ((seed * PRNG_A + PRNG_C) & PRNG_MASK_64) || BigInt(1);

const createShuffledIndices = (randomWord: `0x${string}`, seedOffset = 0): number[] => {
    const tiles = Array.from({ length: BOARD_TILE_COUNT }, (_, index) => index);
    let seed = normalizeRandomWord(randomWord) + BigInt(seedOffset);

    for (let index = tiles.length - 1; index > 0; index -= 1) {
        seed = nextSeed(seed);
        const swapIndex = Number(seed % BigInt(index + 1));
        [tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]];
    }

    return tiles;
};

export function createMinePositions(randomWord: `0x${string}`, mineCount: number): number[] {
    return createShuffledIndices(randomWord).slice(0, mineCount).sort((left, right) => left - right);
}

export function createRevealOrder(randomWord: `0x${string}`): number[] {
    return createShuffledIndices(randomWord, 7919);
}

export function getSafeTileCount(mineCount: number): number {
    return BOARD_TILE_COUNT - mineCount;
}

export function getRemainingSafeTiles(mineCount: number, safeReveals: number): number {
    return Math.max(0, getSafeTileCount(mineCount) - safeReveals);
}

export function getMinesStepChance(mineCount: number, safeReveals: number): number {
    const unrevealedTiles = BOARD_TILE_COUNT - safeReveals;
    const safeTilesRemaining = getRemainingSafeTiles(mineCount, safeReveals);

    if (unrevealedTiles <= 0 || safeTilesRemaining <= 0) {
        return 0;
    }

    return safeTilesRemaining / unrevealedTiles;
}

export function getMinesMultiplier(
    mineCount: number,
    safeReveals: number,
    houseEdge = HOUSE_EDGE
): number {
    if (safeReveals <= 0) {
        return 1;
    }

    let multiplier = houseEdge;
    for (let reveal = 0; reveal < safeReveals; reveal += 1) {
        const unrevealedTiles = BOARD_TILE_COUNT - reveal;
        const safeTilesRemaining = getSafeTileCount(mineCount) - reveal;

        if (unrevealedTiles <= 0 || safeTilesRemaining <= 0) {
            break;
        }

        multiplier *= unrevealedTiles / safeTilesRemaining;
    }

    return Number(multiplier.toFixed(2));
}
