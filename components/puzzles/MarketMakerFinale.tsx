"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SealedDice, type DiceVisualState } from "@/components/puzzles/SealedDice";
import { emit } from "@/lib/events";
import {
  endSession,
  evaluateMarket,
  getSession,
  isValidQuote,
  startSession,
  type MarketResponse,
  type Quantity,
  type Roll,
} from "@/lib/market-game";
import { NYC_MARKET_FINALE } from "@/lib/nyc-finale";
import { useGameStore } from "@/lib/store";
import { validate } from "@/lib/validators";
import "@/lib/validators.answers";

const TOTAL_ROUNDS = 3;
const PUZZLE = NYC_MARKET_FINALE;

type RoundResult = {
  round: number;
  quantity: Quantity;
  bid: number;
  ask: number;
  response: MarketResponse | "timeout";
};

type LogLine = {
  id: string;
  kind: "think" | "speak" | "system";
  text: string;
};

const VERDICT: Record<MarketResponse | "timeout", string> = {
  buy: "BUY — I lift your ask. My value sits above that ask.",
  sell: "SELL — I hit your bid. My value sits below that bid.",
  hold: "HOLD — no trade. Your market covers my value.",
  timeout: "Round skipped.",
};

function toInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type MarketMakerFinaleProps = {
  onClose: () => void;
};

/**
 * NYC finale: market-maker vs MIRA.
 * Engine owns Buy/Sell/Hold + guess validation; MIRA only narrates/thinks aloud.
 */
