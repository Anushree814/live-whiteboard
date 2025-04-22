const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let currentColor = "black";
let currentTool = "brush";
canvas.classList.remove("eraser-cursor");
canvas.classList.add("brush-cursor");
const colorPicker = document.getElementById("colorPicker");
const colorPickerLabel = document.getElementById("color-picker-label");

colorPicker.addEventListener("input", (event) => {
  setColor(event.target.value);
  colorPickerLabel.style.backgroundColor = event.target.value;
});
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const socketUrl = isLocalhost
  ? "ws://localhost:3000"
  : "https://gigantic-pricey-axolotl.glitch.me/"; 
let socket = new WebSocket(socketUrl);

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);
socket.onclose = () => {
  console.log("WebSocket connection closed. Attempting to reconnect...");
  setTimeout(() => {
    initializeWebSocket();
  }, 1000);
};

function initializeWebSocket() {
  socket = new WebSocket(socketUrl);
}
socket.addEventListener("open", () => {
  console.log("WebSocket connection opened");
});

socket.addEventListener("close", () => {
  console.log("WebSocket connection closed");
});

socket.addEventListener("error", (error) => {
  console.error("WebSocket error:", error);
});
socket.onmessage = (event) => {
  const reader = new FileReader();
  reader.onload = function () {
    const data = JSON.parse(reader.result);
    if (data.start) {
      ctx.beginPath();
      ctx.moveTo(data.x, data.y);
    } else {
      drawOnCanvas(data.x, data.y, data.color, data.tool);
    }
  };
  reader.readAsText(event.data);
};

function startDrawing(event) {
  drawing = true;
  ctx.beginPath();
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  ctx.moveTo(x, y);

  const startMessage = JSON.stringify({ x, y, start: true });
  socket.send(startMessage);
}

function stopDrawing() {
  drawing = false;
}

function draw(event) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  drawOnCanvas(x, y, currentColor, currentTool);
  const message = JSON.stringify({
    x,
    y,
    color: currentColor,
    tool: currentTool,
  });
  socket.send(message);
}

function drawOnCanvas(x, y, color, tool) {
  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 10;
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
  }

  ctx.lineCap = "round";
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.moveTo(x, y);
}

function setColor(color) {
  currentColor = color;
  ctx.strokeStyle = currentColor;
}

function setTool(tool) {
  currentTool = tool;
  const canvas = document.getElementById("canvas");

  if (tool === "brush") {
    canvas.classList.remove("eraser-cursor");
    canvas.classList.add("brush-cursor");
  } else if (tool === "eraser") {
    canvas.classList.remove("brush-cursor");
    canvas.classList.add("eraser-cursor");
  }
}
