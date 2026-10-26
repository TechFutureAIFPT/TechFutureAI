const config = JSON.parse(document.getElementById("admin-config").textContent);
const $ = (id) => document.getElementById(id);
const number = (value) => new Intl.NumberFormat("vi-VN").format(value || 0);
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (letter) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[letter]));
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const isSystemTable = (table) => table.category === "Local Engine & Cache";
const viewNames = {
  overview: ["Tổng quan", "Tổng quan dữ liệu", "Theo dõi kết nối, dữ liệu và tình trạng hoạt động của hệ thống."],
  data: ["Trình duyệt dữ liệu", "Trình duyệt dữ liệu", "Khám phá bản ghi, tìm kiếm và đối chiếu cấu trúc từng bảng."],
  checks: ["Kiểm tra hệ thống", "Kiểm tra hệ thống", "Xác nhận tình trạng Ollama và tính toàn vẹn của SQLite local."],
  ai: ["Kiểm thử AI", "Kiểm thử AI local", "Đánh giá phản hồi của model trong không gian quản trị."],
  "ai-routing": ["Model & API", "Điều phối model & API", "Chọn provider cho AI và theo dõi trạng thái các dịch vụ trên máy này."],
};
let tables = [];
let stats = null;
let selected = "";
let currentRows = [];
let currentSchema = null;
let record = null;
let offset = 0;
let total = 0;
let tab = "rows";
let dataController = null;
let searchTimer;
let toastTimer;
let refreshing = false;
let aiRuntime = null;

$("admin-email").textContent = config.profile?.email || "Quản trị viên";


function notify(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => { $("toast").hidden = true; }, 4000);
}

async function api(path, { method = "GET", body, signal, timeout = 30000 } = {}) {
  const response = await fetch(path, {
    method, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": config.csrf },
    body: body ? JSON.stringify(body) : undefined,
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeout)]) : AbortSignal.timeout(timeout),
  });
  let result;
  try { result = await response.json(); } catch { throw new Error("Máy chủ trả về dữ liệu không hợp lệ."); }
  if (response.status === 401 || response.status === 403) {
    window.location.replace("/admin/login");
    throw new Error("Phiên quản trị đã hết hạn hoặc không còn quyền truy cập.");
  }
  if (!response.ok) throw new Error(result.error?.message || (typeof result.detail === "string" ? result.detail : "Không thể xử lý yêu cầu. Vui lòng thử lại."));
  return result.success === true && "data" in result ? result.data : result;
}