export function MarketMakerFinale({ onClose }: MarketMakerFinaleProps) {
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const setStatus = useGameStore((s) => s.setStatus);

  const [diceState, setDiceState] = useState<DiceVisualState>("rolling");
  const [roll, setRoll] = useState<Roll | null>(null);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"markets" | "guess" | "lost">("markets");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(
    "Two d6 and one d10, sealed. Make markets on SUM and PRODUCT — I answer Buy, Sell, or Hold. One guess only."
  );
  const [captionUrgency, setCaptionUrgency] = useState<
    "calm" | "focused" | "urgent" | "critical"
  >("focused");
  const [log, setLog] = useState<LogLine[]>([
    {
      id: "boot",
      kind: "system",
      text: "Exchange channel open. Waiting for sealed roll…",
    },
  ]);

  const [sumBid, setSumBid] = useState("");
  const [sumAsk, setSumAsk] = useState("");
  const [prodBid, setProdBid] = useState("");
  const [prodAsk, setProdAsk] = useState("");
  const [guessD6a, setGuessD6a] = useState("");
  const [guessD6b, setGuessD6b] = useState("");
  const [guessD10, setGuessD10] = useState("");

  const logEndRef = useRef<HTMLDivElement>(null);
  const lineId = useRef(0);

  const pushLog = useCallback((kind: LogLine["kind"], text: string) => {
    lineId.current += 1;
    setLog((prev) => [
      ...prev,
      { id: `l-${lineId.current}`, kind, text },
    ]);
  }, []);

  const miraSpeak = useCallback(
    (
      text: string,
      urgency: "calm" | "focused" | "urgent" | "critical" = "focused"
    ) => {
      setCaption(text);
      setCaptionUrgency(urgency);
      pushLog("speak", text);
    },
    [pushLog]
  );

  // Start session + tumble dice, then seal (once per mount).
  useEffect(() => {
    const session = startSession();
    setRoll(session);
    setLog((prev) => [
      ...prev,
      { id: "think-roll", kind: "think", text: "Shaking the vault dice…" },
    ]);
    const seal = window.setTimeout(() => {
      setDiceState("sealed");
      setCaption(
        "Roll sealed (2d6 + d10). Quote SUM and PRODUCT. Tight HOLD confirms exact values. One final guess."
      );
      setCaptionUrgency("calm");
      setLog((prev) => [
        ...prev,
        {
          id: "speak-sealed",
          kind: "speak",
          text: "Roll sealed (2d6 + d10). Quote SUM and PRODUCT. Tight HOLD confirms exact values. One final guess.",
        },
        {
          id: "sys-sealed",
          kind: "system",
          text: "Dice sealed. Faces hidden until resolve.",
        },
      ]);
    }, 1800);
    return () => {
      window.clearTimeout(seal);
      endSession();
    };
    // Intentionally once-per-mount — do not re-roll when caption helpers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const goToGuess = useCallback(() => {
    setPhase("guess");
    setError(null);
    miraSpeak(
      "Enough tape. One guess: two d6 (any order) and the d10. Wrong call locks the exchange.",
      "urgent"
    );
  }, [miraSpeak]);

  const advanceRound = useCallback(() => {
    setRound((r) => {
      if (r >= TOTAL_ROUNDS) {
        goToGuess();
        return r;
      }
      return r + 1;
    });
  }, [goToGuess]);

  async function narrateVerdict(
    quantity: Quantity,
    bid: number,
    ask: number,
    response: MarketResponse
  ) {
    pushLog(
      "think",
      `Comparing true ${quantity.toUpperCase()} against your ${bid}@${ask}…`
    );
    await sleep(450);
    if (response === "hold" && bid === ask) {
      pushLog(
        "think",
        `Tight quote held — ${quantity.toUpperCase()} locks at ${bid}.`
      );
    } else if (response === "buy") {
      pushLog("think", "Your ask is under my number. I lift.");
    } else if (response === "sell") {
      pushLog("think", "Your bid is over my number. I hit.");
    } else {
      pushLog("think", "Value sits inside your spread. No trade.");
    }
    await sleep(350);
    miraSpeak(
      `${quantity.toUpperCase()} [${bid}, ${ask}] → ${VERDICT[response]}`,
      response === "hold" ? "calm" : "focused"
    );
  }

  async function submitMarkets() {
    if (busy || diceState === "rolling") return;
    const sB = toInt(sumBid);
    const sA = toInt(sumAsk);
    const pB = toInt(prodBid);
    const pA = toInt(prodAsk);

    if (sB === null || sA === null || pB === null || pA === null) {
      setError("Enter whole-number bid and ask for both markets.");
      return;
    }
    const sumQuote = { bid: sB, ask: sA };
    const prodQuote = { bid: pB, ask: pA };
    if (!isValidQuote(sumQuote) || !isValidQuote(prodQuote)) {
      setError("Each market needs bid ≤ ask.");
      return;
    }

    const session = getSession();
    if (!session) {
      setError("Session missing — reopen the exchange.");
      return;
    }

    setBusy(true);
    setError(null);
    miraSpeak(`Round ${round}. Reading your book…`, "focused");
    pushLog("system", `Round ${round} markets submitted.`);

    const sumResponse = evaluateMarket("sum", sumQuote, session);
    const prodResponse = evaluateMarket("product", prodQuote, session);

    await narrateVerdict("sum", sB, sA, sumResponse);
    await narrateVerdict("product", pB, pA, prodResponse);

    setHistory((h) => [
      ...h,
      { round, quantity: "sum", bid: sB, ask: sA, response: sumResponse },
      {
        round,
        quantity: "product",
        bid: pB,
        ask: pA,
        response: prodResponse,
      },
    ]);
    emit("answer_submit", { puzzleId: PUZZLE.id, kind: "market", round });

    setSumBid("");
    setSumAsk("");
    setProdBid("");
    setProdAsk("");
    setBusy(false);
    advanceRound();
  }

  function submitGuess() {
    if (phase === "lost") return;
    const d6a = toInt(guessD6a);
    const d6b = toInt(guessD6b);
    const d10 = toInt(guessD10);
    if (d6a === null || d6b === null || d10 === null) {
      setGuessError("Enter all three die values.");
      return;
    }
    if (d6a < 1 || d6a > 6 || d6b < 1 || d6b > 6 || d10 < 1 || d10 > 10) {
      setGuessError("Each d6 is 1–6 and the d10 is 1–10.");
      return;
    }

    // One guess only. Correct wins; anything else loses the campaign.
    const guess = { d6a, d6b, d10 };
    emit("answer_submit", { puzzleId: PUZZLE.id, kind: "guess", guess });

    if (validate(PUZZLE.validatorKey, guess)) {
      const revealed = getSession();
      setRoll(revealed);
      setDiceState("revealed");
      completePuzzle(PUZZLE.id);
      emit("puzzle_complete", { puzzleId: PUZZLE.id });
      miraSpeak(
        "Correct. The vault opens — Lower Manhattan is trading again.",
        "calm"
      );
      pushLog("system", "Final guess accepted. Campaign clear.");
      endSession();
      window.setTimeout(() => setStatus("won"), 900);
      return;
    }

    const revealed = getSession();
    setRoll(revealed);
    setDiceState("revealed");
    emit("wrong_attempt", { puzzleId: PUZZLE.id, kind: "guess" });
    setGuessError(null);
    setPhase("lost");
    miraSpeak(
      "Wrong call — the exchange stays locked. You only get one guess.",
      "critical"
    );
    pushLog(
      "system",
      revealed
        ? `Roll was d6=${revealed.d6a} · d6=${revealed.d6b} · d10=${revealed.d10}.`
        : "Guess rejected. Session cleared."
    );
    endSession();
    setStatus("lost");
  }

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col"
      style={{ background: "rgba(6,8,12,0.94)" }}
      data-campaign="new-york-quant"
      role="dialog"
      aria-modal="true"
      aria-label="Lower Manhattan Exchange"
    >
      <header
        className="flex items-center justify-between gap-3 border-b-2 px-4 py-2"
        style={{ borderColor: "var(--edge)", background: "var(--ink)" }}
      >
        <div>
          <p
            className="text-[9px] tracking-[0.22em]"
            style={{ color: "var(--accent)" }}
          >
            NYC FINALE · MARKET MAKER
          </p>
          <h2 className="text-sm font-bold tracking-[0.12em]">
            LOWER MANHATTAN EXCHANGE
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {phase === "markets" && (
            <div
              className="tabular-nums text-sm font-bold tracking-widest"
              style={{ color: "var(--txt)" }}
            >
              R{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}
            </div>
          )}
          <button type="button" className="px-btn px-2 py-1 text-[10px]" onClick={onClose}>
            Close
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: dice + caption + controls */}
        <div className="flex min-h-0 flex-col gap-3 overflow-auto">
          <div
            className="px-border px-scan p-4"
            style={{ background: "var(--ink)" }}
          >
            <SealedDice state={diceState} roll={roll} />
          </div>

          {caption && (
            <div
              className="border-2 px-3 py-2"
              style={{
                borderColor: "var(--edge)",
                background: "rgba(11,14,20,0.96)",
              }}
              role="status"
              aria-live="polite"
            >
              <p className="text-[12px] leading-relaxed">
                <span
                  className="font-bold tracking-[0.15em]"
                  style={{
                    color:
                      captionUrgency === "critical" ||
                      captionUrgency === "urgent"
                        ? "var(--hot)"
                        : "var(--accent)",
                  }}
                >
                  MIRA:{" "}
                </span>
                <span style={{ color: "var(--txt)" }}>{caption}</span>
              </p>
            </div>
          )}

          <div
            className="px-border flex flex-col gap-3 p-4"
            style={{ background: "var(--ink)" }}
          >
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--dim)" }}>
              {PUZZLE.prompt}
            </p>

            {phase === "markets" && (
              <div className="flex flex-col gap-3">
                <MarketInputs
                  label="SUM market (bid @ ask)"
                  bid={sumBid}
                  ask={sumAsk}
                  onBid={setSumBid}
                  onAsk={setSumAsk}
                />
                <MarketInputs
                  label="PRODUCT market (bid @ ask)"
                  bid={prodBid}
                  ask={prodAsk}
                  onBid={setProdBid}
                  onAsk={setProdAsk}
                />
                {error && (
                  <p className="text-[11px]" style={{ color: "var(--hot)" }}>
                    {error}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="px-btn px-4 py-2 text-[10px]"
                    onClick={() => void submitMarkets()}
                    disabled={busy || diceState === "rolling"}
                  >
                    {busy ? "MIRA clearing…" : "Submit markets"}
                  </button>
                  <button
                    type="button"
                    className="px-btn px-4 py-2 text-[10px]"
                    onClick={goToGuess}
                    disabled={busy || history.length === 0}
                  >
                    Lock in dice
                  </button>
                </div>
              </div>
            )}

            {phase === "guess" && (
              <div className="flex flex-col gap-3">
                <p className="text-[11px]" style={{ color: "var(--dim)" }}>
                  Each d6 is 1–6; the d10 is 1–10. Order of the two d6s does not
                  matter. One guess only — wrong loses.
                </p>
                <div className="flex flex-wrap gap-3">
                  <GuessInput label="d6" value={guessD6a} onChange={setGuessD6a} />
                  <GuessInput label="d6" value={guessD6b} onChange={setGuessD6b} />
                  <GuessInput label="d10" value={guessD10} onChange={setGuessD10} />
                </div>
                {guessError && (
                  <p className="text-[11px]" style={{ color: "var(--hot)" }}>
                    {guessError}
                  </p>
                )}
                <button
                  type="button"
                  className="px-btn px-4 py-2 text-[10px]"
                  onClick={submitGuess}
                >
                  Submit final guess
                </button>
              </div>
            )}

            {phase === "lost" && (
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-bold" style={{ color: "var(--hot)" }}>
                  Wrong call — the exchange stays locked.
                </p>
                {roll && (
                  <p className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>
                    The roll was d6={roll.d6a} · d6={roll.d6b} · d10={roll.d10}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: thinking log + tape */}
        <div className="flex min-h-0 flex-col gap-3">
          <div
            className="px-border flex min-h-0 flex-1 flex-col overflow-hidden"
            style={{ background: "var(--ink)" }}
          >
            <div
              className="border-b-2 px-3 py-2 text-[9px] tracking-[0.2em]"
              style={{ borderColor: "var(--edge)", color: "var(--dim)" }}
            >
              MIRA · THINKING / SPEAKING
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
              {log.map((line) => (
                <p
                  key={line.id}
                  className="text-[11px] leading-relaxed"
                  style={{
                    color:
                      line.kind === "speak"
                        ? "var(--accent)"
                        : line.kind === "think"
                          ? "var(--dim)"
                          : "var(--txt)",
                  }}
                >
                  <span className="mr-2 tracking-[0.15em] opacity-70">
                    {line.kind === "speak"
                      ? "SAY"
                      : line.kind === "think"
                        ? "THINK"
                        : "SYS"}
                  </span>
                  {line.text}
                </p>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {history.length > 0 && (
            <div
              className="px-border max-h-40 overflow-auto p-3"
              style={{ background: "var(--ink)" }}
            >
              <p
                className="mb-2 text-[9px] tracking-[0.2em]"
                style={{ color: "var(--dim)" }}
              >
                TAPE
              </p>
              <ul className="space-y-1">
                {history.map((h, i) => (
                  <li key={i} className="text-[11px]" style={{ color: "var(--txt)" }}>
                    <span style={{ color: "var(--dim)" }}>R{h.round}</span>{" "}
                    {h.quantity.toUpperCase()}{" "}
                    {h.response !== "timeout" && (
                      <span style={{ color: "var(--dim)" }}>
                        [{h.bid}, {h.ask}]
                      </span>
                    )}{" "}
                    → {h.response.toUpperCase()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketInputs({
  label,
  bid,
  ask,
  onBid,
  onAsk,
}: {
  label: string;
  bid: string;
  ask: string;
  onBid: (v: string) => void;
  onAsk: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] tracking-[0.15em]" style={{ color: "var(--dim)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <NumberField placeholder="bid" value={bid} onChange={onBid} />
        <span style={{ color: "var(--dim)" }}>@</span>
        <NumberField placeholder="ask" value={ask} onChange={onAsk} />
      </div>
    </div>
  );
}

function NumberField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-28 border-2 px-2 py-1 text-sm outline-none"
      style={{
        borderColor: "var(--edge)",
        background: "var(--panel)",
        color: "var(--accent)",
      }}
    />
  );
}

function GuessInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[9px] tracking-[0.2em]"
        style={{ color: "var(--dim)" }}
      >
        {label.toUpperCase()}
      </span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 border-2 px-2 py-1 text-sm outline-none"
        style={{
          borderColor: "var(--edge)",
          background: "var(--panel)",
          color: "var(--accent)",
        }}
      />
    </label>
  );
}
