import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://cfomtephkvlmyjsytcwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb210ZXBoa3ZsbXlqc3l0Y3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5OTQ2NzYsImV4cCI6MjA4MjU3MDY3Nn0.f4B_G2y5AIsaamKtP2Fp5_ErIc3FkWhyQvmnhJp3aLM';
const supabase = createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let currentRoom = null;
let messageChannel = null;
let matchingInterval = null;

(async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = 'auth.html';
    return;
  }

  currentUser = session.user;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    window.location.href = 'auth.html';
    return;
  }

  await supabase
    .from('user_profiles')
    .update({ last_active: new Date().toISOString() })
    .eq('id', currentUser.id);
})();

window.handleLogout = async function() {
  if (currentRoom) {
    await leaveChat();
  }
  await supabase.auth.signOut();
  window.location.href = 'auth.html';
};

window.startRandomChat = async function() {
  showLoading('Finding someone to chat with...');

  try {
    const { data: existingQueue } = await supabase
      .from('waiting_queue')
      .select('*')
      .neq('user_id', currentUser.id)
      .limit(1)
      .maybeSingle();

    if (existingQueue) {
      const roomCode = generateRoomCode();

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{
          room_code: roomCode,
          user1_id: currentUser.id,
          user2_id: existingQueue.user_id,
          is_active: true
        }])
        .select()
        .single();

      if (roomError) throw roomError;

      await supabase
        .from('waiting_queue')
        .delete()
        .eq('id', existingQueue.id);

      await joinChatRoom(room);

    } else {
      const { error: queueError } = await supabase
        .from('waiting_queue')
        .insert([{ user_id: currentUser.id }]);

      if (queueError) throw queueError;

      matchingInterval = setInterval(checkForMatch, 2000);
    }

  } catch (error) {
    console.error('Error starting chat:', error);
    hideLoading();
    alert('Failed to start chat. Please try again.');
  }
};

async function checkForMatch() {
  try {
    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
      .eq('is_active', true)
      .limit(1);

    if (rooms && rooms.length > 0) {
      clearInterval(matchingInterval);

      await supabase
        .from('waiting_queue')
        .delete()
        .eq('user_id', currentUser.id);

      await joinChatRoom(rooms[0]);
    }
  } catch (error) {
    console.error('Error checking for match:', error);
  }
}

window.cancelMatching = async function() {
  if (matchingInterval) {
    clearInterval(matchingInterval);
  }

  await supabase
    .from('waiting_queue')
    .delete()
    .eq('user_id', currentUser.id);

  hideLoading();
};

window.showInviteOptions = function() {
  document.getElementById('inviteModal').classList.remove('hidden');
};

window.closeInviteModal = function() {
  document.getElementById('inviteModal').classList.add('hidden');
  document.getElementById('generatedCode').classList.add('hidden');
  document.getElementById('joinCodeInput').value = '';
};

window.createChatCode = async function() {
  try {
    const roomCode = generateRoomCode();

    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert([{
        room_code: roomCode,
        user1_id: currentUser.id,
        user2_id: null,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    document.getElementById('codeDisplay').textContent = roomCode;
    document.getElementById('generatedCode').classList.remove('hidden');

    currentRoom = room;
    subscribeToRoom(room.id);

  } catch (error) {
    console.error('Error creating code:', error);
    alert('Failed to create chat code. Please try again.');
  }
};

window.copyCode = function() {
  const code = document.getElementById('codeDisplay').textContent;
  navigator.clipboard.writeText(code);
  alert('Code copied to clipboard!');
};

window.joinWithCode = async function() {
  const code = document.getElementById('joinCodeInput').value.trim().toUpperCase();

  if (!code) {
    alert('Please enter a chat code');
    return;
  }

  showLoading('Joining chat...');
  closeInviteModal();

  try {
    const { data: room, error: fetchError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('room_code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!room) {
      alert('Invalid or expired chat code');
      hideLoading();
      return;
    }

    if (room.user1_id === currentUser.id) {
      alert('You cannot join your own chat room');
      hideLoading();
      return;
    }

    if (room.user2_id && room.user2_id !== currentUser.id) {
      alert('This chat room is already full');
      hideLoading();
      return;
    }

    const { error: updateError } = await supabase
      .from('chat_rooms')
      .update({ user2_id: currentUser.id })
      .eq('id', room.id);

    if (updateError) throw updateError;

    const { data: updatedRoom } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', room.id)
      .single();

    await joinChatRoom(updatedRoom);

  } catch (error) {
    console.error('Error joining chat:', error);
    hideLoading();
    alert('Failed to join chat. Please try again.');
  }
};

async function joinChatRoom(room) {
  currentRoom = room;

  messageChannel = supabase.channel(`room:${room.id}`)
    .on('broadcast', { event: 'message' }, ({ payload }) => {
      if (payload.userId !== currentUser.id) {
        displayMessage(payload.message, false);
      }
    })
    .on('broadcast', { event: 'user_left' }, ({ payload }) => {
      if (payload.userId !== currentUser.id) {
        alert('The other user has left the chat');
        leaveChat();
      }
    })
    .subscribe();

  document.getElementById('homeScreen').classList.add('hidden');
  document.getElementById('chatScreen').classList.remove('hidden');
  hideLoading();
}

function subscribeToRoom(roomId) {
  messageChannel = supabase.channel(`room:${roomId}`)
    .on('broadcast', { event: 'message' }, ({ payload }) => {
      if (payload.userId !== currentUser.id) {
        if (!document.getElementById('chatScreen').classList.contains('hidden')) {
          displayMessage(payload.message, false);
        }
      }
    })
    .on('broadcast', { event: 'user_joined' }, () => {
      closeInviteModal();
      document.getElementById('homeScreen').classList.add('hidden');
      document.getElementById('chatScreen').classList.remove('hidden');
      document.getElementById('chatStatus').textContent = 'Connected';
    })
    .on('broadcast', { event: 'user_left' }, ({ payload }) => {
      if (payload.userId !== currentUser.id) {
        alert('The other user has left the chat');
        leaveChat();
      }
    })
    .subscribe();

  if (currentRoom && currentRoom.user2_id) {
    messageChannel.send({
      type: 'broadcast',
      event: 'user_joined'
    });
  }
}

window.sendMessage = async function() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message || !currentRoom || !messageChannel) return;

  displayMessage(message, true);

  await messageChannel.send({
    type: 'broadcast',
    event: 'message',
    payload: {
      message: message,
      userId: currentUser.id
    }
  });

  input.value = '';
  input.focus();
};

window.handleKeyPress = function(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
};

function displayMessage(text, isSent) {
  const container = document.getElementById('messagesContainer');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.textContent = text;

  messageDiv.appendChild(bubble);
  container.appendChild(messageDiv);
  container.scrollTop = container.scrollHeight;
}

window.leaveChat = async function() {
  if (messageChannel) {
    await messageChannel.send({
      type: 'broadcast',
      event: 'user_left',
      payload: { userId: currentUser.id }
    });

    await supabase.removeChannel(messageChannel);
    messageChannel = null;
  }

  if (currentRoom) {
    await supabase
      .from('chat_rooms')
      .update({ is_active: false })
      .eq('id', currentRoom.id);

    currentRoom = null;
  }

  document.getElementById('messagesContainer').innerHTML = '';
  document.getElementById('chatScreen').classList.add('hidden');
  document.getElementById('homeScreen').classList.remove('hidden');
};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function showLoading(text) {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

window.addEventListener('beforeunload', () => {
  if (currentRoom) {
    leaveChat();
  }
});