function showView(name, updateHash = true) {
  if (!Object.hasOwn(viewNames, name)) name = "overview";
  document.querySelectorAll(".view").forEach((view) => { view.hidden = view.id !== `view-${name}`; });
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === name);
    if (item.dataset.view === name) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
  $("breadcrumb-title").textContent = viewNames[name][0];
  $("page-title").textContent = viewNames[name][1];
  $("page-description").textContent = viewNames[name][2];
  $("view-switcher").value = name;
  document.title = `${viewNames[name][0]} · AI Match Admin`;
  $("sidebar").classList.remove("open");
  $("menu-toggle").setAttribute("aria-expanded", "false");
  if (updateHash && location.hash !== `#${name}`) history.pushState(null, "", `#${name}`);
  if (name === "data" && !selected && tables.length) selectTable(tables.some((item) => item.name === "users") ? "users" : tables[0].name);
  if (name === "ai-routing") loadAiRuntime();
}
document.querySelectorAll("[data-view], [data-open]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view || button.dataset.open)));

function renderAiRuntime(runtime) {
  aiRuntime = runtime;
  const local = runtime.provider === "ollama";
  const badge = $("runtime-provider-badge");
  badge.className = `badge ${local ? "success" : "neutral"}`;
  badge.textContent = local ? "Ollama local đang chạy" : "Gemini API đang chạy";
  $("runtime-summary").textContent = local
    ? `Backend dùng CV Match ${runtime.ollama.cvModel} để chấm CV; ${runtime.ollama.generalModel} xử lý tác vụ AI chung.`
    : `Backend dùng ${runtime.gemini.model} cho phân tích CV và ${runtime.gemini.generalModel} cho tác vụ AI chung.`;
  $("activate-local").disabled = local || !runtime.ollama.cvModelAvailable;
  $("activate-local").textContent = local ? "Model local đang hoạt động" : (runtime.ollama.cvModelAvailable ? "Bật model local" : "Thiếu model CV local");
  $("activate-gemini").disabled = !runtime.gemini.configured || !local;
  $("gemini-key-status").className = `badge ${runtime.gemini.configured ? "success" : "warning"}`;
  $("gemini-key-status").textContent = runtime.gemini.configured ? "Đã có API key" : "Chưa có API key";
  if (!$("gemini-model").value) $("gemini-model").value = runtime.gemini.model || "";
  const rows = [
    ["CV Match local", runtime.ollama.cvModel, runtime.ollama.cvModelAvailable, runtime.ollama.cvModelLoaded ? "Đang nạp" : "Đã cài"],
    ["Qwen tác vụ chung", runtime.ollama.generalModel, runtime.ollama.generalModelAvailable, "Ollama"],
    ["Nomic embedding", runtime.ollama.embeddingModel, runtime.ollama.embeddingModelAvailable, "Vector local"],
    ["Gemini", runtime.gemini.model, runtime.gemini.configured, runtime.gemini.active ? "Đang hoạt động" : "Sẵn sàng"],
    ["Classifier CV", runtime.classifier.version, runtime.classifier.ready, `${runtime.classifier.labels} nhãn`],
    ["Cơ sở dữ liệu", runtime.data.provider, runtime.data.provider === "sqlite", "Local SQLite"],
  ];
  $("runtime-cards").innerHTML = rows.map(([label, detail, ready, state]) => `<article class="panel runtime-card"><div><span class="runtime-dot ${ready ? "ready" : "offline"}"></span><strong>${escape(label)}</strong></div><p>${escape(detail || "Chưa cấu hình")}</p><small>${escape(state)}</small></article>`).join("");
}

async function loadAiRuntime() {
  const message = $("runtime-message");
  try {
    const runtime = await api("/api/admin/ai-runtime", { timeout: 10000 });
    renderAiRuntime(runtime);
    message.textContent = "";
  } catch (error) {
    message.textContent = error.message || "Không đọc được trạng thái backend local.";
  }
}

async function changeAiProvider(provider) {
  const buttons = [$("activate-local"), $("activate-gemini"), $("runtime-refresh")];
  buttons.forEach((button) => { button.disabled = true; });
  $("runtime-message").textContent = provider === "ollama" ? "Đang khởi động Ollama và nạp model CV Match…" : "Đang kiểm tra Gemini API…";
  try {
    const runtime = await api("/api/admin/ai-runtime/provider", { method: "PUT", body: { provider }, timeout: 300000 });
    renderAiRuntime(runtime);
    $("runtime-message").textContent = provider === "ollama" ? "Model local đã sẵn sàng và đang xử lý yêu cầu mới." : "Gemini đã được kiểm tra và đang xử lý yêu cầu mới.";
    notify($("runtime-message").textContent);
  } catch (error) {
    const failure = error.message || "Không đổi được provider.";
    await loadAiRuntime();
    $("runtime-message").textContent = failure;
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
    if (aiRuntime) renderAiRuntime(aiRuntime);
  }
}

$("activate-local").addEventListener("click", () => changeAiProvider("ollama"));
$("activate-gemini").addEventListener("click", () => changeAiProvider("gemini"));
$("runtime-refresh").addEventListener("click", loadAiRuntime);
$("gemini-config-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("gemini-save");
  button.disabled = true;
  const body = {};
  if ($("gemini-api-key").value.trim()) body.api_key = $("gemini-api-key").value.trim();
  if ($("gemini-model").value.trim()) body.model = $("gemini-model").value.trim();
  try {
    const runtime = await api("/api/admin/ai-runtime/gemini", { method: "PUT", body });
    $("gemini-api-key").value = "";
    renderAiRuntime(runtime);
    $("runtime-message").textContent = "Cấu hình Gemini đã lưu trên máy này. Hãy chọn Chuyển sang Gemini để kiểm tra kết nối và kích hoạt.";
    notify("Đã lưu cấu hình Gemini local.");
  } catch (error) {
    $("runtime-message").textContent = error.message || "Không lưu được cấu hình Gemini.";
  } finally {
    button.disabled = false;
  }
});

