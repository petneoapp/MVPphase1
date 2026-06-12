"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import { Input } from '@/components/common/ui/Input';
import { api, clearAuth } from '@/utils/api';
import DashboardHeader from "@/components/customer/DashboardHeader";
import DashboardMenu from "@/components/customer/DashboardMenu";
import { FaUserFriends, FaUserCircle, FaExclamationTriangle, FaLock, FaQuestionCircle, FaInfoCircle } from "react-icons/fa";
import { PageType } from "@/app/customer/dashboard/constants";

interface Chat {
  id: number;
  vet_name: string;
  vet_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_type: string;
  content: string;
  created_at: string;
}

export default function CustomerChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();

  // Menu state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [user, setUser] = useState<any>(null);

  const menuItems = [
      { icon: <FaUserFriends />, label: "My Pets", id: PageType.MY_PETS },
      { icon: <FaUserCircle />, label: "My Bio", id: PageType.MY_BIO },
      { icon: <FaExclamationTriangle />, label: "Consultation Chats", id: "CHAT" as PageType },
      { icon: <FaLock />, label: "Privacy", id: PageType.PRIVACY },
      { icon: <FaQuestionCircle />, label: "Help", id: PageType.HELP },
      { icon: <FaInfoCircle />, label: "About", id: PageType.ABOUT },
  ];

  useEffect(() => {
    fetchChats();
    // Fetch basic user details for the header
    api.get("/user/profile").then((res: any) => {
      setUser(res);
    }).catch(console.error);
  }, []);

  const fetchChats = async () => {
    try {
      const data = await api.get('/chat');
      setChats(data || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const data = await api.get(`/chat/${chatId}/messages`);
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
    fetchMessages(chat.id);
  };

  const handleSendMessage = async () => {
    if (!activeChat || !newMessage.trim()) return;

    try {
      const data = await api.post(`/chat/${activeChat.id}/messages`, { content: newMessage });
      if (data) {
        setMessages([...messages, data]);
        setNewMessage('');
        fetchChats(); // Refresh last message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  function handleMenuClick(menuItem: { icon: React.ReactNode; label: string; id: PageType; }): void {
      setIsOpen(false);
      if (menuItem.id === "CHAT" as PageType) {
          // Already here
      } else {
          router.push(`/customer/dashboard?view=${menuItem.id}`);
      }
  }

  function handleLogOut(): void {
      setIsOpen(false);
      clearAuth();
      router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#e1e5f8] text-gray-900 font-sans">
      <DashboardHeader
        userName={user?.name}
        userProfileUrl={user?.profile_url}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        menuButtonRef={menuButtonRef}
      />

      <DashboardMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        menuButtonRef={menuButtonRef}
        menuItems={menuItems}
        handleMenuClick={handleMenuClick}
        handleLogOut={handleLogOut}
      />

      <div className={`container mx-auto p-4 flex h-[calc(100vh-100px)] ${isOpen ? "blur-sm pointer-events-none" : ""}`}>
        {/* Chat List */}
        <div className="w-1/3 border-r pr-4 flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-4">Conversations</h2>
          {chats.length === 0 ? (
            <p className="text-gray-500">No active consultations.</p>
          ) : (
            chats.map(chat => (
              <Card 
                key={chat.id} 
                className={`cursor-pointer hover:bg-gray-50 transition-colors ${activeChat?.id === chat.id ? 'border-primary' : ''}`}
                onClick={() => handleChatSelect(chat)}
              >
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {chat.vet_avatar ? (
                      <img src={chat.vet_avatar} alt={chat.vet_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">V</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{chat.vet_name}</h3>
                    <p className="text-sm text-gray-500 truncate">{chat.last_message}</p>
                  </div>
                  {chat.unread_count > 0 && (
                    <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      {chat.unread_count}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chat Window */}
        <div className="w-2/3 pl-4 flex flex-col">
          {activeChat ? (
            <>
              <CardHeader className="border-b px-0 pt-0 bg-white">
                <CardTitle>Chat with {activeChat.vet_name}</CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 bg-white/50 rounded-lg p-4 mt-2">
                {messages.map(msg => (
                  <div key={msg.id} className={`max-w-[70%] p-3 rounded-lg ${msg.sender_type === 'user' ? 'bg-pink-500 text-white self-end' : 'bg-white text-gray-800 self-start shadow-sm'}`}>
                    <p>{msg.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white"
                />
                <Button onClick={handleSendMessage} className="bg-pink-500 hover:bg-pink-600 text-white">Send</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4 bg-white/50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
