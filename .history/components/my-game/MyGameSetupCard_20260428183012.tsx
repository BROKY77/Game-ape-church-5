import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BetAmountInput from "@/components/shared/BetAmountInput";
import { DEFAULT_MINE_COUNT, MAX_MINE_COUNT, MIN_MINE_COUNT } from "@/components/my-game/myGameConfig";

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
    walletBalance: number;
    walletShake: boolean;
    maxPayoutPerGame: number;
    isBusy: boolean;
    resultText: string;
    onStartManual: () => void;
    onStartAutobet: () => void;
    onStopAutobet: () => void;
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
    walletBalance,
    walletShake,
    maxPayoutPerGame,
    isBusy,
    resultText,
    onStartManual,
    onStartAutobet,
    onStopAutobet,
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

    const controlsDisabled = isBusy || currentView === 1 || isAutoBetting;

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
        <Card className="w-full border-slate-700/70 bg-[#0a1018]/95 text-slate-100 lg:max-w-[360px]">
            <CardHeader className="space-y-4">
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/75">Casino Mines</p>
                    <CardTitle className="font-[Nohemi,sans-serif] text-3xl">Configure Round</CardTitle>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900 p-1">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setBetMode("manual")}
                        disabled={isAutoBetting}
                        className={betMode === "manual" ? "bg-cyan-400/20 text-cyan-100" : "text-slate-400"}
                    >
                        Manual
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setBetMode("auto")}
                        disabled={isAutoBetting}
                        className={betMode === "auto" ? "bg-cyan-400/20 text-cyan-100" : "text-slate-400"}
                    >
                        Auto
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                <BetAmountInput
                    min={1}
                    max={Math.max(1, walletBalance)}
                    step={1}
                    value={betAmount}
                    onChange={setBetAmount}
                    balance={walletBalance}
                    disabled={controlsDisabled}
                    usdMode={usdMode}
                    setUsdMode={setUsdMode}
                    themeColorBackground="#22c55e"
                />

                <div className="grid gap-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Mine Count</label>
                    <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={controlsDisabled || mineCount <= MIN_MINE_COUNT}
                            onClick={() => setMineCount(Math.max(MIN_MINE_COUNT, mineCount - 1))}
                            className="border-slate-700 bg-slate-900"
                        >
                            -
                        </Button>
                        <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center">
                            <p className="font-[Nohemi,sans-serif] text-2xl text-cyan-100">{mineCount}</p>
                            <p className="text-xs text-slate-400">{mineCount === DEFAULT_MINE_COUNT ? "default risk" : "custom risk"}</p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={controlsDisabled || mineCount >= MAX_MINE_COUNT}
                            onClick={() => setMineCount(Math.min(MAX_MINE_COUNT, mineCount + 1))}
                            className="border-slate-700 bg-slate-900"
                        >
                            +
                        </Button>
                    </div>
                </div>

                {betMode === "auto" && (
                    <div className="grid gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/80 p-4">
                        <div className="grid gap-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Auto Bets</label>
                            <input
                                type="number"
                                min={1}
                                max={1000}
                                value={autoBetDraft}
                                onChange={(event) => setAutoBetDraft(event.target.value)}
                                onBlur={commitAutoBetDraft}
                                disabled={controlsDisabled}
                                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Auto Cashout Multiplier</label>
                            <input
                                type="number"
                                min={1.01}
                                step={0.01}
                                value={cashoutDraft}
                                onChange={(event) => setCashoutDraft(event.target.value)}
                                onBlur={commitCashoutDraft}
                                disabled={controlsDisabled}
                                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-2xl border border-slate-700 bg-slate-950/80 p-4 ${walletShake ? "hilo-wallet-shake" : ""}`}>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Wallet</p>
                        <p className="mt-2 font-[Nohemi,sans-serif] text-2xl text-emerald-200">{walletBalance.toFixed(2)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Payout</p>
                        <p className="mt-2 font-[Nohemi,sans-serif] text-2xl text-amber-200">{currentPayout.toFixed(2)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Max Pool Payout</p>
                        <p className="mt-2 font-[Nohemi,sans-serif] text-2xl text-cyan-100">{maxPayoutPerGame.toFixed(0)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Auto Summary</p>
                        <p className="mt-2 font-[Nohemi,sans-serif] text-xl text-white">{autoRoundsPlayed} / {remainingAutoBets + autoRoundsPlayed}</p>
                        <p className="text-sm text-slate-400">{autoTotalPayout.toFixed(2)} paid</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 text-sm text-slate-300">
                    {resultText}
                </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
                {betMode === "manual" ? (
                    <Button
                        type="button"
                        onClick={onStartManual}
                        disabled={isBusy || currentView === 1}
                        className="h-12 w-full rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    >
                        Start Mines Round
                    </Button>
                ) : isAutoBetting ? (
                    <Button
                        type="button"
                        onClick={onStopAutobet}
                        className="h-12 w-full rounded-xl bg-red-500 text-white hover:bg-red-400"
                    >
                        Stop Autobet
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={onStartAutobet}
                        disabled={isBusy || currentView === 1}
                        className="h-12 w-full rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    >
                        Start Autobet
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default MyGameSetupCard;
