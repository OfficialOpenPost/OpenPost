"use client";

import { useState } from "react";
import { submitPollVote } from "@/lib/openpost";
import { CheckCircle2, BarChart2, Loader2 } from "lucide-react";

interface PollWidgetProps {
  poll: {
    id: string;
    question: string;
    totalVotes: number;
    options: Array<{ id: string; label: string; votes: number }>;
  };
}

export function PollWidget({ poll }: PollWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState(poll.options);
  const [totalVotes, setTotalVotes] = useState(poll.totalVotes);

  const handleVote = async () => {
    if (!selectedOption || loading || hasVoted) return;

    try {
      setLoading(true);
      setError(null);
      const res = await submitPollVote(poll.id, selectedOption);

      if (!res.success) {
        throw new Error(res.error || "Failed to submit vote");
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
    <div className="my-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-2 text-brand mb-2">
        <BarChart2 className="h-5 w-5 text-brand" />
        <span className="text-xs font-black uppercase tracking-widest text-navy">Interactive Poll</span>
      </div>

      <h3 className="text-lg font-black text-navy mb-6">{poll.question}</h3>

      {error && (
        <p className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-semibold">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {options.map((opt) => {
          const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => !hasVoted && setSelectedOption(opt.id)}
              className={`relative overflow-hidden rounded-2xl border p-4 transition cursor-pointer ${
                hasVoted
                  ? "border-slate-200 bg-white"
                  : isSelected
                  ? "border-brand bg-brand/5 shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-brand/15 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  {!hasVoted && (
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-brand bg-brand" : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  )}
                  <span className="text-sm font-bold text-navy">{opt.label}</span>
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-2 text-xs font-bold text-navy">
                    <span>{percentage}%</span>
                    <span className="text-slate-400 font-normal">({opt.votes})</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">{totalVotes} total votes</span>

        {!hasVoted ? (
          <button
            onClick={handleVote}
            disabled={!selectedOption || loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-5 py-2.5 text-xs font-bold text-white hover:bg-navy-light transition disabled:opacity-50 shadow-xs"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Submit Vote
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Thank you for voting!
          </span>
        )}
      </div>
    </div>
  );
}
