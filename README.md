# Sky Chat

A modern random chat application with a beautiful sky blue and white design. Connect with random people around the world or invite your friends to chat privately.

## Features

- **Random Matching**: Connect with random people instantly
- **Invite Friends**: Generate a chat code to invite specific friends
- **No Message Storage**: All messages are deleted when you leave the chat
- **Mobile Friendly**: Fully responsive design for all devices
- **Secure Authentication**: Email and password authentication powered by Supabase
- **Real-time Messaging**: Instant message delivery using Supabase Realtime

## How to Use

### Getting Started
1. Open the website and sign up with your email and password
2. Choose your username
3. Login to access the main chat interface

### Random Chat
1. Click "Start Random Chat" button
2. Wait to be matched with another user
3. Start chatting instantly
4. Messages disappear when you leave

### Invite a Friend
1. Click "Invite a Friend" button
2. Choose "Generate Chat Code" to create a unique code
3. Share the code with your friend
4. Your friend enters the code to join your private chat room

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (ES6 modules)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime for instant messaging
- **Authentication**: Supabase Auth
- **Design**: Sky blue and white color scheme
- **Responsive**: Mobile-first design approach

## Privacy

- Messages are not stored in any database
- All messages are transmitted in real-time only
- Chat rooms are automatically cleaned up after users leave
- User data is protected with Row Level Security policies

## Pages

- `index.html` - Entry point (redirects to auth)
- `auth.html` - Login and signup page
- `main.html` - Main chat interface
- `chat.html` - Legacy redirect to main

Enjoy chatting on Sky Chat!
