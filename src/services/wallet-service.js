/**
 * Serviço para gerenciar conexão de carteira
 */
class WalletService {
    constructor() {
        this.isConnected = false;
        this.walletAddress = null;
        this.isConnecting = false;
        this.init();
    }

    init() {
        // NÃO inicializar automaticamente - deixar para o main.js controlar
        console.log('🔧 WalletService inicializado (sem auto-init)');
        this.bindEvents();
    }

    bindEvents() {
        // Event listener será adicionado pelo componente header
        
        // Listener para evento de carteira conectada
        document.addEventListener('walletConnected', (event) => {
            console.log('🎯 EVENTO: Carteira conectada recebido!', event.detail);
            this.handlePostConnectionFlow();
        });
    }
    
    async handlePostConnectionFlow() {
        try {
            console.log('🔄 EXECUTANDO FLUXO PÓS-CONEXÃO...');
            
            // 1. Atualizar header com endereço real
            if (window.headerComponent) {
                window.headerComponent.updateWalletStatus();
                console.log('✅ Header atualizado com endereço real');
            }
            
            // 2. Verificar se há contrato real conectado
            if (window.realContractService && window.realContractService.contract) {
                console.log('✅ Contrato real encontrado!');
                
                // 3. Atualizar summary cards com dados reais
                if (window.summaryCardsComponent) {
                    window.summaryCardsComponent.render();
                    await window.summaryCardsComponent.updateWithRealData();
                    console.log('✅ Summary cards atualizados com dados reais');
                }
                
            // 4. NÃO atualizar lista de contratos na tela inicial
            // A lista só será carregada quando o usuário clicar em "Gerenciar Contratos"
            console.log('✅ Conexão completa - dados prontos para uso');
                
                // 5. Mostrar notificação de sucesso
                this.showConnectionSuccessNotification();
                
            } else {
                console.log('⚠️ Nenhum contrato real encontrado');
            }
            
        } catch (error) {
            console.error('❌ Erro no fluxo pós-conexão:', error);
        }
    }
    
    showConnectionSuccessNotification() {
        this.showToast({
            variant: 'success',
            message: '✅ Carteira conectada! Clique em "Gerenciar Contratos" para ver seus dados.',
            durationMs: 3000
        });
    }

