import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://cfomtephkvlmyjsytcwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb210ZXBoa3ZsbXlqc3l0Y3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTQ2NzYsImV4cCI6MjA4MjU3MDY3Nn0.f4B_G2y5AIsaamKtP2Fp5_ErIc3FkWhyQvmnhJp3aLM';
const supabase = createClient(supabaseUrl, supabaseKey);

window.showSignup = function() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('signupForm').classList.remove('hidden');
  clearStatus();
};

window.showLogin = function() {
  document.getElementById('signupForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
  clearStatus();
};

function showStatus(message, isError = false) {
  const statusEl = document.getElementById('statusMessage');
  statusEl.textContent = message;
  statusEl.className = 'status-message ' + (isError ? 'error' : 'success');
  statusEl.classList.remove('hidden');
}

function clearStatus() {
  document.getElementById('statusMessage').classList.add('hidden');
}

window.handleLogin = async function() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showStatus('Please fill in all fields', true);
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    showStatus('Login successful!');
    setTimeout(() => {
      window.location.href = 'chat.html';
    }, 500);

  } catch (error) {
    showStatus(error.message, true);
  }
};

window.handleSignup = async function() {
  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!username || !email || !password) {
    showStatus('Please fill in all fields', true);
    return;
  }

  if (password.length < 6) {
    showStatus('Password must be at least 6 characters', true);
    return;
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: authData.user.id,
        username: username
      }]);

    if (profileError) throw profileError;

    showStatus('Account created! Logging you in...');
    setTimeout(() => {
      window.location.href = 'chat.html';
    }, 1000);

  } catch (error) {
    showStatus(error.message, true);
  }
};

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'chat.html';
  }
})();
