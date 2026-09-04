/**
 * OpenPost Polls Library
 * Centralized utility library for fetching polls, submitting votes with anti-fraud protection,
 * calculating percentages, managing localStorage persistence, and server-side data operations.
 */

export interface PollOption {
  id: string;
  label: string;
  sortOrder?: number;
  votes?: number;
  percentage?: number;
}

export interface PollData {
  id: string;
  blogId?: string | null;
  projectId?: string | null;
  question: string;
  description?: string | null;
  type: "single";
  status: "open" | "closed" | "draft";
  totalVotes: number;
  options: PollOption[];
  allowAnonymous?: boolean;
  showResults?: "always" | "after_vote" | "after_close";
  closesAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  recentVotes?: Array<{
    id: string;
    voterPreview: string;
    votedAt: string;
  }>;
}

export interface PollVoteResponse {
  success: boolean;
  data?: {
    id: string;
    pollId: string;
    optionId: string;
  };
  error?: string;
  alreadyVoted?: boolean;
}

// --------------------------------------------------------------------------
// Client-side Utilities & State Management
// --------------------------------------------------------------------------

/**
 * Check if the current browser/user has already voted in this poll
 */
export function hasUserVoted(pollId: string): boolean {
  if (typeof window === "undefined" || !pollId) return false;
  return !!localStorage.getItem(`op_voted_${pollId}`);
}

/**
 * Get the optionId that the current user voted for
 */
export function getUserVotedOption(pollId: string): string | null {
  if (typeof window === "undefined" || !pollId) return null;
  return localStorage.getItem(`op_voted_${pollId}`);
}

/**
 * Record a vote locally in localStorage
 */
export function recordUserVote(pollId: string, optionId: string): void {
  if (typeof window === "undefined" || !pollId) return;
  localStorage.setItem(`op_voted_${pollId}`, optionId);
}

/**
 * Calculate poll option percentages safely with proper rounding
 */
export function calculatePollPercentages(
  options: Array<{ id: string; label: string; votes?: number }>,
  totalVotes: number
): PollOption[] {
  if (!options || options.length === 0) return [];
  const total = totalVotes > 0 ? totalVotes : options.reduce((acc, opt) => acc + (opt.votes || 0), 0);

  return options.map((opt, idx) => {
    const votes = opt.votes || 0;
    const percentage = total > 0 ? Math.round((votes / total) * 100) : 0;
    return {
      id: opt.id || `opt_${idx + 1}`,
      label: opt.label,
      sortOrder: idx,
      votes,
      percentage,
    };
  });
}

/**
 * Fetch live poll details from OpenPost API
 */
export async function fetchPoll(pollId: string, baseUrl = ""): Promise<PollData | null> {
  if (!pollId) return null;

  try {
    const url = `${baseUrl}/api/v1/polls/${pollId}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn(`[OpenPost Polls] Failed to fetch poll ${pollId}:`, err);
    return null;
  }
}

/**
 * Submit a vote to the OpenPost API
 */
export async function submitPollVote(
  pollId: string,
  optionId: string,
  baseUrl = ""
): Promise<PollVoteResponse> {
  if (!pollId || !optionId) {
    return { success: false, error: "Missing pollId or optionId" };
  }

  try {
    const url = `${baseUrl}/api/v1/polls/${pollId}/vote`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const code = json.error?.code;
      const message = json.error?.message || "Failed to record vote";
      return {
        success: false,
        error: message,
        alreadyVoted: code === "ALREADY_VOTED",
      };
    }

    // Save to local storage upon successful vote
    recordUserVote(pollId, optionId);

    return {
      success: true,
      data: json.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error occurred while voting.",
    };
  }
}

/**
 * Check if a poll is currently open and accepting votes
 */
export function isPollActive(poll: { status?: string; closesAt?: string | null }): boolean {
  if (poll.status === "closed" || poll.status === "draft") return false;
  if (poll.closesAt) {
    return new Date(poll.closesAt) > new Date();
  }
  return true;
}

/**
 * Format remaining time until poll closure
 */
export function formatPollCloseTime(closesAt?: string | null): string | null {
  if (!closesAt) return null;
  const closeDate = new Date(closesAt);
  const now = new Date();
  const diffMs = closeDate.getTime() - now.getTime();

  if (diffMs <= 0) return "Poll Closed";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 1) return `Closes in ${diffDays} days`;
  if (diffHours >= 1) return `Closes in ${diffHours} hours`;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `Closes in ${Math.max(1, diffMins)} minutes`;
}
