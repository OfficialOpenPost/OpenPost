"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => window.location.origin;
const getServerSnapshot = () => "";

export function useOrigin(): string {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
