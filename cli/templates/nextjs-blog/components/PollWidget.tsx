"use client";

import { useState, useEffect } from "react";
import { submitPollVote } from "@/lib/openpost";
import { CheckCircle2, BarChart2, Loader2, ShieldCheck } from "lucide-react";

interface PollWidgetProps {
  poll: {
    id: string;
    question: string;
    description?: string;
    totalVotes: number;
    options: Array<{ id: string; label: string; votes: number }>;
  };
  description?: string;
  align?: string;
  layout?: string;
  width?: string;
  themeColor?: string;
  color?: string;
}

export function PollWidget({
  poll,
  description,
  align,
  layout,
  width,
}: PollWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(poll.options);
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes);

  const effectiveDesc = description || poll.description;
  const effectiveLayout = layout || align || "center";
  const activeColor = "#FEA611";

  // Check if voter previously voted
  useEffect(() => {
    if (typeof window !== "undefined" && poll?.id) {
      const saved = localStorage.getItem(`op_voted_${poll.id}`);
      if (saved) {
        setHasVoted(true);
        setSelectedOption(saved);
      }
    }
  }, [poll?.id]);

  const isLeft = effectiveLayout === "left";
  const isRight = effectiveLayout === "right";
  const isWide = effectiveLayout === "wide";
  const isCenter = !isLeft && !isRight && !isWide;

  let alignCls = "block my-8 clear-both mx-auto";
  if (isLeft) alignCls = "float-none sm:float-left mr-0 sm:mr-8 mb-4 clear-none inline-block";
  if (isRight) alignCls = "float-none sm:float-right ml-0 sm:ml-8 mb-4 clear-none inline-block";
  if (isWide) alignCls = "block w-full my-8 clear-both";
  if (isCenter) alignCls = "block my-8 clear-both mx-auto";

  const cardStyle: React.CSSProperties = {
    width: (isLeft || isRight)
      ? (width === "100%" || !width ? "48%" : width)
      : isWide
      ? "100%"
      : width || "100%",
    maxWidth: "100%",
    border: "2px solid #FEA611",
  };

  const handleVote = async () => {
    if (!selectedOption || loading || hasVoted) return;

    try {
      setLoading(true);
      setError(null);
      const res = await submitPollVote(poll.id, selectedOption);

      if (!res.success) {
        throw new Error(res.error || "Failed to submit vote");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(`op_voted_${poll.id}`, selectedOption);
      }

      setOptions((prev) =>
        prev.map((opt) =>
          opt.id === selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
        )
      );
      setTotalVotes((prev) => prev + 1);
      setHasVoted(true);
    } catch (err: any) {
      setError(err.message || "Could not record vote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-none bg-white p-6 shadow-xs ${alignCls}`}
      style={cardStyle}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-none text-navy font-bold shadow-2xs"
            style={{ backgroundColor: activeColor }}
          >
            <BarChart2 className="h-3.5 w-3.5 text-navy" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-navy">Interactive Poll</span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-none px-2 py-0.5">
          <ShieldCheck className="h-3 w-3 text-emerald-600" /> Fraud Protected
        </span>
      </div>

      <h3 className="text-sm sm:text-base font-bold text-navy leading-snug tracking-tight mb-2">
        {poll.question}
      </h3>

      {effectiveDesc && (
        <p className="text-xs text-slate-600 font-normal leading-relaxed mb-3.5 bg-slate-50 border border-slate-200/60 rounded-none p-3">
          {effectiveDesc}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-none bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
          {error}
        </p>
      )}

      <div className="space-y-2.5 my-3">
        {options.map((opt) => {
          const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => !hasVoted && setSelectedOption(opt.id)}
              className={`relative overflow-hidden rounded-none border px-3.5 py-2.5 transition cursor-pointer ${
                hasVoted
                  ? "border-slate-200 bg-white"
                  : isSelected
                  ? "border-slate-400 bg-white shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 opacity-20"
                  style={{ width: `${percentage}%`, backgroundColor: activeColor }}
                />
              )}

              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {!hasVoted && (
                    <div
                      className="h-3.5 w-3.5 border flex items-center justify-center border-slate-300 bg-white rounded-none"
                    >
                      {isSelected && (
                        <div
                          className="h-1.5 w-1.5 rounded-none"
                          style={{ backgroundColor: activeColor }}
                        />
                      )}
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-navy">{opt.label}</span>
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-2 text-xs font-bold text-navy">
                    <span>{percentage}%</span>
                    <span className="text-slate-400 font-mono text-[11px]">({opt.votes})</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
        <span className="text-slate-500 font-medium">{totalVotes} total votes</span>

        {!hasVoted ? (
          <button
            type="button"
            onClick={handleVote}
            disabled={!selectedOption || loading}
            className="inline-flex items-center gap-1.5 rounded-none px-4 py-1.5 text-xs font-bold text-navy transition disabled:opacity-50 shadow-xs hover:brightness-95"
            style={{ backgroundColor: activeColor }}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Submit Vote
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Thank you for voting!
          </span>
        )}
      </div>
    </div>
  );
}
