export type ComparisonCell = {
  status: "positive" | "negative" | "neutral" | "highlight";
  text: string;
};

export type ComparisonRow = {
  icon: string;
  label: string;
  chatgpt: ComparisonCell;
  support: ComparisonCell;
  emphasis?: boolean;
};