$("view-switcher").addEventListener("change", (event) => showView(event.target.value));
window.addEventListener("hashchange", () => showView(location.hash.slice(1), false));
$("menu-toggle").addEventListener("click", () => {
  const opened = $("sidebar").classList.toggle("open");
  $("menu-toggle").setAttribute("aria-expanded", String(opened));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { $("sidebar").classList.remove("open"); $("menu-toggle").setAttribute("aria-expanded", "false"); }
});

function updateOverview() {
  const rowCount = tables.reduce((sum, item) => sum + item.row_count, 0);
  const metrics = [
    ["Tổng số bản ghi", number(rowCount), "Trong các bảng dữ liệu local", "db"],
    ["Bảng dữ liệu", number(tables.length), `${tables.filter((item) => !isSystemTable(item)).length} nghiệp vụ · ${tables.filter(isSystemTable).length} hệ thống`, "table"],
    ["Dung lượng SQLite", `${(stats.db_file_size_bytes / 1024 / 1024).toFixed(1)} MB`, "Dung lượng tệp cơ sở dữ liệu", "grid"],
    ["Vector & hồ sơ mẫu", number(stats.vector_count), "Dữ liệu phục vụ tìm kiếm ngữ nghĩa", "spark"],
  ];
  $("metrics").innerHTML = metrics.map(([label, value, detail, glyph]) => `<article class="metric"><div class="metric-top"><span>${escape(label)}</span>${icon(glyph)}</div><strong>${escape(value)}</strong><small>${escape(detail)}</small></article>`).join("");
  $("sqlite-status").className = "badge success";
  $("sqlite-status").textContent = "Đã kết nối";
  $("sqlite-summary").textContent = `${tables.length} bảng · WAL mode`;
  $("nav-table-count").textContent = String(tables.length);
  $("table-count").textContent = String(tables.length);
  $("last-updated").textContent = `Cập nhật lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  const topTables = [...tables].sort((a, b) => b.row_count - a.row_count).slice(0, 6);
  $("table-overview").innerHTML = topTables.map((table) => `<tr><td><button class="table-name-button" data-select="${escape(table.name)}">${escape(table.name)}</button></td><td><span class="badge ${isSystemTable(table) ? "neutral" : "success"}">${isSystemTable(table) ? "Hệ thống" : "Nghiệp vụ"}</span></td><td>${table.column_count}</td><td class="numeric">${number(table.row_count)}</td><td><button class="text-button" data-select="${escape(table.name)}" aria-label="Mở bảng ${escape(table.name)}">→</button></td></tr>`).join("") || '<tr><td colspan="5" class="empty">Chưa có bảng dữ liệu.</td></tr>';
  $("table-overview").querySelectorAll("[data-select]").forEach((button) => button.addEventListener("click", () => { showView("data"); selectTable(button.dataset.select); }));
  renderTableList();
}

function renderTableList() {
  const query = $("table-search").value.trim().toLowerCase();
  const filter = $("source-filter").value;
  const filtered = tables.filter((table) => table.name.toLowerCase().includes(query) && (filter === "all" || (filter === "system" ? isSystemTable(table) : !isSystemTable(table))));
  const content = filtered.map((table) => `<button class="table-item ${table.name === selected ? "active" : ""}" data-name="${escape(table.name)}" title="${escape(table.description)}" aria-pressed="${table.name === selected}">${icon("table")}<span>${escape(table.name)}</span><small>${number(table.row_count)}</small></button>`).join("");
  $("table-list").innerHTML = content || '<p class="empty">Không tìm thấy bảng phù hợp.</p>';
  $("table-list").querySelectorAll("[data-name]").forEach((button) => button.addEventListener("click", () => selectTable(button.dataset.name)));
}
$("table-search").addEventListener("input", renderTableList);
$("source-filter").addEventListener("change", renderTableList);

async function refresh() {
  if (refreshing) return;
  refreshing = true;
  $("refresh").disabled = true;
  $("loading").hidden = false;
  $("global-error").hidden = true;
  try {
    const result = await Promise.all([api("/api/database/stats"), api("/api/database/tables")]);
    stats = result[0];
    tables = result[1].tables;
    updateOverview();
    if (selected) await loadTable();
    else if (location.hash === "#data") showView("data");
  } catch (error) {
    $("global-error").textContent = error.message || "Không thể tải dữ liệu hệ thống.";
    $("global-error").hidden = false;
    $("sqlite-status").className = "badge danger";
    $("sqlite-status").textContent = "Chưa kết nối";
  } finally {
    refreshing = false;
    $("refresh").disabled = false;
    $("loading").hidden = true;
  }
  api("/health", { timeout: 10000 }).then((health) => {
    const ready = health.local_ai?.llm_ready && health.local_ai?.cv_model_ready && health.local_ai?.ollama_online;
    $("ai-status").className = `badge ${ready ? "success" : "warning"}`;
    $("ai-status").textContent = ready ? "Model sẵn sàng" : "Cần kiểm tra model";
  }).catch(() => { $("ai-status").textContent = "Không lấy được trạng thái"; });
}
$("refresh").addEventListener("click", refresh);

function selectTable(name) {
  if (!tables.some((table) => table.name === name)) return;
  selected = name;
  offset = 0;
  total = 0;
  currentRows = [];
  currentSchema = null;
  $("row-search").value = "";
  $("selected-table").textContent = name;
  $("table-description").textContent = tables.find((table) => table.name === name).description;
  renderTableList();
  loadTable();
}

async function loadTable() {
  if (!selected) return;
  dataController?.abort();
  const controller = new AbortController();
  dataController = controller;
  const name = selected;
  $("data-error").hidden = true;
  $("export").disabled = true;
  $("previous").disabled = true;
  $("next").disabled = true;
  $("data-grid").setAttribute("aria-busy", "true");
  try {
    if (tab === "schema") {
      $("schema-panel").innerHTML = '<p class="empty">Đang tải cấu trúc…</p>';
      const schema = await api(`/api/database/tables/${encodeURIComponent(name)}/schema`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      currentSchema = schema;
      $("schema-panel").innerHTML = `<div class="section-heading"><h2>${schema.columns.length} trường dữ liệu</h2><span class="badge neutral">${schema.indexes.length} chỉ mục</span></div><div class="table-scroll"><table class="summary-table"><thead><tr><th>Trường</th><th>Kiểu dữ liệu</th><th>Ràng buộc</th></tr></thead><tbody>${schema.columns.map((column) => `<tr><td>${escape(column.name)}</td><td>${escape(column.type || "ANY")}</td><td>${column.pk ? "PRIMARY KEY" : column.notnull ? "NOT NULL" : "NULLABLE"}</td></tr>`).join("")}</tbody></table></div><pre>${escape(schema.create_sql)}</pre>`;
    } else {
      $("data-grid").innerHTML = '<p class="empty">Đang tải bản ghi…</p>';
      const query = new URLSearchParams({ limit: $("page-size").value, offset: String(offset), search: $("row-search").value.trim() });
      const result = await api(`/api/database/tables/${encodeURIComponent(name)}/rows?${query}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      currentRows = result.rows;
      total = result.total_rows;
      const headings = result.columns.map((column) => `<th>${column.pk ? "⌑ " : ""}${escape(column.name)}<small>${escape(column.type || "ANY")}</small></th>`).join("");
      const rows = currentRows.map((row, index) => `<tr data-row="${index}" tabindex="0" aria-label="Xem bản ghi ${index + 1}">${result.columns.map((column) => {
        const value = row[column.name];
        const text = value === null ? "NULL" : typeof value === "object" ? JSON.stringify(value) : String(value);
        return `<td class="${value === null ? "cell-null" : ""}" title="${escape(text.slice(0, 300))}">${escape(text.slice(0, 160))}</td>`;
      }).join("")}</tr>`).join("");
      $("data-grid").innerHTML = currentRows.length ? `<table><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table>` : '<p class="empty">Không có bản ghi phù hợp.<br>Thử điều chỉnh từ khóa hoặc chọn bảng khác.</p>';
      $("data-grid").querySelectorAll("[data-row]").forEach((row) => {
        row.addEventListener("click", () => openRecord(Number(row.dataset.row)));
        row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openRecord(Number(row.dataset.row)); } });
      });
      $("row-summary").textContent = total ? `${number(offset + 1)}–${number(offset + currentRows.length)} / ${number(total)} bản ghi` : "0 bản ghi";
      $("previous").disabled = offset === 0;
      $("next").disabled = offset + currentRows.length >= total;
      $("export").disabled = currentRows.length === 0;
    }
  } catch (error) {
    if (controller.signal.aborted) return;
    $("data-error").textContent = error.message || "Không thể tải bảng dữ liệu.";
    $("data-error").hidden = false;
    $("data-grid").innerHTML = '<p class="empty">Chưa tải được dữ liệu. Nhấn Làm mới để thử lại.</p>';
    $("schema-panel").textContent = "Chưa tải được cấu trúc.";
  } finally {
    if (!controller.signal.aborted) $("data-grid").setAttribute("aria-busy", "false");
  }
}
document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => {
  tab = button.dataset.tab;
  document.querySelectorAll("[data-tab]").forEach((item) => { item.classList.toggle("active", item === button); item.setAttribute("aria-selected", String(item === button)); });
  $("rows-panel").hidden = tab !== "rows";
  $("schema-panel").hidden = tab !== "schema";
  loadTable();
}));
$("row-search").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { offset = 0; loadTable(); }, 300); });
$("page-size").addEventListener("change", () => { offset = 0; loadTable(); });
$("previous").addEventListener("click", () => { offset = Math.max(0, offset - Number($("page-size").value)); loadTable(); });
$("next").addEventListener("click", () => { if (offset + currentRows.length < total) { offset += Number($("page-size").value); loadTable(); } });

