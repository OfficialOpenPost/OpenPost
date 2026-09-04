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
    width?: string;
  };
  description?: string;
  align?: string;
  layout?: string;
  width?: string;
  themeColor?: string;
  color?: string;
}

function getContrastTextColor(hexColor: string): string {
  if (!hexColor) return "#0F172A";
  const cleanHex = hexColor.replace("#", "");
  const fullHex = cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex;
  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return "#0F172A";
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? "#0F172A" : "#FFFFFF";
}

export function PollWidget({
  poll,
  description,
  align,
  layout,
  width,
  themeColor,
  color,
}: PollWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(poll.options);
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes);

  const effectiveDesc = description || poll.description;
  const effectiveLayout = layout || align || "center";
  const activeColor = themeColor || color || (poll as any).themeColor || (poll as any).color || "#FEA611";
  const textColor = getContrastTextColor(activeColor);

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

  let alignCls = "openpost-poll-card w-full my-6 sm:my-8 clear-both mx-auto block max-w-full sm:max-w-2xl";
  if (isLeft) alignCls = "openpost-poll-card w-full float-none sm:float-left mr-0 sm:mr-6 md:mr-7 lg:mr-8 ml-0 mb-4 sm:mb-6 clear-both sm:clear-none inline-block";
  if (isRight) alignCls = "openpost-poll-card w-full float-none sm:float-right ml-0 sm:ml-6 md:ml-7 lg:ml-8 mr-0 mb-4 sm:mb-6 clear-both sm:clear-none inline-block";
  if (isWide) alignCls = "openpost-poll-card w-full my-6 sm:my-8 clear-both block";
  if (isCenter) alignCls = "openpost-poll-card w-full my-6 sm:my-8 clear-both mx-auto block max-w-full sm:max-w-2xl";

  const defaultWidth = isLeft || isRight ? "45%" : "100%";
  const effectiveWidth = width || (poll as any).width || defaultWidth;

  const cardStyle: React.CSSProperties = {
    width: effectiveWidth,
    maxWidth: "100%",
    boxSizing: "border-box",
    border: `2px solid ${activeColor}`,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: activeColor,
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
      data-poll-block="true"
      data-poll-align={effectiveLayout}
      className={`rounded-none bg-white p-6 shadow-xs ${alignCls}`}
      style={cardStyle}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-none font-bold shadow-2xs"
            style={{ backgroundColor: activeColor, color: textColor }}
          >
            <BarChart2 className="h-3.5 w-3.5" style={{ color: textColor }} />
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
            className="inline-flex items-center gap-1.5 rounded-none px-4 py-1.5 text-xs font-bold transition disabled:opacity-50 shadow-xs hover:brightness-95"
            style={{ backgroundColor: activeColor, color: textColor }}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" style={{ color: textColor }} /> : null}
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
