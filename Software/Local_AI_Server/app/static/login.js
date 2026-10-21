const config = JSON.parse(document.getElementById("admin-config").textContent);
const errorBox = document.getElementById("login-error");
const status = document.getElementById("login-status");
const button = document.getElementById("google-login");

function showError(message) {
  errorBox.textContent = message || "Đăng nhập không thành công. Vui lòng thử lại.";
  errorBox.hidden = false;
  status.textContent = "";
}

async function startLogin() {
  const response = await fetch("/api/admin/google/start", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": config.csrf },
    body: JSON.stringify({ origin: window.location.origin }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || result.detail || "Không thể bắt đầu đăng nhập Google.");
  return result.data.authUrl;
}

function waitForLogin(popup) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      window.removeEventListener("message", receive);
      clearInterval(poll);
      clearTimeout(timeout);
    };
    const finish = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      error ? reject(error) : resolve();
    };
    const receive = (event) => {
      if (event.origin !== window.location.origin || event.source !== popup || event.data?.type !== "aimatch-admin-auth") return;
      finish(event.data.ok ? null : new Error("Google không xác thực được tài khoản quản trị."));
    };
    const poll = setInterval(() => {
      if (popup.closed) finish(new Error("Cửa sổ đăng nhập đã đóng trước khi hoàn tất."));
    }, 400);
    const timeout = setTimeout(() => {
      popup.close();
      finish(new Error("Đăng nhập Google đã hết thời gian chờ."));
    }, 180000);
    window.addEventListener("message", receive);
  });
}

button.addEventListener("click", async () => {
  button.disabled = true;
  errorBox.hidden = true;
  status.textContent = "Đang mở đăng nhập Google…";
  const popup = window.open("about:blank", "aimatch-admin-google", "popup,width=540,height=740");
  if (!popup) {
    showError("Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép cửa sổ bật lên.");
    button.disabled = false;
    return;
  }
  try {
    popup.location.replace(await startLogin());
    await waitForLogin(popup);
    const response = await fetch("/api/admin/session", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Phiên quản trị chưa được tạo. Vui lòng thử lại.");
    window.location.replace("/dashboard");
  } catch (error) {
    popup.close();
    showError(error.message);
    button.disabled = false;
  }
});
