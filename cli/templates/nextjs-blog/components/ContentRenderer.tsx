"use client";

import React from "react";
import { SharedRender } from "./SharedRender";

interface ContentRendererProps {
  content: any;
  polls?: any[];
}

export function ContentRenderer({ content }: ContentRendererProps) {
  return <SharedRender content={content} />;
}
