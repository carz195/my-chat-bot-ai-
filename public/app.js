// ============================================================
// CHAT FRONTEND
// ============================================================
// Sends each user message + the running history to /api/chat,
// reads the streamed Server-Sent Events response, and types
// the AI reply into the page chunk-by-chunk.
//
// You usually don't need to change this file. The look-and-feel
// lives in styles.css; the AI's personality lives in api/chat.js.
// ============================================================

const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("composer");
const inputEl = document.getElementById("composer-input");
const sendBtn = document.getElementById("composer-send");

// galaxy canvas setup
const matrixCanvas = document.getElementById("matrix-canvas");
let mCtx, mWidth, mHeight, stars = [], matrixAnimationId;
function initGalaxy() {
  if (!matrixCanvas) return;
  mCtx = matrixCanvas.getContext("2d");
  const STAR_SPEED = 1.2; // increase to make stars move faster
  function resize() {
    mWidth = matrixCanvas.width = window.innerWidth;
    mHeight = matrixCanvas.height = window.innerHeight;
    const starCount = Math.max(120, Math.floor((mWidth * mHeight) / 4000));
    stars = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * mWidth,
        y: Math.random() * mHeight,
        r: Math.random() * 1.6 + 0.2,
        alpha: Math.random() * 0.9 + 0.1,
        vx: (Math.random() - 0.5) * 0.4 * STAR_SPEED,
        vy: (Math.random() - 0.5) * 0.4 * STAR_SPEED,
      });
    }
  }
  resize();
  window.addEventListener("resize", resize);

  let nebulaOffset = 0;
  function draw() {
    // deep gradient background
    const bg = mCtx.createLinearGradient(0, 0, 0, mHeight);
    bg.addColorStop(0, "#02061a");
    bg.addColorStop(1, "#071029");
    mCtx.fillStyle = bg;
    mCtx.fillRect(0, 0, mWidth, mHeight);

    // moving nebula layers
    nebulaOffset += 0.15;
    for (let i = 0; i < 3; i++) {
      const nx = (Math.sin((nebulaOffset + i * 100) / 150) + 1) * (mWidth / 2);
      const ny = (Math.cos((nebulaOffset + i * 120) / 160) + 1) * (mHeight / 2);
      const rad = Math.max(mWidth, mHeight) * 0.8;
      const grad = mCtx.createRadialGradient(nx, ny, 0, nx, ny, rad);
      if (i === 0) grad.addColorStop(0, "rgba(102,160,255,0.14)");
      if (i === 1) grad.addColorStop(0, "rgba(80,120,200,0.08)");
      if (i === 2) grad.addColorStop(0, "rgba(0,200,255,0.06)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      mCtx.fillStyle = grad;
      mCtx.fillRect(0, 0, mWidth, mHeight);
    }

    // stars
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < -10) s.x = mWidth + 10;
      if (s.x > mWidth + 10) s.x = -10;
      if (s.y < -10) s.y = mHeight + 10;
      if (s.y > mHeight + 10) s.y = -10;
      const flick = 0.6 + 0.4 * Math.sin((s.x + s.y + Date.now() * 0.003) / (30 + s.r * 10));
      mCtx.beginPath();
      mCtx.fillStyle = `rgba(220,240,255,${s.alpha * flick})`;
      mCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      mCtx.fill();
    }

    matrixAnimationId = requestAnimationFrame(draw);
  }
  cancelAnimationFrame(matrixAnimationId);
  draw();
}
initGalaxy();

// Running conversation history. Each entry: { role, text }.
const history = [];

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  setBusy(true);

  appendMessage("user", text);
  history.push({ role: "user", text });

  // small send beep
  try { playBeep(); } catch {}

  const aiBubble = appendMessage("assistant", "", { streaming: true });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => "");
      throw new Error(errText || `Request failed (${response.status})`);
    }

    let assistantText = "";
    for await (const event of readSseStream(response.body)) {
      if (event === "[DONE]") break;
      let payload;
      try {
        payload = JSON.parse(event);
      } catch {
        continue;
      }
      if (payload.error) throw new Error(payload.error);
      if (payload.text) {
        assistantText += payload.text;
        aiBubble.textContent = assistantText;
        scrollToBottom();
      }
    }

    history.push({ role: "assistant", text: assistantText });
  } catch (err) {
    aiBubble.textContent = `⚠️ ${err.message}`;
  } finally {
    aiBubble.parentElement.classList.remove("is-streaming");
    setBusy(false);
    inputEl.focus();
  }
});

function setBusy(busy) {
  inputEl.disabled = busy;
  sendBtn.disabled = busy;
  sendBtn.textContent = busy ? "..." : "Send";
}

function appendMessage(role, text, { streaming = false } = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = `message message-${role === "assistant" ? "ai" : "user"}`;
  if (streaming) wrapper.classList.add("is-streaming");

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;
  wrapper.appendChild(bubble);

  messagesEl.appendChild(wrapper);
  scrollToBottom();
  // subtle neon flash for user messages
  if (role === "user") {
    bubble.classList.add('neon-glow');
    setTimeout(() => bubble.classList.remove('neon-glow'), 500);
  }
  return bubble;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// placeholder rotation when idle
const prompts = [
  "Ask me about biology experiments...",
  "Try: 'Explain DNA in simple terms'",
  "What's a healthy habit for students?",
  "Ask me to summarize an article",
];
let promptIdx = 0;
setInterval(() => {
  if (document.activeElement === inputEl) return;
  inputEl.placeholder = prompts[promptIdx++ % prompts.length];
}, 3500);

// small beep using Web Audio
function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = 700;
  g.gain.value = 0.02;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  setTimeout(() => { o.stop(); ctx.close(); }, 60);
}

// Async iterator that yields each `data:` payload from an SSE stream.
async function* readSseStream(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = frame
        .split("\n")
        .find((l) => l.startsWith("data: "));
      if (dataLine) yield dataLine.slice(6);
    }
  }
}
