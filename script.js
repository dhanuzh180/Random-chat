const homeScreen = document.getElementById("homeScreen");
const chatScreen = document.getElementById("chatScreen");
const messagesBox = document.getElementById("messages");
const msgInput = document.getElementById("msgInput");
const chatCodeText = document.getElementById("chatCodeText");

let peer;
let conn;
let chatCode = null;

// Generate random chat code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Show message in UI
function addMessage(text, mine = false) {
  const div = document.createElement("div");
  div.className = mine ? "msg me" : "msg other";
  div.textContent = text;
  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

// Switch screens
function openChatScreen() {
  homeScreen.classList.add("hidden");
  chatScreen.classList.remove("hidden");
}

// Leave chat = delete everything
document.getElementById("leaveBtn").onclick = () => location.reload();


// Start PeerJS
peer = new Peer();

peer.on("open", id => {
  console.log("Peer Connected:", id);
});


// Send message
document.getElementById("sendBtn").onclick = () => {
  const text = msgInput.value.trim();
  if (!text) return;

  conn.send(text);
  addMessage(text, true);
  msgInput.value = "";
};


// Incoming connection
peer.on("connection", connection => {
  conn = connection;
  openChatScreen();

  conn.on("data", data => addMessage(data, false));

  chatCodeText.textContent = "Connected (Temporary chat)";
});


// Create Invite Code
document.getElementById("createCodeBtn").onclick = () => {
  chatCode = generateCode();
  alert("Share this code with your friend:\n\n" + chatCode);

  openChatScreen();
  chatCodeText.textContent = "Chat Code: " + chatCode;

  peer.on("connection", c => {
    conn = c;
    conn.on("data", d => addMessage(d, false));
  });
};


// Join Using Code
document.getElementById("joinCodeBtn").onclick = () => {
  const code = document.getElementById("codeInput").value.trim();
  if (!code) return alert("Enter a chat code");

  conn = peer.connect(code);

  conn.on("open", () => {
    openChatScreen();
    chatCodeText.textContent = "Joined Chat";
  });

  conn.on("data", d => addMessage(d, false));
};


// Random Chat (Temporary Match)
document.getElementById("randomChatBtn").onclick = () => {
  chatCode = generateCode();
  conn = peer.connect(chatCode);

  conn.on("open", () => {
    openChatScreen();
    chatCodeText.textContent = "Random Chat Connected";
  });

  conn.on("data", d => addMessage(d, false));
};
