
import React, { useState, useRef, useEffect } from 'react';
import { User, Team, ChatMessage } from '../types';
import { useTranslation } from '../i18n/config';
import { ChatBubbleLeftRightIcon } from './icons';

interface ChatProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => Promise<void>;
    currentUser: User;
    team: Team | null;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, currentUser, team }) => {
    const { t, language } = useTranslation();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    if (!team) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-accent mb-4"/>
                <p className="text-xl text-highlight">{t('chat.noTeam')}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-highlight">{t('chat.noMessages')}</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.userId !== currentUser.id && (
                                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" title={msg.userName}>
                                    {msg.userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className={`max-w-xl p-3 rounded-lg shadow-md ${msg.userId === currentUser.id ? 'bg-brand text-white rounded-br-none' : 'bg-secondary text-light rounded-bl-none'}`}>
                                {msg.userId !== currentUser.id && (
                                    <p className="text-xs font-bold text-highlight mb-1">{msg.userName}</p>
                                )}
                                <p className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                                <p className={`text-xs mt-1 ${msg.userId === currentUser.id ? 'text-blue-200' : 'text-highlight'} text-right`}>
                                    {new Date(msg.timestamp).toLocaleTimeString(language, { hour: 'numeric', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-6 pt-2 border-t border-accent bg-primary flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-4 items-center">
                    <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={t('chat.placeholder')}
                        className="flex-1 bg-secondary border-accent rounded-md p-3 text-light resize-none focus:ring-2 focus:ring-brand focus:border-brand transition-shadow"
                        rows={2}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                    />
                    <button type="submit" className="bg-brand text-white font-bold py-3 px-6 rounded-md hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" disabled={!newMessage.trim()}>
                        {t('chat.send')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
