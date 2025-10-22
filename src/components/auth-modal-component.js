/**
 * Componente de Modal de Autenticação
 */
class AuthModalComponent {
    constructor() {
        this.isLoginMode = true;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        // Criar modal container
        const modalHTML = `
            <div id="authModal" class="auth-modal" style="display: none;">
                <div class="auth-modal-content">
                    <button class="modal-close" onclick="window.hideAuthModal()">×</button>
                    
                    <div class="auth-header">
                        <h2 id="authTitle">Entrar na Plataforma</h2>
                        <p id="authSubtitle">Acesse sua conta para gerenciar contratos</p>
                    </div>

                    <!-- Login Form -->
                    <form id="loginForm" class="auth-form">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="loginEmail" placeholder="seu@email.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Senha</label>
                            <input type="password" id="loginPassword" placeholder="Sua senha" required>
                        </div>

                        <button type="submit" class="btn-primary">
                            Entrar
                        </button>

                        <p class="auth-switch">
                            Não tem conta? 
                            <a href="#" onclick="window.authModal.switchToRegister()">Cadastre-se</a>
                        </p>
                    </form>

                    <!-- Register Form -->
                    <form id="registerForm" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label>Nome Completo</label>
                            <input type="text" id="registerName" placeholder="João Silva" required>
                        </div>

                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="registerEmail" placeholder="seu@email.com" required>
                        </div>

                        <div class="form-group">
                            <label>CPF</label>
                            <input type="text" id="registerCPF" placeholder="000.000.000-00" maxlength="14" required>
                        </div>

                        <div class="form-group">
                            <label>Telefone</label>
                            <input type="tel" id="registerPhone" placeholder="(11) 98765-4321" maxlength="15" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Senha</label>
                            <input type="password" id="registerPassword" placeholder="Mínimo 6 caracteres" required>
                        </div>

                        <div class="form-group">
                            <label>Confirmar Senha</label>
                            <input type="password" id="registerConfirmPassword" placeholder="Repita a senha" required>
                        </div>

                        <button type="submit" class="btn-primary">
                            Criar Conta
                        </button>

                        <p class="auth-switch">
                            Já tem conta? 
                            <a href="#" onclick="window.authModal.switchToLogin()">Fazer login</a>
                        </p>
                    </form>

                    <div id="authError" class="error-message" style="display: none;"></div>
                    <div id="authSuccess" class="success-message" style="display: none;"></div>
                </div>
            </div>
        `;

        // Adicionar ao body se não existir
        if (!document.getElementById('authModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Adicionar estilos
        this.addStyles();
    }

    addStyles() {
        const styles = `
            <style>
                .auth-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }

                .auth-modal-content {
                    background: rgba(18, 18, 28, 0.95);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 450px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: slideUp 0.3s ease;
                }

                .modal-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 32px;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .modal-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .auth-header h2 {
                    color: #667eea;
                    margin-bottom: 10px;
                    font-size: 28px;
                }

                .auth-header p {
                    color: #94a3b8;
                    font-size: 16px;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .auth-form .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .auth-form label {
                    color: #e2e8f0;
                    font-size: 14px;
                    font-weight: 500;
                }

                .auth-form input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px 16px;
                    color: white;
                    font-size: 16px;
                    transition: all 0.3s ease;
                }

                .auth-form input:focus {
                    outline: none;
                    border-color: rgba(102, 126, 234, 0.5);
                    background: rgba(255, 255, 255, 0.08);
                }

                .auth-form .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 14px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .auth-form .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
                }

                .auth-switch {
                    text-align: center;
                    color: #94a3b8;
                    font-size: 14px;
                    margin-top: 10px;
                }

                .auth-switch a {
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 600;
                }

                .auth-switch a:hover {
                    text-decoration: underline;
                }

                .error-message, .success-message {
                    padding: 12px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                    margin-top: 20px;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                }

                .success-message {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        if (!document.getElementById('authModalStyles')) {
            const styleEl = document.createElement('div');
            styleEl.id = 'authModalStyles';
            styleEl.innerHTML = styles;
            document.head.appendChild(styleEl);
        }
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister();
        });

        // Máscaras
        document.getElementById('registerCPF').addEventListener('input', (e) => {
            e.target.value = this.maskCPF(e.target.value);
        });

        document.getElementById('registerPhone').addEventListener('input', (e) => {
            e.target.value = this.maskPhone(e.target.value);
        });

        // Fechar modal ao clicar fora
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.hide();
            }
        });
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        this.showLoading(true);
        this.hideMessages();

        try {
            const result = await window.walletService.login(email, password);
            
            if (result.success) {
                this.showSuccess('Login realizado com sucesso!');
                setTimeout(() => {
                    this.hide();
                    window.location.reload(); // Recarregar para atualizar interface
                }, 1500);
            }
        } catch (error) {
            this.showError(error.message || 'Erro ao fazer login');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const cpf = document.getElementById('registerCPF').value;
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validações
        if (password !== confirmPassword) {
            this.showError('As senhas não coincidem');
            return;
        }

        if (password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        this.showLoading(true);
        this.hideMessages();

        try {
            const result = await window.walletService.register({
                name,
                email,
                cpf,
                phone,
                password
            });
            
            if (result.success) {
                this.showSuccess('Conta criada com sucesso!');
                setTimeout(() => {
                    this.hide();
                    window.location.reload();
                }, 1500);
            }
        } catch (error) {
            this.showError(error.message || 'Erro ao criar conta');
        } finally {
            this.showLoading(false);
        }
    }

    switchToLogin() {
        this.isLoginMode = true;
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('authTitle').textContent = 'Entrar na Plataforma';
        document.getElementById('authSubtitle').textContent = 'Acesse sua conta para gerenciar contratos';
        this.hideMessages();
    }

    switchToRegister() {
        this.isLoginMode = false;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('authTitle').textContent = 'Criar Conta';
        document.getElementById('authSubtitle').textContent = 'Cadastre-se para começar a usar';
        this.hideMessages();
    }

    show() {
        document.getElementById('authModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hide() {
        document.getElementById('authModal').style.display = 'none';
        document.body.style.overflow = '';
        this.hideMessages();
    }

    showError(message) {
        const errorEl = document.getElementById('authError');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    showSuccess(message) {
        const successEl = document.getElementById('authSuccess');
        successEl.textContent = message;
        successEl.style.display = 'block';
    }

    hideMessages() {
        document.getElementById('authError').style.display = 'none';
        document.getElementById('authSuccess').style.display = 'none';
    }

    showLoading(show) {
        const buttons = document.querySelectorAll('.auth-form button[type="submit"]');
        buttons.forEach(btn => {
            if (show) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner"></span> Processando...';
            } else {
                btn.disabled = false;
                btn.textContent = this.isLoginMode ? 'Entrar' : 'Criar Conta';
            }
        });
    }

    maskCPF(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    maskPhone(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    }
}

// Criar instância e funções globais
window.authModal = new AuthModalComponent();
window.showAuthModal = () => window.authModal.show();
window.hideAuthModal = () => window.authModal.hide();
