'use client';

import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { LuSend, LuArrowLeft, LuLoader } from 'react-icons/lu';

interface Message {
    id: number;
    applicationId: number;
    senderId: string;
    senderName: string;
    content: string;
    sentAt: string;
    isRead: boolean;
}

export default function ChatPage() {
    const { applicationId } = useParams() as { applicationId: string };
    const { user, token } = useAuthStore();
    const router = useRouter();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load message history & start SignalR
    useEffect(() => {
        if (!user || !token || !applicationId) return;

        let isMounted = true;
        let connection: signalR.HubConnection;

        const initChat = async () => {
            try {
                // 1. Fetch history
                const res = await api.get(`/applications/${applicationId}/messages`);
                if (isMounted) {
                    setMessages(res.data);
                    setLoading(false);
                }

                // 2. Setup SignalR connection
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5037/api';
                const HUB_URL = API_URL.replace('/api', '/chatHub');
                
                connection = new signalR.HubConnectionBuilder()
                    .withUrl(HUB_URL, {
                        accessTokenFactory: () => token
                    })
                    .withAutomaticReconnect()
                    .build();

                // 3. Define handlers
                connection.on('ReceiveMessage', (msg: Message) => {
                    setMessages(prev => [...prev, msg]);
                });

                // 4. Start connection
                await connection.start();
                if (isMounted) {
                    setHubConnection(connection);
                    // 5. Join group
                    await connection.invoke('JoinApplicationGroup', parseInt(applicationId));
                }
            } catch (err) {
                console.error("Error setting up chat:", err);
                if (isMounted) setLoading(false);
            }
        };

        initChat();

        return () => {
            isMounted = false;
            if (connection) {
                connection.invoke('LeaveApplicationGroup', parseInt(applicationId)).catch(console.error);
                connection.stop();
            }
        };
    }, [applicationId, user, token]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !hubConnection) return;

        try {
            await hubConnection.invoke('SendMessage', parseInt(applicationId), newMessage);
            setNewMessage('');
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <LuLoader className="w-8 h-8 text-orange animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-0 sm:p-4 md:p-8 h-[calc(100dvh-64px)] sm:h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="bg-white p-4 sm:rounded-t-lg shadow-xs border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-charcoal cursor-pointer">
                        <LuArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-semibold text-charcoal">Chat</h1>
                        <p className="text-xs text-gray-500">Application #{applicationId}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-warmwhite p-4 border-x border-gray-200 flex flex-col gap-3">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                        No messages yet. Send a message to start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMine = msg.senderId === user?.id;
                        return (
                            <div key={msg.id} className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                                {!isMine && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.senderName}</span>}
                                <div className={`px-4 py-2.5 rounded-lg text-sm break-words w-full shadow-xs ${isMine ? 'bg-orange text-white rounded-br-none' : 'bg-white text-charcoal border border-gray-200 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 mx-1">
                                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 sm:rounded-b-lg shadow-xs border border-gray-200">
                <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm text-charcoal focus:outline-none focus:ring-1 focus:ring-orange focus:border-orange"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !hubConnection}
                        className="bg-orange text-white p-2 rounded-md hover:bg-orange/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10 shrink-0 cursor-pointer shadow-xs transition-colors"
                    >
                        <LuSend className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
