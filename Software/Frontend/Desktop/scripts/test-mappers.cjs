const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../lib/mappers.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sandbox = { exports: {} };
vm.runInNewContext(compiled, sandbox);
const { mapCandidate, normalizeScoringWeights, criterionPercentage } = sandbox.exports;

const accented = mapCandidate({ analysis: { "Tổng điểm": 72, "Hạng": "B", "Chi tiết": [{ "Tiêu chí": "Kỹ năng", "Điểm": "20/35", "Dẫn chứng": "FastAPI" }], "Điểm mạnh CV": ["Python"] } });
assert.equal(accented.analysis.total_score, 72);
assert.equal(accented.analysis.rank, "B");
assert.equal(accented.analysis.details[0].evidence, "FastAPI");
assert.equal(accented.analysis.strengths[0], "Python");

const unaccented = mapCandidate({ analysis: { "Tong diem": 68, "Hang": "C" } });
assert.equal(unaccented.analysis.total_score, 68);
assert.equal(unaccented.analysis.rank, "C");

const zero = mapCandidate({ hrSummary: { tong_diem_phu_hop: 0 }, analysis: { "Tong diem": 85 } });
assert.equal(zero.hrSummary.tong_diem_phu_hop, 0);
assert.equal(zero.analysis.total_score, 85);
assert.equal(mapCandidate({ analysis: { "Tổng điểm": 0, "Tong diem": 90 } }).analysis.total_score, 0);
const numeric = normalizeScoringWeights({ job_fit: 20, role_skills: 35, experience: 20, impact: 10, education: 5, soft_skills: 10 });
assert.equal(Object.values(numeric).reduce((sum, item) => sum + item.weight, 0), 100);
assert.equal(numeric.role_skills.name, "Kỹ năng chuyên môn");
const rubric = { name: "Python", children: [{ name: "FastAPI", weight: 100 }] };
assert.equal(normalizeScoringWeights({ skills: rubric }).skills, rubric);
assert.equal(criterionPercentage([{ criterion: "Kỹ năng chuyên môn", score: "26.25/35" }], "Kỹ năng chuyên môn"), 75);
assert.equal(criterionPercentage([{ criterion: "Kỹ năng mềm", score: "0/10" }], "Kỹ năng mềm"), 0);
assert.equal(criterionPercentage([{ criterion: "Kinh nghiệm", score: "0/0" }], "Kinh nghiệm"), 0);
console.log("Mapper regression checks passed: accented/unaccented contracts and explicit zero scores.");
