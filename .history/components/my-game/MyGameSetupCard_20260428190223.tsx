import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BetAmountInput from "@/components/shared/BetAmountInput";
import { MAX_MINE_COUNT, MIN_MINE_COUNT } from "@/components/my-game/myGameConfig";

interface MyGameSetupCardProps {
    currentView: 0 | 1 | 2;
    betAmount: number;
    setBetAmount: (amount: number) => void;
    mineCount: number;
    setMineCount: (count: number) => void;
    betMode: "manual" | "auto";
    setBetMode: (mode: "manual" | "auto") => void;
    autoBetCount: number;
    setAutoBetCount: (count: number) => void;
    autoCashoutMultiplier: number;
    setAutoCashoutMultiplier: (multiplier: number) => void;
    isAutoBetting: boolean;
    remainingAutoBets: number;
    autoTotalPayout: number;
    autoRoundsPlayed: number;
    currentPayout: number;
    currentMultiplier: number;
    walletBalance: number;
    walletShake: boolean;
    isBusy: boolean;
    isRoundActive: boolean;
    canCashOut: boolean;
    gemsLeft: number;
    resultText: string;
    onStartManual: () => void;
    onStartAutobet: () => void;
    onStopAutobet: () => void;
    onCashOut: () => void;
    onRandomPick: () => void;
}

const clampWhole = (value: number, minimum: number, maximum: number): number => {
    if (!Number.isFinite(value)) {
        return minimum;
    }

    return Math.max(minimum, Math.min(maximum, Math.floor(value)));
};