function openRecord(index) {
  record = currentRows[index];
  $("record-meta").textContent = `${selected} · Bản ghi ${offset + index + 1}`;
  $("record-json").textContent = JSON.stringify(record, null, 2);
  $("record-dialog").showModal();
}
$("close-record").addEventListener("click", () => $("record-dialog").close());
$("copy-record").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(JSON.stringify(record, null, 2)); notify("Đã sao chép bản ghi."); }
  catch { notify("Trình duyệt không cho phép sao chép. Bạn có thể chọn nội dung JSON để sao chép thủ công."); }
});
$("export").addEventListener("click", () => {
  if (!currentRows.length) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ table: selected, offset, rows: currentRows }, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = `${selected}-page-${Math.floor(offset / Number($("page-size").value)) + 1}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$("run-checks").addEventListener("click", async () => {
  const button = $("run-checks"); button.disabled = true; button.textContent = "Đang kiểm tra…";
  try {
    const result = await api("/api/database/checks", { method: "POST", timeout: 45000 });
    $("check-results").innerHTML = result.checks.map((check) => `<article class="check-row">${icon(check.id === "ollama" ? "spark" : "db")}<div><h3>${escape(check.name)}</h3><p>${escape(check.message)}</p></div><small>${number(check.latency_ms)} ms</small><span class="badge ${check.status === "passed" ? "success" : "danger"}">${check.status === "passed" ? "Đạt" : "Cần kiểm tra"}</span></article>`).join("") + `<p class="check-timestamp">Kiểm tra lúc ${escape(new Date(result.checked_at).toLocaleString("vi-VN"))} · Chỉ đọc dữ liệu</p>`;
    for (const check of result.checks) {
      const badge = $(`${check.id}-status`);
      if (badge) { badge.className = `badge ${check.status === "passed" ? "success" : "danger"}`; badge.textContent = check.status === "passed" ? "Đã kết nối" : "Cần kiểm tra"; }
    }
  } catch (error) { $("check-results").textContent = error.message; }
  finally { button.disabled = false; button.textContent = "Chạy kiểm tra"; }
});

$("ai-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = $("ai-prompt").value.trim(); if (!prompt) return;
  $("ai-submit").disabled = true; $("ai-result").textContent = "Model đang xử lý yêu cầu…";
  try { const result = await api("/api/ai/test", { method: "POST", body: { prompt }, timeout: 300000 }); $("ai-result").textContent = result.response || "Model chưa trả về nội dung."; }
  catch (error) { $("ai-result").textContent = error.message; }
  finally { $("ai-submit").disabled = false; }
});
$("logout").addEventListener("click", async () => {
  $("logout").disabled = true;
  try { await api("/api/admin/session", { method: "DELETE" }); window.location.replace("/admin/login"); }
  catch (error) { notify(error.message); $("logout").disabled = false; }
});
showView(location.hash.slice(1) || "overview", false);
refresh();
