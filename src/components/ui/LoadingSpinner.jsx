import React from "react";

export default function LoadingSpinner() {
  return (
    <div
      className="
        h-5
        w-5
        border-2
        border-white/30
        border-t-white
        rounded-full
        animate-spin
      "
    />
  );
}