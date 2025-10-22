/**
 * Componente do Header
 */
class HeaderComponent {
    constructor() {
        this.element = null;
        this.init();
    }

    init() {
        // NÃO renderizar automaticamente - deixar para o main.js controlar
        console.log('🔧 HeaderComponent inicializado (sem auto-render)');
        this.bindEvents();
    }

    render() {
        const headerContainer = document.getElementById('header-component');
        if (headerContainer) {
            // Verificar se há carteira conectada
            const walletAddress = window.walletService?.account || window.walletService?.walletAddress;
            const isConnected = window.walletService?.isConnected;
            
            // Mostrar endereço real ou botão de conectar
            const walletDisplay = isConnected && walletAddress ? 
                `${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : 
                'Conectar Carteira';
            
            headerContainer.innerHTML = `
                <div class="header">
                    <div class="header-left">
                        <div class="deal-fi-brand">
                            <div class="brand-text">
                                <span class="deal-fi-name">Deal-Fi</span>
                                <span class="polygon-powered">Powered by Polygon</span>
                            </div>
                        </div>
                    </div>
                    <div class="wallet-status" id="walletStatus">
                        <div class="wallet-address">
                            <span class="address-label">${isConnected ? 'Carteira Conectada:' : 'Carteira:'}</span>
                            <span class="address-value">${walletDisplay}</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Re-bind events após renderizar
            this.bindEvents();
        }
    }

    bindEvents() {
        // Conectar com o serviço de carteira
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus && window.walletService) {
            walletStatus.addEventListener('click', () => {
                window.walletService.connectWallet();
            });
        }
    }
    
    /**
     * Atualiza o header quando a carteira conectar/desconectar
     */
    updateWalletStatus() {
        console.log('🔄 Atualizando status da carteira no header...');
        this.render(); // Re-renderizar com dados atualizados
    }
}

// Instância global do componente
window.headerComponent = new HeaderComponent();
