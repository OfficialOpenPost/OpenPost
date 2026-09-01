"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";

interface SchedulePickerProps {
  scheduledAt: string | null;
  onChange: (iso: string | null) => void;
  onSchedule: () => void;
  onCancel: () => void;
}

export function SchedulePicker({ scheduledAt, onChange, onSchedule, onCancel }: SchedulePickerProps) {
  const [date, setDate] = useState(scheduledAt ? scheduledAt.slice(0, 10) : "");
  const [time, setTime] = useState(scheduledAt ? scheduledAt.slice(11, 16) : "09:00");

  const isValid = date && time && new Date(`${date}T${time}`) > new Date();

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="text-sm font-bold text-navy flex items-center gap-2">
        <Calendar className="h-4 w-4 text-brand" /> Schedule Publish
      </h3>
      <p className="mt-1 text-xs text-text-tertiary">Background job publishes automatically at set time (respects your timezone).</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-text-primary">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-primary">Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full rounded-xl border border-border pl-10 pr-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
          </div>
        </div>
      </div>

      {scheduledAt && (
        <p className="mt-3 text-xs text-brand">
          Scheduled for: <span className="font-mono">{new Date(scheduledAt).toLocaleString()}</span>
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          disabled={!isValid}
          onClick={() => {
            const iso = `${date}T${time}:00`;
            onChange(iso);
            onSchedule();
          }}
          className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-navy hover:bg-brand-hover disabled:opacity-40 transition"
        >
          Schedule
        </button>
        <button onClick={onCancel} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-raised">
          Cancel
        </button>
      </div>
    </div>
  );
}
