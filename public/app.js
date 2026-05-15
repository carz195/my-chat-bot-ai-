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
  return bubble;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
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
