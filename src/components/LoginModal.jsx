import React, { useState } from 'react';
import api from '../services/api'; 

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/login', {
                email,
                password
            });

            if (response.data.success) {
                // Salva o token no navegador
                localStorage.setItem('admin_token', response.data.token);
                onLoginSuccess(response.data.user);
                onClose(); // Fecha o modal
            }
        } catch (err) {
            setError('Falha no login. Verifique suas credenciais.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Bloco de estilo encapsulado para evitar atributos inline no HTML */}
            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }

                .modal-content {
                    background-color: #ffffff;
                    padding: 30px;
                    border-radius: 8px;
                    width: 100%;
                    max-width: 400px;
                    position: relative;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }

                .close-button {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-top: 20px;
                }

                .form-group input {
                    width: 100%;
                    padding: 10px;
                    margin-top: 5px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }

                .btn-submit {
                    background-color: #0056b3;
                    color: white;
                    padding: 10px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                }

                .btn-submit:hover {
                    background-color: #004494;
                }

                .alert-error {
                    color: #721c24;
                    background-color: #f8d7da;
                    padding: 10px;
                    border-radius: 4px;
                    margin-top: 10px;
                }
            `}</style>

            <div className="modal-overlay">
                <div className="modal-content">
                    <button className="close-button" onClick={onClose}>X</button>
                    <h2>Acesso Restrito</h2>
                    <p>Área de gestão do mapa</p>
                    
                    {error && <div className="alert-error">{error}</div>}

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">E-mail</label>
                            <input 
                                type="email" 
                                id="email"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">Senha</label>
                            <input 
                                type="password" 
                                id="password"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>

                        <button type="submit" className="btn-submit">Entrar</button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default LoginModal;