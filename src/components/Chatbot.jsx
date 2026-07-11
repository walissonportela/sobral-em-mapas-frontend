import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';

// --- Ícones SVG Reutilizáveis ---
const ChatIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

const SendIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const BotIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2"></rect>
        <circle cx="12" cy="5" r="2"></circle>
        <path d="M12 7v4"></path>
        <line x1="8" y1="16" x2="8" y2="16"></line>
        <line x1="16" y1="16" x2="16" y2="16"></line>
    </svg>
);

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const toggleChat = () => setIsOpen(!isOpen);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await api.post('/send-message', {
                sender: 'user',
                message: userMsg,
            });

            const data = response.data;

            if (data && data.length > 0) {
                const botMessages = data.map((msg) => ({ sender: 'bot', text: msg.text }));
                setMessages((prev) => [...prev, ...botMessages]);
            } else {
                setMessages((prev) => [...prev, { sender: 'bot', text: 'Nenhuma resposta encontrada.' }]);
            }
        } catch (error) {
            console.error('Erro na comunicação com o chatbot:', error);
            setMessages((prev) => [...prev, { sender: 'bot', text: 'Ocorreu um erro. Tente novamente mais tarde.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    };

    const chatStyles = `
        /* Animações */
        @keyframes popIn {
            from { opacity: 0; transform: scale(0.9) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
        }

        .navisol-wrapper {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: 9999;
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* Botão Flutuante */
        .navisol-btn {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border: none;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.4);
            padding: 12px 24px;
            border-radius: 50px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 600;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .navisol-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(0, 123, 255, 0.6);
        }

        /* Janela do Chat */
        .navisol-window {
            width: 360px;
            height: 550px;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            border: 1px solid #eaeaea;
        }

        /* Cabeçalho */
        .navisol-header {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: #ffffff;
            padding: 18px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 2;
        }
        .navisol-header-title { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
        }
        .navisol-close-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s;
        }
        .navisol-close-btn:hover { background: rgba(255,255,255,0.25); }

        /* Corpo das Mensagens */
        .navisol-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background-color: #f8f9fa;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        /* Personalização da barra de rolagem */
        .navisol-messages::-webkit-scrollbar { width: 6px; }
        .navisol-messages::-webkit-scrollbar-track { background: transparent; }
        .navisol-messages::-webkit-scrollbar-thumb { background: #cfd4da; border-radius: 10px; }

        .navisol-welcome {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: #ffffff;
            padding: 16px;
            border-radius: 12px;
            text-align: center;
            font-size: 14px;
            margin-bottom: 10px;
            box-shadow: 0 4px 10px rgba(0, 123, 255, 0.2);
            animation: slideUp 0.4s ease-out forwards;
            border: none;
        }

        /* Balões de Mensagem */
        .navisol-msg {
            padding: 12px 16px;
            border-radius: 18px;
            max-width: 82%;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
            animation: slideUp 0.3s ease-out forwards;
        }
        .navisol-msg.user {
            align-self: flex-end;
            background-color: #007bff;
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 123, 255, 0.25);
        }
        .navisol-msg.bot {
            align-self: flex-start;
            background-color: #ffffff;
            color: #333333;
            border-bottom-left-radius: 4px;
            border: 1px solid #e9ecef;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        /* Indicador de Digitação */
        .navisol-typing {
            align-self: flex-start;
            background-color: #ffffff;
            padding: 14px 18px;
            border-radius: 18px;
            border-bottom-left-radius: 4px;
            border: 1px solid #e9ecef;
            display: flex;
            gap: 4px;
            align-items: center;
            animation: slideUp 0.3s ease-out forwards;
        }
        .navisol-typing span {
            width: 6px;
            height: 6px;
            background-color: #adb5bd;
            border-radius: 50%;
            display: inline-block;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .navisol-typing span:nth-child(1) { animation-delay: -0.32s; }
        .navisol-typing span:nth-child(2) { animation-delay: -0.16s; }

        /* Área de Input */
        .navisol-input-area {
            display: flex;
            padding: 15px;
            background-color: #ffffff;
            border-top: 1px solid #eaeaea;
            gap: 10px;
            align-items: center;
        }
        .navisol-input-area input {
            flex: 1;
            padding: 12px 18px;
            border: 1px solid #ced4da;
            border-radius: 25px;
            outline: none;
            font-size: 14.5px;
            background-color: #f8f9fa;
            transition: border-color 0.3s, background-color 0.3s;
        }
        .navisol-input-area input:focus {
            border-color: #80bdff;
            background-color: #ffffff;
        }
        .navisol-send-btn {
            background-color: #007bff;
            color: white;
            border: none;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.2s;
            flex-shrink: 0;
        }
        .navisol-send-btn:hover:not(:disabled) { 
            background-color: #0056b3; 
            transform: scale(1.05);
        }
        .navisol-send-btn:disabled { 
            background-color: #e9ecef; 
            color: #adb5bd;
            cursor: not-allowed; 
        }

        /* Responsividade Mobile */
        @media (max-width: 768px) {
            .navisol-wrapper {
                bottom: 15px;
                right: 15px;
            }
            .navisol-btn {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                justify-content: center;
                padding: 0;
            }
            .navisol-btn span { display: none; }
            .navisol-window {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                border-radius: 0;
                animation: slideUp 0.3s ease-out forwards;
            }
            .navisol-input-area {
                padding-bottom: 25px;
            }
        }
    `;

    return (
        <div data-tour="chat-button" className="navisol-wrapper">
            <style>{chatStyles}</style>

            {!isOpen ? (
                <button className="navisol-btn" onClick={toggleChat} aria-label="Abrir Chat">
                    <ChatIcon />
                    <span>Chat</span>
                </button>
            ) : (
                <div className="navisol-window">
                    <div className="navisol-header">
                        <div className="navisol-header-title">
                            <BotIcon />
                            <span>Assistente - Sobral em Mapas</span>
                        </div>
                        <button className="navisol-close-btn" onClick={toggleChat} aria-label="Fechar Chat">
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="navisol-messages">
                        {/* Caixa de Boas-vindas atualizada com Ícone */}
                        <div className="navisol-welcome">
                            <strong className='text-lg'>Bem-vindo ao chat do Sobral em Mapas!</strong><br /><br />
                            Tente perguntar sobre um destino, um ponto turístico ou simplesmente diga "olá".
                        </div>

                        <hr />
                        
                        {messages.map((msg, index) => (
                            <div key={index} className={`navisol-msg ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="navisol-typing">
                                <span></span><span></span><span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="navisol-input-area">
                        <input
                            type="text"
                            placeholder="Escreva sua mensagem..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isTyping}
                            autoFocus
                        />
                        <button 
                            className="navisol-send-btn" 
                            onClick={handleSend} 
                            disabled={isTyping || !inputValue.trim()}
                            title="Enviar mensagem"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;