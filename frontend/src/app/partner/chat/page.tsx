"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/ui/Card';
import { Button } from '@/components/common/ui/Button';
import { Input } from '@/components/common/ui/Input';
import { api, clearAuth } from '@/utils/api';
import Link from "next/link";
import { FaChevronRight, FaUserFriends, FaUserCircle, FaLock, FaQuestionCircle, FaInfoCircle } from "react-icons/fa";
import { PiClockCountdownBold } from "react-icons/pi";
import { IoMdNotifications } from "react-icons/io";
import { Menu, X } from "lucide-react";
import SimpleOverlay from "@/components/customer/simpleOverlay";
import { PartnerMenuItemType } from "@/types/partner";

interface Chat {
  id: number;
  user_name: string;
  user_avatar: string | null;
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

export default function PartnerChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();

  // Menu State
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuButtonRef = useRef(null);
  const [partnerDetails, setPartnerDetails] = useState<any>({});

  const menuItems = [
      { icon: <IoMdNotifications />, label: "Work Status", id: PartnerMenuItemType.WORK_STATUS },
      { icon: <PiClockCountdownBold />, label: "Manage Time Slots", id: PartnerMenuItemType.MANAGE_TIME_SLOTS },
      { icon: <FaUserFriends />, label: "Consultation Chats", id: "CHAT" as PartnerMenuItemType },
      { icon: <FaUserCircle />, label: "My Bio", id: PartnerMenuItemType.MY_BIO },
      { icon: <FaLock />, label: "Privacy", id: PartnerMenuItemType.PRIVACY },
      { icon: <FaQuestionCircle />, label: "Help", id: PartnerMenuItemType.HELP },
      { icon: <FaInfoCircle />, label: "About", id: PartnerMenuItemType.ABOUT },
  ];

  useEffect(() => {
    fetchChats();
    api.get("/appointments/vetTodaySummary", undefined, "partner").then((res: any) => {
        if (res && res.profile_picture_url) {
            res.profile_picture_url = `${res.profile_picture_url.split("?")[0]}?t=${Date.now()}`;
        }
        setPartnerDetails(res);
    }).catch(console.error);
  }, []);

  const fetchChats = async () => {
    try {
      const data = await api.get('/chat/partner', undefined, 'partner');
      setChats(data || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const data = await api.get(`/chat/partner/${chatId}/messages`, undefined, 'partner');
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
      const data = await api.post(`/chat/partner/${activeChat.id}/messages`, { content: newMessage }, 'partner');
      if (data) {
        setMessages([...messages, data]);
        setNewMessage('');
        fetchChats(); // Refresh last message
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  function handleMenuClick(menuItem: { icon: React.JSX.Element; label: string; id: PartnerMenuItemType; }): void {
      setIsOpen(false);
      if (menuItem.id === "CHAT" as PartnerMenuItemType) {
          // Already here
      } else if (menuItem.id === PartnerMenuItemType.MY_BIO) {
          router.push(`/partner/myBio`);
      } else if (menuItem.id === PartnerMenuItemType.MANAGE_TIME_SLOTS) {
          router.push(`/partner/manageTimeSlots`);
      } else if (menuItem.id === PartnerMenuItemType.WORK_STATUS) {
          router.push(`/partner/workStatus`);
      } else if (menuItem.id === PartnerMenuItemType.PRIVACY) {
          router.push(`/partner/privacy`);
      } else if (menuItem.id === PartnerMenuItemType.HELP) {
          router.push(`/partner/help`);
      } else if (menuItem.id === PartnerMenuItemType.ABOUT) {
          router.push(`/partner/about`);
      }
  }

  function handleLogOut(): void {
      setIsOpen(false);
      clearAuth("partner");
      router.push("/login");
  }

  return (
    <div className="min-h-screen bg-blue-50 text-gray-900 font-sans">
      <div className="sticky top-0 z-50">
          <header className="flex items-center justify-between px-6 py-3 bg-white shadow">
              <Link href="/partner/dashboard" className="inline-flex items-center">
                  <img src="/images/logo.svg" alt="PetNeo" className="h-10" />
              </Link>

              <nav className="flex items-center space-x-4 text-sm font-semibold">
                  <div className="flex items-center space-x-2">
                      <span>Hello,</span>
                      <span className="font-semibold text-pink-600">Dr.{partnerDetails?.vet_name}</span>
                      <img
                          src={partnerDetails?.profile_picture_url || "/images/paw.svg"}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover"
                      />
                  </div>
                  <button
                      aria-label="Menu"
                      className="text-2xl transition font-bold focus:outline-none"
                      type="button"
                      ref={menuButtonRef}
                      onClick={() => setIsOpen(!isOpen)}
                  >
                      {isOpen ? <X size={28} /> : <Menu size={28} />}
                  </button>
              </nav>
          </header>
      </div>

      {isOpen && <SimpleOverlay
          targetRef={menuButtonRef}
          placement="bottom"
          show={isOpen}
          offset={40}
          offSetY={350}
          onHide={() => {setIsOpen(false)}}
      >
          <div className="w-90 max-w-xs rounded-xl shadow-md p-4 bg-white">
              <div className="mb-4">
                  {menuItems.map((menuItem) => (
                      <div
                          key={menuItem.id}
                          className="cursor-pointer border-0 px-0 py-2"
                          onClick={() => handleMenuClick(menuItem)}
                      >
                          <div className="flex flex-row flex-nowrap items-center justify-between">
                              <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-lg">
                                      {menuItem.icon}
                                  </div>
                                  <span className="font-semibold text-black">{menuItem.label}</span>
                              </div>
                              <FaChevronRight className="text-gray-400" />
                          </div>
                      </div>
                  ))}
              </div>
              <button
                  className="w-full h-10 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-lg"
                  onClick={handleLogOut}>
                  Logout
              </button>
          </div>
      </SimpleOverlay>}

      <div className={`container mx-auto p-4 flex h-[calc(100vh-100px)] ${isOpen ? "blur-sm pointer-events-none" : ""}`}>
        {/* Chat List */}
        <div className="w-1/3 border-r pr-4 flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-4">Patient Consultations</h2>
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
                    {chat.user_avatar ? (
                      <img src={chat.user_avatar} alt={chat.user_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">P</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{chat.user_name}</h3>
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
              <CardHeader className="border-b px-0 pt-0 flex flex-row items-center justify-between">
                <CardTitle>Chat with {activeChat.user_name}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => router.push(`/partner/appointments`)}>View Appointment</Button>
              </CardHeader>
              <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2">
                {messages.map(msg => (
                  <div key={msg.id} className={`max-w-[70%] p-3 rounded-lg ${msg.sender_type === 'vet' ? 'bg-pink-600 text-white self-end' : 'bg-white text-gray-800 self-start shadow-sm'}`}>
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
                  placeholder="Type your message to the patient..."
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} className="bg-pink-600 text-white hover:bg-pink-700">Send</Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <p>Select a consultation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
