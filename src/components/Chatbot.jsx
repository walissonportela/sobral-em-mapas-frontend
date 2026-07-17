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

    const [isClosing, setIsClosing] = useState(false);

    const closeChat = () => {
        setIsClosing(true);

        setTimeout(() => {
            setIsClosing(false);
            setIsOpen(false);
        }, 300);
    };

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
    /* ===========================
       ANIMAÇÕES
    =========================== */

    @keyframes popIn {
        from {
            opacity: 0;
            transform: scale(.9) translateY(10px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes mobileOpen {
        from {
            transform: translateY(100%);
        }
        to {
            transform: translateY(0);
        }
    }

    @keyframes bounce {
        0%,80%,100%{
            transform:translateY(0);
        }
        40%{
            transform:translateY(-5px);
        }
    }

    @keyframes mobileClose{

        from{
            transform:translateY(0);
            opacity:1;
        }

        to{
            transform:translateY(100%);
            opacity:0;
        }

    }


    /* ===========================
       WRAPPER
    =========================== */

    .navisol-wrapper{
        position:fixed;
        bottom:24px;
        right:24px;
        z-index:100;
        font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    }


    /* ===========================
       BOTÃO
    =========================== */

    .navisol-btn{

        background:linear-gradient(135deg,#007bff 0%,#0056b3 100%);
        color:#fff;
        border:none;
        box-shadow:0 4px 15px rgba(0,123,255,.4);

        padding:12px 24px;

        border-radius:999px;

        cursor:pointer;

        display:flex;
        align-items:center;
        gap:10px;

        font-size:16px;
        font-weight:600;

        transition:.3s;

    }

    .navisol-btn:hover{

        transform:translateY(-3px);

        box-shadow:0 6px 20px rgba(0,123,255,.6);

    }


    /* ===========================
       JANELA - DESKTOP
    =========================== */

    .navisol-window{

        width:360px;
        height:550px;

        background:#fff;

        display:flex;
        flex-direction:column;

        overflow:hidden;

        border-radius:18px;

        border:1px solid #eaeaea;

        box-shadow:0 10px 30px rgba(0,0,0,.15);

        animation:popIn .3s cubic-bezier(.175,.885,.32,1.275);

    }


    /* ===========================
       DRAGGER
    =========================== */

    .navisol-dragger{

        display:none;

    }


    /* ===========================
       HEADER
    =========================== */

    .navisol-header{

        background:linear-gradient(135deg,#007bff 0%,#0056b3 100%);

        color:#fff;

        padding:18px 20px;

        display:flex;

        justify-content:space-between;

        align-items:center;

        font-weight:600;

        font-size:16px;

        box-shadow:0 2px 10px rgba(0,0,0,.1);

        z-index:2;

    }

    .navisol-header-title{

        display:flex;

        align-items:center;

        gap:10px;

        min-width:0;

    }

    .navisol-header-title span{

        white-space:nowrap;

        overflow:hidden;

        text-overflow:ellipsis;

    }

    .navisol-close-btn{

        background:rgba(255,255,255,.1);

        border:none;

        color:#fff;

        width:32px;

        height:32px;

        border-radius:50%;

        display:flex;

        justify-content:center;

        align-items:center;

        cursor:pointer;

        transition:.2s;

    }

    .navisol-close-btn:hover{

        background:rgba(255,255,255,.25);

    }


    /* ===========================
       MENSAGENS
    =========================== */

    .navisol-messages{

        flex:1;

        padding:20px;

        overflow-y:auto;

        display:flex;

        flex-direction:column;

        gap:12px;

        background:#f8f9fa;

    }

    .navisol-messages::-webkit-scrollbar{

        width:6px;

    }

    .navisol-messages::-webkit-scrollbar-thumb{

        background:#cfd4da;

        border-radius:999px;

    }


    .navisol-welcome{

        background:linear-gradient(135deg,#007bff 0%,#0056b3 100%);

        color:white;

        padding:16px;

        border-radius:12px;

        text-align:center;

        font-size:14px;

        margin-bottom:10px;

        animation:slideUp .4s ease;

    }


    .navisol-msg{

        padding:12px 16px;

        border-radius:18px;

        max-width:82%;

        font-size:14px;

        line-height:1.5;

        word-break:break-word;

        animation:slideUp .3s;

    }

    .navisol-msg.user{

        align-self:flex-end;

        background:#007bff;

        color:#fff;

        border-bottom-right-radius:4px;

    }

    .navisol-msg.bot{

        align-self:flex-start;

        background:#fff;

        color:#333;

        border:1px solid #e9ecef;

        border-bottom-left-radius:4px;

    }


    /* ===========================
       DIGITAÇÃO
    =========================== */

    .navisol-typing{

        align-self:flex-start;

        background:#fff;

        border:1px solid #e9ecef;

        border-radius:18px;

        border-bottom-left-radius:4px;

        padding:14px 18px;

        display:flex;

        gap:4px;

    }

    .navisol-typing span{

        width:6px;

        height:6px;

        border-radius:50%;

        background:#adb5bd;

        animation:bounce 1.4s infinite;

    }


    /* ===========================
       INPUT
    =========================== */

    .navisol-input-area{

        display:flex;

        gap:10px;

        padding:15px;

        align-items:center;

        border-top:1px solid #eaeaea;

        background:white;

    }

    .navisol-input-area input{

        flex:1;

        padding:12px 18px;

        border-radius:25px;

        border:1px solid #ced4da;

        outline:none;

        background:#f8f9fa;

        transition:.3s;

        font-size:14.5px;

    }

    .navisol-input-area input:focus{

        border-color:#80bdff;

        background:white;

    }

    .navisol-send-btn{

        width:44px;

        height:44px;

        border-radius:50%;

        border:none;

        background:#007bff;

        color:white;

        display:flex;

        justify-content:center;

        align-items:center;

        cursor:pointer;

        transition:.25s;

        flex-shrink:0;

    }

    .navisol-send-btn:hover:not(:disabled){

        background:#0056b3;

        transform:scale(1.05);

    }

    .navisol-send-btn:disabled{

        background:#e9ecef;

        color:#adb5bd;

        cursor:not-allowed;

    }


    /* ===========================
       MOBILE
    =========================== */

    @media (max-width:768px){

        .navisol-wrapper{

            bottom:max(16px,env(safe-area-inset-bottom));

            right:16px;

        }

        .navisol-btn{

            width:64px;

            height:64px;

            padding:0;

            border-radius:50%;

            justify-content:center;

        }

        .navisol-btn span{

            display:none;

        }

        .navisol-window{

            position:fixed;

            left:0;

            right:0;

            bottom:0;

            width:100%;

            height:85dvh;

            border-radius:22px 22px 0 0;

            animation:mobileOpen .35s cubic-bezier(.22,.8,.32,1);

        }

        .navisol-dragger{

            display:block;

            width:48px;

            height:5px;

            border-radius:999px;

            background:#d1d5db;

            margin:10px auto 4px;

            flex-shrink:0;

        }

        .navisol-header{

            padding:16px;

        }

        .navisol-messages{

            padding:14px;

        }

        .navisol-msg{

            max-width:88%;

        }

        .navisol-welcome{

            padding:14px;

            font-size:13px;

        }

        .navisol-welcome strong{

            font-size:16px;

        }

        .navisol-input-area{

            padding:
                12px
                14px
                calc(12px + env(safe-area-inset-bottom))
                14px;

        }

        .navisol-input-area input{

            padding:11px 16px;

            font-size:16px;

        }

        .navisol-send-btn{

            width:48px;

            height:48px;

        }

        .navisol-window.closing{
            animation:mobileClose .3s forwards;
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
                <div
                    className={`navisol-window ${isClosing ? 'closing' : ''}`}
                >
                        <div className="navisol-header">
                        <div className="navisol-header-title">
                            <BotIcon />
                            <span>Assistente - Sobral em Mapas</span>
                        </div>
                        <button className="navisol-close-btn" onClick={closeChat} aria-label="Fechar Chat">
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