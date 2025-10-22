/**
 * Componente de Modal de Pagamento PIX
 */
class PixPaymentComponent {
    constructor() {
        this.paymentId = null;
        this.checkInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
    }

    render() {
        const modalHTML = `
            <div id="pixModal" class="pix-modal" style="display: none;">
                <div class="pix-modal-content">
                    <button class="modal-close" onclick="window.pixPayment.hide()">×</button>
                    
                    <div class="pix-header">
                        <h2>💳 Pagamento via PIX</h2>
                        <p id="pixDescription">Escaneie o QR Code ou copie o código PIX</p>
                    </div>

                    <div class="pix-amount">
                        <span class="amount-label">Valor:</span>
                        <span class="amount-value" id="pixAmount">R$ 0,00</span>
                    </div>

                    <div class="pix-qrcode" id="pixQRCode">
                        <!-- QR Code será inserido aqui -->
                    </div>

                    <div class="pix-code-section">
                        <label>Código PIX (copiar e colar)</label>
                        <div class="pix-code-container">
                            <input type="text" id="pixCode" readonly>
                            <button class="copy-btn" onclick="window.pixPayment.copyCode()">
                                📋 Copiar
                            </button>
                        </div>
                    </div>

                    <div class="pix-instructions">
                        <h3>📱 Como pagar:</h3>
                        <ol>
                            <li>Abra o app do seu banco</li>
                            <li>Escolha pagar com PIX</li>
                            <li>Escaneie o QR Code ou cole o código</li>
                            <li>Confirme o pagamento</li>
                            <li>Aguarde a confirmação automática</li>
                        </ol>
                    </div>

                    <div class="pix-status" id="pixStatus">
                        <div class="status-waiting">
                            <div class="spinner"></div>
                            <span>Aguardando pagamento...</span>
                        </div>
                    </div>

                    <div class="pix-timer">
                        <span>⏱️ Expira em: <span id="pixTimer">30:00</span></span>
                    </div>

                    <button class="btn-secondary" onclick="window.pixPayment.hide()">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        if (!document.getElementById('pixModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        this.addStyles();
    }

    addStyles() {
        const styles = `
            <style>
                .pix-modal {
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

                .pix-modal-content {
                    background: rgba(18, 18, 28, 0.95);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: slideUp 0.3s ease;
                }

                .pix-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .pix-header h2 {
                    color: #667eea;
                    margin-bottom: 10px;
                    font-size: 28px;
                }

                .pix-header p {
                    color: #94a3b8;
                    font-size: 16px;
                }

                .pix-amount {
                    background: rgba(102, 126, 234, 0.1);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 30px;
                }

                .amount-label {
                    color: #94a3b8;
                    font-size: 14px;
                    display: block;
                    margin-bottom: 5px;
                }

                .amount-value {
                    color: #10b981;
                    font-size: 36px;
                    font-weight: bold;
                }

                .pix-qrcode {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 300px;
                }

                .pix-qrcode img {
                    max-width: 100%;
                    height: auto;
                }

                .pix-code-section {
                    margin-bottom: 20px;
                }

                .pix-code-section label {
                    color: #e2e8f0;
                    font-size: 14px;
                    font-weight: 500;
                    display: block;
                    margin-bottom: 8px;
                }

                .pix-code-container {
                    display: flex;
                    gap: 10px;
                }

                .pix-code-container input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px;
                    color: white;
                    font-size: 14px;
                    font-family: monospace;
                }

                .copy-btn {
                    background: rgba(102, 126, 234, 0.2);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    color: #667eea;
                    padding: 12px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-weight: 600;
                }

                .copy-btn:hover {
                    background: rgba(102, 126, 234, 0.3);
                }

                .copy-btn.copied {
                    background: rgba(16, 185, 129, 0.2);
                    border-color: rgba(16, 185, 129, 0.3);
                    color: #10b981;
                }

                .pix-instructions {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .pix-instructions h3 {
                    color: #e2e8f0;
                    font-size: 16px;
                    margin-bottom: 15px;
                }

                .pix-instructions ol {
                    padding-left: 20px;
                    color: #94a3b8;
                }

                .pix-instructions li {
                    margin-bottom: 8px;
                }

                .pix-status {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .status-waiting {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    color: #f59e0b;
                }

                .status-success {
                    color: #10b981;
                    font-size: 18px;
                    font-weight: 600;
                }

                .status-error {
                    color: #ef4444;
                }

                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(245, 158, 11, 0.3);
                    border-top-color: #f59e0b;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                .pix-timer {
                    text-align: center;
                    color: #94a3b8;
                    font-size: 14px;
                    margin-bottom: 20px;
                }

                .pix-timer span {
                    color: #f59e0b;
                    font-weight: 600;
                }

                .btn-secondary {
                    width: 100%;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                    padding: 14px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .btn-secondary:hover {
                    background: rgba(239, 68, 68, 0.2);
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        if (!document.getElementById('pixModalStyles')) {
            const styleEl = document.createElement('div');
            styleEl.id = 'pixModalStyles';
            styleEl.innerHTML = styles;
            document.head.appendChild(styleEl);
        }
    }

    bindEvents() {
        document.getElementById('pixModal').addEventListener('click', (e) => {
            if (e.target.id === 'pixModal') {
                this.hide();
            }
        });
    }

    async show(paymentData) {
        const { 
            paymentId, 
            pixCode, 
            qrCodeBase64, 
            amount, 
            expiresAt,
            description = 'Pagamento SmartContracts Brasil'
        } = paymentData;

        this.paymentId = paymentId;

        // Preencher dados
        document.getElementById('pixDescription').textContent = description;
        document.getElementById('pixAmount').textContent = `R$ ${amount}`;
        document.getElementById('pixCode').value = pixCode;
        
        // QR Code
        document.getElementById('pixQRCode').innerHTML = `
            <img src="${qrCodeBase64}" alt="QR Code PIX">
        `;

        // Mostrar modal
        document.getElementById('pixModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Iniciar timer
        this.startTimer(expiresAt);

        // Iniciar verificação de status
        this.startStatusCheck();
    }

    hide() {
        document.getElementById('pixModal').style.display = 'none';
        document.body.style.overflow = '';
        
        // Parar verificações
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    copyCode() {
        const codeInput = document.getElementById('pixCode');
        codeInput.select();
        document.execCommand('copy');

        const copyBtn = document.querySelector('.copy-btn');
        copyBtn.classList.add('copied');
        copyBtn.textContent = '✓ Copiado!';

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.textContent = '📋 Copiar';
        }, 3000);
    }

    startTimer(expiresAt) {
        const updateTimer = () => {
            const now = new Date();
            const expires = new Date(expiresAt);
            const diff = expires - now;

            if (diff <= 0) {
                document.getElementById('pixTimer').textContent = '00:00';
                this.showExpired();
                clearInterval(this.timerInterval);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            
            document.getElementById('pixTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        updateTimer();
        this.timerInterval = setInterval(updateTimer, 1000);
    }

    async startStatusCheck() {
        const checkStatus = async () => {
            try {
                const result = await window.walletService.checkPaymentStatus(this.paymentId);
                
                if (result.status === 'confirmed') {
                    this.showSuccess();
                    clearInterval(this.checkInterval);
                    
                    // Redirecionar ou atualizar após sucesso
                    setTimeout(() => {
                        this.hide();
                        window.location.reload();
                    }, 3000);
                } else if (result.status === 'expired') {
                    this.showExpired();
                    clearInterval(this.checkInterval);
                }
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        };

        // Verificar a cada 5 segundos
        this.checkInterval = setInterval(checkStatus, 5000);
    }

    showSuccess() {
        document.getElementById('pixStatus').innerHTML = `
            <div class="status-success">
                ✅ Pagamento confirmado com sucesso!
            </div>
        `;
    }

    showExpired() {
        document.getElementById('pixStatus').innerHTML = `
            <div class="status-error">
                ⏰ Pagamento expirado
            </div>
        `;
    }
}

// Criar instância global
window.pixPayment = new PixPaymentComponent();
