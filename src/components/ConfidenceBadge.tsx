import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  label?: string;
}

export function ConfidenceBadge({ score, label }: ConfidenceBadgeProps) {
  // Determine premium color styles based on confidence intensity
  let colorClass = "";
  if (score >= 90) {
    colorClass = "bg-[#CAFFBF] text-black border-2 border-black";
  } else if (score >= 75) {
    colorClass = "bg-[#FFF9A6] text-black border-2 border-black";
  } else {
    colorClass = "bg-[#FFADAD] text-black border-2 border-black";
  }

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-wider transition-all rounded-full ${colorClass}`}
      title={label ? `${label}: ${score}% accuracy` : `Estimated accuracy: ${score}%`}
    >
      {label && <span className="opacity-75 mr-1 font-sans">{label}:</span>}
      {score}% Match
    </span>
  );
}
