const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user) {
  window.location.href = "login.html";
}

document.getElementById("welcomeUser").textContent =
  "Hi " + user.username;

// Save last active user
localStorage.setItem("lastUserEmail", user.email);

// Redirect to main chat page
setTimeout(() => {
  window.location.href = "index.html";
}, 1200);

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}
