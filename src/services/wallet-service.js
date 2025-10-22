/**
 * Serviço para gerenciar conexão de carteira
 */
class WalletService {
    constructor() {
        this.isConnected = false;
        this.walletAddress = null;
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
                this.showNoContractNotification();
            }
            
        } catch (error) {
            console.error('❌ Erro no fluxo pós-conexão:', error);
        }
    }
    
    showConnectionSuccessNotification() {
        // Criar notificação de sucesso
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = '✅ Carteira conectada! Clique em "Gerenciar Contratos" para ver seus dados.';
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    showNoContractNotification() {
        // Criar notificação de aviso
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
            z-index: 1000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = '⚠️ Carteira conectada, mas nenhum contrato encontrado';
        
        document.body.appendChild(notification);
        
        // Remover após 4 segundos
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    async connectWallet() {
        try {
            console.log('🔗 INICIANDO CONEXÃO COM METAMASK...');
            
            if (!window.ethereum) {
                throw new Error('MetaMask não detectado');
            }

            console.log('🔍 MetaMask detectado, solicitando conexão...');
            console.log('⏳ Aguardando resposta do MetaMask...');
            
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];

            console.log('✅ MetaMask respondeu com conta:', account);
            console.log('🔧 Configurando provider e signer...');

            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
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
            console.error('❌ Erro ao conectar carteira:', error);
            return { success: false, error: error.message };
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
            
            // Atualizar lista de contratos com dados reais
            if (window.contractsListComponent) {
                // Garantir que a lista seja renderizada primeiro
                window.contractsListComponent.render();
                await window.contractsListComponent.loadRealContracts();
            }
            
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
