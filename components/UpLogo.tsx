import React from "react";

type UpLogoProps = {
  className?: string;
  compact?: boolean;
};

export default function UpLogo({ className = "", compact = false }: UpLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${compact ? "rounded-full" : "rounded-2xl"} ${className}`}
      aria-hidden="true"
    >
      <img
        src="/LOGO%20UP.png"
        alt=""
        className="h-full w-full select-none object-contain"
        draggable={false}
      />
    </div>
  );
}