    showToast({ variant = 'info', message, durationMs = 3500 } = {}) {
        try {
            const colors = {
                success: { bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16, 185, 129, 0.3)' },
                error: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', shadow: 'rgba(239, 68, 68, 0.3)' },
                warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(245, 158, 11, 0.3)' },
                info: { bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(59, 130, 246, 0.3)' }
            };
            const theme = colors[variant] || colors.info;

            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${theme.bg};
                color: white;
                padding: 14px 18px;
                border-radius: 12px;
                box-shadow: 0 8px 25px ${theme.shadow};
                z-index: 10050;
                font-weight: 600;
                max-width: min(520px, calc(100vw - 40px));
                line-height: 1.35;
                animation: slideInRight 0.28s ease;
            `;
            notification.textContent = message || '';

            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), durationMs);
        } catch (e) {
            console.warn('⚠️ Falha ao mostrar toast:', e);
        }
    }

    getWalletEnvironment() {
        const ua = (navigator.userAgent || '').toLowerCase();
        const isMobile = /android|iphone|ipad|ipod/.test(ua);
        const hasProvider = !!window.ethereum;
        const isMetaMask = !!window.ethereum?.isMetaMask;
        const isHttp = window.location?.protocol === 'https:' || window.location?.protocol === 'http:';
        return { isMobile, hasProvider, isMetaMask, isHttp };
    }

    getMetaMaskDownloadUrl() {
        return 'https://metamask.io/download/';
    }

    getMetaMaskMobileDeepLink() {
        const env = this.getWalletEnvironment();
        if (!env.isHttp) return null;

        // MetaMask deep link espera o dapp sem protocolo
        const dappUrl = window.location.href.replace(/^https?:\/\//i, '');
        const safeDappUrl = encodeURI(dappUrl).replace(/#/g, '%23');
        return `https://metamask.app.link/dapp/${safeDappUrl}`;
    }

    async handleConnectClick(source = 'unknown') {
        const env = this.getWalletEnvironment();

        if (this.isConnecting) {
            this.showToast({ variant: 'info', message: '⏳ Conexão já em andamento…' });
            return { success: false, error: 'CONNECTING' };
        }

        if (!env.hasProvider) {
            console.warn(`⚠️ Clique em conectar sem provider (source=${source})`);
            this.showWalletGuidanceModal(env);
            return { success: false, error: 'NO_PROVIDER' };
        }

        return await this.connectWallet();
    }

    showWalletGuidanceModal(env = this.getWalletEnvironment()) {
        try {
            const existing = document.getElementById('wallet-guidance-modal');
            if (existing) existing.remove();

            const deepLink = this.getMetaMaskMobileDeepLink();
            const downloadUrl = this.getMetaMaskDownloadUrl();

            const title = env.isMobile ? 'Use no navegador da MetaMask' : 'Instale a MetaMask para continuar';
            const description = env.isMobile
                ? 'Para usar o Deal‑Fi no celular, instale a MetaMask e abra este site no navegador interno da MetaMask.'
                : 'Para criar e gerenciar contratos escrow, você precisa da extensão MetaMask no seu navegador.';

            const extra = env.isMobile
                ? (env.isHttp
                    ? 'Dica: toque em “Abrir na MetaMask” para abrir este site direto no app.'
                    : 'Dica: abra este site via um link https (não “file://”) para usar o deep link da MetaMask.')
                : 'Depois de instalar, recarregue a página e clique em “Conectar MetaMask”.';

            const openInMetaMaskBtn = (env.isMobile && deepLink)
                ? `<a class="btn-primary" href="${deepLink}" target="_blank" rel="noopener">Abrir na MetaMask</a>`
                : '';

            const modal = document.createElement('div');
            modal.id = 'wallet-guidance-modal';
            modal.className = 'wallet-guidance-modal-overlay';
            modal.innerHTML = `
                <div class="wallet-guidance-modal-content" role="dialog" aria-modal="true" aria-label="Guia MetaMask">
                    <div class="wallet-guidance-modal-header">
                        <h2>🦊 ${title}</h2>
                        <button class="wallet-guidance-close-btn" aria-label="Fechar">×</button>
                    </div>
                    <div class="wallet-guidance-modal-body">
                        <p>${description}</p>
                        <p class="wallet-guidance-extra">${extra}</p>
                    </div>
                    <div class="wallet-guidance-modal-footer">
                        <div class="wallet-guidance-actions">
                            ${openInMetaMaskBtn}
                            <a class="btn-secondary" href="${downloadUrl}" target="_blank" rel="noopener">Baixar MetaMask</a>
                            <button class="btn-tertiary" data-action="close">Entendi</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const close = () => modal.remove();
            modal.addEventListener('click', (e) => {
                if (e.target === modal) close();
                if (e.target?.dataset?.action === 'close') close();
            });
            modal.querySelector('.wallet-guidance-close-btn')?.addEventListener('click', close);

            this.showToast({
                variant: 'warning',
                message: env.isMobile
                    ? '📱 No celular: instale a MetaMask e use o navegador do app.'
                    : '🦊 MetaMask não detectada. Instale a extensão para continuar.'
            });
        } catch (e) {
            console.error('❌ Falha ao abrir modal de guia MetaMask:', e);
            this.showToast({ variant: 'warning', message: '🦊 MetaMask não detectada. Instale para continuar.' });
        }
    }
    

    async connectWallet() {
        try {
            console.log('🔗 INICIANDO CONEXÃO COM METAMASK...');

            if (this.isConnecting) {
                return { success: false, error: 'CONNECTING' };
            }
            this.isConnecting = true;
            this.updateWalletStatus();
            
            if (!window.ethereum) {
                this.showWalletGuidanceModal(this.getWalletEnvironment());
                return { success: false, error: 'NO_PROVIDER' };
            }

            console.log('🔍 MetaMask detectado, solicitando conexão...');
            console.log('⏳ Aguardando resposta do MetaMask...');
            
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            if (!account) {
                this.showToast({ variant: 'error', message: '❌ Nenhuma conta retornada pela MetaMask.' });
                return { success: false, error: 'NO_ACCOUNT' };
            }

            console.log('✅ MetaMask respondeu com conta:', account);
            console.log('🔧 Configurando provider e signer...');

            if (!window.ethers?.providers?.Web3Provider) {
                this.showToast({ variant: 'error', message: '❌ Dependência ethers.js não carregada no frontend.' });
                return { success: false, error: 'ETHERS_NOT_LOADED' };
            }

            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();

            // Validar rede (Polygon Mainnet)
            const network = await this.provider.getNetwork();
            const polygonChainId = 137;
            if (network?.chainId !== polygonChainId) {
                console.warn(`⚠️ Rede incorreta: chainId=${network?.chainId}. Esperado=${polygonChainId}`);
                const switched = await this.trySwitchToPolygon();
                if (!switched) {
                    this.showToast({
                        variant: 'warning',
                        message: '⚠️ Troque para a rede Polygon na MetaMask e tente novamente.'
                    });
                    return { success: false, error: 'WRONG_NETWORK' };
                }
            }

            this.account = account;
            this.isConnected = true;
            this.walletAddress = account;

            console.log('✅ Carteira conectada:', account);
            console.log('🔄 Atualizando status da carteira...');
            
            this.updateWalletStatus();
            
            console.log('🔗 Conectando com contrato real...');
            // Conectar com contrato real
            if (window.realContractService) {
                await window.realContractService.init();
                console.log('✅ Conectado com contrato real!');
            }

            console.log('📊 Carregando dados reais do usuário...');
            // Carregar dados reais do usuário conectado
            await this.loadUserRealData();
            
            console.log('🎉 CONEXÃO COMPLETA!');
            console.log('🔄 INICIANDO FLUXO PÓS-CONEXÃO...');
            
            // Disparar evento para atualizar interface
            document.dispatchEvent(new CustomEvent('walletConnected', { 
                detail: { 
                    address: this.walletAddress,
                    isConnected: this.isConnected
                } 
            }));
            return { success: true, address: this.walletAddress };
        } catch (error) {
            const code = error?.code;
            const message = (error?.message || '').toString();

            if (code === 4001) {
                this.showToast({ variant: 'info', message: 'Conexão cancelada no MetaMask.' });
                return { success: false, error: 'USER_REJECTED' };
            }

            console.error('❌ Erro ao conectar carteira:', error);
            this.showToast({
                variant: 'error',
                message: message ? `❌ Falha ao conectar: ${message}` : '❌ Falha ao conectar a carteira.'
            });
            return { success: false, error: message || 'CONNECT_FAILED' };
        } finally {
            this.isConnecting = false;
            this.updateWalletStatus();
        }
    }

    async trySwitchToPolygon() {
        try {
            if (!window.ethereum?.request) return false;

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x89' }]
            });

            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            return true;
        } catch (error) {
            if (error?.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x89',
                            chainName: 'Polygon Mainnet',
                            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                            rpcUrls: ['https://polygon-rpc.com/'],
                            blockExplorerUrls: ['https://polygonscan.com/']
                        }]
                    });
                    this.provider = new ethers.providers.Web3Provider(window.ethereum);
                    return true;
                } catch (e) {
                    console.warn('⚠️ Falha ao adicionar Polygon na MetaMask:', e);
                    return false;
                }
            }

            if (error?.code === 4001) return false;

            console.warn('⚠️ Falha ao trocar para Polygon:', error);
            return false;
        }
    }

    async loadUserRealData() {
        try {
            console.log('🔄 Carregando dados reais do usuário...');
            
            // Carregar dados do contrato real
            if (window.realContractService && window.realContractService.contract) {
                const contractData = await window.realContractService.getContractDetails();
                console.log('📊 Dados do contrato carregados:', contractData);
                
                // Atualizar interface com dados reais
                this.updateInterfaceWithRealData(contractData);
            }
            
            // Atualizar summary cards com dados reais
            if (window.summaryCardsComponent) {
                // Garantir que os cards sejam renderizados primeiro
                window.summaryCardsComponent.render();
                await window.summaryCardsComponent.updateWithRealData();
            }
            
            // Lista de contratos agora é gerenciada pelo state-based-ui-component
            // Não precisa mais renderizar aqui
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados reais:', error);
        }
    }

    updateInterfaceWithRealData(contractData) {
        // Disparar evento para outros componentes atualizarem
        document.dispatchEvent(new CustomEvent('realDataLoaded', { 
            detail: { 
                contractData,
                userAddress: this.account 
            } 
        }));
    }

    disconnectWallet() {
        this.isConnected = false;
        this.walletAddress = null;
        this.updateWalletStatus();
    }

    updateWalletStatus() {
        // Atualizar header component se disponível
        if (window.headerComponent) {
            window.headerComponent.updateWalletStatus();
        }
        
        // Manter compatibilidade com código antigo
        const walletStatus = document.getElementById('walletStatus');
        if (walletStatus) {
            if (this.isConnected) {
                walletStatus.textContent = `🔗 ${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(38)} (Conectado)`;
                walletStatus.style.background = 'rgba(16, 185, 129, 0.1)';
                walletStatus.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                walletStatus.style.color = '#10b981';
            } else if (this.isConnecting) {
                walletStatus.textContent = '⏳ Conectando… (MetaMask)';
                walletStatus.style.background = 'rgba(59, 130, 246, 0.1)';
                walletStatus.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                walletStatus.style.color = '#2563eb';
            } else {
                walletStatus.textContent = '🔗 Conectar Carteira';
                walletStatus.style.background = 'rgba(102, 126, 234, 0.1)';
                walletStatus.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                walletStatus.style.color = '#667eea';
            }
        }
    }

    getWalletInfo() {
        return {
            isConnected: this.isConnected,
            address: this.walletAddress
        };
    }
}

// Instância global do serviço
window.walletService = new WalletService();