const MyGameSetupCard: React.FC<MyGameSetupCardProps> = ({
    currentView,
    betAmount,
    setBetAmount,
    mineCount,
    setMineCount,
    betMode,
    setBetMode,
    autoBetCount,
    setAutoBetCount,
    autoCashoutMultiplier,
    setAutoCashoutMultiplier,
    isAutoBetting,
    remainingAutoBets,
    autoTotalPayout,
    autoRoundsPlayed,
    currentPayout,
    currentMultiplier,
    walletBalance,
    walletShake,
    isBusy,
    isRoundActive,
    canCashOut,
    gemsLeft,
    resultText,
    onStartManual,
    onStartAutobet,
    onStopAutobet,
    onCashOut,
    onRandomPick,
}) => {
    const [usdMode, setUsdMode] = React.useState(false);
    const [autoBetDraft, setAutoBetDraft] = React.useState(() => String(autoBetCount));
    const [cashoutDraft, setCashoutDraft] = React.useState(() => String(autoCashoutMultiplier));

    React.useEffect(() => {
        setAutoBetDraft(String(autoBetCount));
    }, [autoBetCount]);

    React.useEffect(() => {
        setCashoutDraft(String(autoCashoutMultiplier));
    }, [autoCashoutMultiplier]);

    const controlsDisabled = isBusy || isAutoBetting;

    const commitAutoBetDraft = (): void => {
        const parsed = Number(autoBetDraft);
        const next = clampWhole(parsed, 1, 1000);
        setAutoBetCount(next);
        setAutoBetDraft(String(next));
    };

    const commitCashoutDraft = (): void => {
        const parsed = Number(cashoutDraft);
        const next = Number.isFinite(parsed) ? Math.max(1.01, Math.min(100, parsed)) : 2;
        const rounded = Number(next.toFixed(2));
        setAutoCashoutMultiplier(rounded);
        setCashoutDraft(String(rounded));
    };

    return (
        <Card className="w-full border-[#173447] bg-[#102a3a]/95 text-[#d5e6f1] lg:max-w-[300px]">
            <CardContent className="p-3">
                <div className="rounded-[14px] bg-[#0f2433] p-1">
                    <div className="grid grid-cols-2 gap-1">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setBetMode("manual")}
                            disabled={isAutoBetting}
                            className={`h-9 rounded-full ${betMode === "manual" ? "bg-[#3b5f76] text-white" : "text-[#d1e1ec] hover:bg-[#1b3b4f]"}`}
                        >
                            Manual
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setBetMode("auto")}
                            disabled={isAutoBetting}
                            className={`h-9 rounded-full ${betMode === "auto" ? "bg-[#3b5f76] text-white" : "text-[#d1e1ec] hover:bg-[#1b3b4f]"}`}
                        >
                            Auto
                        </Button>
                    </div>
                </div>

                <div className="mt-3 space-y-3">
                    <BetAmountInput
                        min={0}
                        max={Math.max(0, walletBalance)}
                        step={0.1}
                        value={betAmount}
                        onChange={setBetAmount}
                        balance={walletBalance}
                        disabled={controlsDisabled || isRoundActive}
                        usdMode={usdMode}
                        setUsdMode={setUsdMode}
                        themeColorBackground="#2f83d2"
                    />

                    <div className="space-y-1">
                        <p className="text-sm font-medium text-[#a9c0d0]">Mines</p>
                        <select
                            value={mineCount}
                            disabled={controlsDisabled || isRoundActive}
                            onChange={(event) => setMineCount(Number(event.target.value))}
                            className="h-10 w-full rounded-[8px] border border-[#2c4d63] bg-[#0f2738] px-3 text-[#e4f0f7] outline-none"
                        >
                            {Array.from({ length: MAX_MINE_COUNT - MIN_MINE_COUNT + 1 }, (_, index) => index + MIN_MINE_COUNT).map((count) => (
                                <option key={count} value={count}>
                                    {count}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm font-medium text-[#a9c0d0]">Gems</p>
                        <div className="flex h-10 items-center rounded-[8px] border border-[#2c4d63] bg-[#173446] px-3 text-[#d8ebf7]">
                            {gemsLeft}
                        </div>
                    </div>

                    {betMode === "auto" && (
                        <div className="space-y-2 rounded-[8px] border border-[#2c4d63] bg-[#0f2738] p-3">
                            <label className="block text-xs uppercase tracking-[0.14em] text-[#8eaabd]">Auto Bets</label>
                            <input
                                type="number"
                                min={1}
                                max={1000}
                                value={autoBetDraft}
                                onChange={(event) => setAutoBetDraft(event.target.value)}
                                onBlur={commitAutoBetDraft}
                                disabled={controlsDisabled}
                                className="h-9 w-full rounded-[8px] border border-[#35576d] bg-[#173446] px-3 text-[#e4f0f7] outline-none"
                            />
                            <label className="block text-xs uppercase tracking-[0.14em] text-[#8eaabd]">Auto Cashout</label>
                            <input
                                type="number"
                                min={1.01}
                                step={0.01}
                                value={cashoutDraft}
                                onChange={(event) => setCashoutDraft(event.target.value)}
                                onBlur={commitCashoutDraft}
                                disabled={controlsDisabled}
                                className="h-9 w-full rounded-[8px] border border-[#35576d] bg-[#173446] px-3 text-[#e4f0f7] outline-none"
                            />
                        </div>
                    )}

                    {betMode === "manual" ? (
                        isRoundActive ? (
                            <Button
                                type="button"
                                onClick={onCashOut}
                                disabled={!canCashOut || isBusy}
                                className="h-10 w-full rounded-[8px] bg-[#2a82da] text-white hover:bg-[#2f94f8]"
                            >
                                Cash Out ({currentMultiplier.toFixed(2)}x)
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={onStartManual}
                                disabled={isBusy || currentView === 1}
                                className="h-10 w-full rounded-[8px] bg-[#2a82da] text-white hover:bg-[#2f94f8]"
                            >
                                Bet
                            </Button>
                        )
                    ) : isAutoBetting ? (
                        <Button
                            type="button"
                            onClick={onStopAutobet}
                            className="h-10 w-full rounded-[8px] bg-[#a83b54] text-white hover:bg-[#bf4460]"
                        >
                            Stop Autobet
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={onStartAutobet}
                            disabled={isBusy || currentView === 1}
                            className="h-10 w-full rounded-[8px] bg-[#2a82da] text-white hover:bg-[#2f94f8]"
                        >
                            Bet
                        </Button>
                    )}

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onRandomPick}
                        disabled={!isRoundActive || isBusy || isAutoBetting}
                        className="h-10 w-full rounded-[8px] border border-[#2c4d63] bg-[#1c3a4e] text-[#aec5d4] hover:bg-[#25495f]"
                    >
                        Random Pick
                    </Button>

                    <div className="rounded-[8px] border border-[#2c4d63] bg-[#132f42] p-3">
                        <div className="flex items-center justify-between text-sm text-[#9fc0d2]">
                            <span>Total Profit ({currentMultiplier.toFixed(2)}x)</span>
                            <span>{currentPayout.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 rounded-[8px] border border-[#35576d] bg-[#173446] px-3 py-2 text-lg text-[#d8ebf7]">
                            {currentPayout.toFixed(2)}
                        </div>
                    </div>

                    <div className={`rounded-[8px] border border-[#2c4d63] bg-[#132f42] p-3 text-sm text-[#a9c0d0] ${walletShake ? "hilo-wallet-shake" : ""}`}>
                        <p>{resultText}</p>
                        {betMode === "auto" && (
                            <p className="mt-2 text-xs text-[#8fb5cb]">
                                Auto rounds: {autoRoundsPlayed} played, {remainingAutoBets} left, {autoTotalPayout.toFixed(2)} paid
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default MyGameSetupCard;
