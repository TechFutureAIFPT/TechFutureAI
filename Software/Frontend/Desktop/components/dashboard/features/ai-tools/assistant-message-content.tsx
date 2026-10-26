import { Fragment, type ReactNode } from "react";

const LABELS: Record<string, string> = {
  candidate_name: "Ứng viên",
  candidateName: "Ứng viên",
  criteria: "Tiêu chí đánh giá",
  evidence: "Dẫn chứng trong CV",
  missing: "Thông tin còn thiếu",
  reason: "Nhận xét",
  summary: "Tóm tắt",
  score: "Điểm phù hợp",
  level: "Mức đáp ứng",
  id: "Tiêu chí",
  strengths: "Điểm mạnh",
  weaknesses: "Điểm cần xem xét",
  recommendations: "Đề xuất",
};

function labelFor(key: string): string {
  return LABELS[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function cleanJson(content: string): unknown | null {
  const fenced = content.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = (fenced?.[1] || content).trim();
  if (!candidate.startsWith("{") && !candidate.startsWith("[")) return null;
  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    return null;
  }
}

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return <span className="assistant-empty-value">Chưa có thông tin</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="assistant-empty-value">Chưa có thông tin</span>;
    return <ul className="assistant-value-list">{value.map((item, index) => <li key={index}>{renderValue(item)}</li>)}</ul>;
  }
  if (typeof value === "object") {
    return <dl className="assistant-value-grid">{Object.entries(value as Record<string, unknown>).map(([key, child]) => <div key={key}><dt>{labelFor(key)}</dt><dd>{renderValue(child)}</dd></div>)}</dl>;
  }
  return String(value);
}

function CriteriaCards({ criteria }: { criteria: unknown[] }) {
  return <div className="assistant-criteria-list">{criteria.map((entry, index) => {
    const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : { reason: entry };
    const level = String(item.level ?? "").trim();
    const status = level === "0" ? "Chưa đủ bằng chứng" : level ? `Mức ${level}` : "Cần xem xét";
    return <article className="assistant-criterion" key={String(item.id ?? index)}>
      <div className="assistant-criterion-heading"><strong>{typeof item.id === "string" && item.id ? `Tiêu chí ${item.id}` : `Tiêu chí ${index + 1}`}</strong><span>{status}</span></div>
      {item.reason !== undefined && <div><h4>Nhận xét</h4>{renderValue(item.reason)}</div>}
      {item.evidence !== undefined && <div><h4>Dẫn chứng</h4>{renderValue(item.evidence)}</div>}
      {item.missing !== undefined && <div><h4>Còn thiếu</h4>{renderValue(item.missing)}</div>}
    </article>;
  })}</div>;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function PlainMarkdown({ content }: { content: string }) {
  return <div className="assistant-plain-message space-y-2">
    {content.split("\n").map((rawLine, index) => {
      const line = rawLine.trim();
      if (!line) return null;
      const heading = line.match(/^#{1,3}\s+(.+)$/);
      if (heading) return <h3 key={index} className="font-semibold text-inherit">{renderInlineMarkdown(heading[1])}</h3>;
      const bullet = line.match(/^(?:[-*•])\s+(.+)$/);
      if (bullet) return <div key={index} className="flex gap-2"><span aria-hidden="true">•</span><span>{renderInlineMarkdown(bullet[1])}</span></div>;
      if (/^\d+[.)]\s+/.test(line)) return <p key={index}>{renderInlineMarkdown(line)}</p>;
      return <p key={index}>{renderInlineMarkdown(line)}</p>;
    })}
  </div>;
}

export function AssistantMessageContent({ content }: { content: string }) {
  const parsed = cleanJson(content);
  if (!parsed || typeof parsed !== "object") {
    const trimmed = content.trim();
    if (/^(?:```json\s*)?[\[{]/i.test(trimmed)) {
      return <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">Phản hồi AI chưa đúng định dạng. Hãy gửi lại câu hỏi.</p>;
    }
    return <PlainMarkdown content={content} />;
  }
  const data = (Array.isArray(parsed) ? { criteria: parsed } : parsed) as Record<string, unknown>;
  const criteria = Array.isArray(data.criteria) ? data.criteria : null;
  const topLevel = Object.entries(data).filter(([key]) => !["criteria", "candidate_name", "candidateName"].includes(key));
  return <div className="assistant-structured-message">
    {(typeof data.candidate_name === "string" && data.candidate_name || typeof data.candidateName === "string" && data.candidateName) && <p className="assistant-candidate-name">{String(data.candidate_name || data.candidateName)}</p>}
    {criteria && <><h3>Tiêu chí đánh giá</h3><CriteriaCards criteria={criteria} /></>}
    {topLevel.map(([key, value]) => <section className="assistant-message-field" key={key}><h3>{labelFor(key)}</h3>{renderValue(value)}</section>)}
  </div>;
}
