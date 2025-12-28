const API_URL = "YOUR_WEB_APP_URL_HERE";

// UI switches
function showSignup() {
  loginBox.classList.add("hidden");
  signupBox.classList.remove("hidden");
  forgotBox.classList.add("hidden");
}

function showLogin() {
  signupBox.classList.add("hidden");
  loginBox.classList.remove("hidden");
  forgotBox.classList.add("hidden");
}

function showForgot() {
  signupBox.classList.add("hidden");
  loginBox.classList.add("hidden");
  forgotBox.classList.remove("hidden");
}

const statusBox = document.getElementById("status");

// Signup
async function signupUser() {
  const data = {
    mode: "signup",
    username: signupUsername.value,
    email: signupEmail.value,
    password: signupPassword.value
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  const reply = await res.json();
  statusBox.textContent = reply.message;
}

// Login
async function loginUser() {
  const data = {
    mode: "login",
    email: loginEmail.value,
    password: loginPassword.value
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  const reply = await res.json();
  statusBox.textContent = reply.message;

  if (reply.success) {
    // Redirect to chat page
    window.location.href = "index.html";
  }
}

// Forgot password
async function recoverPassword() {
  const data = {
    mode: "forgot",
    email: forgotEmail.value
  };

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  });

  const reply = await res.json();
  statusBox.textContent = reply.message;
}

