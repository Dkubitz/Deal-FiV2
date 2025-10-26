/**
 * Serviço de Polling para Atualização Automática
 * Monitora mudanças no contrato na blockchain
 */
class ContractPollingService {
    constructor() {
        this.pollingInterval = null;
        this.pollingFrequency = 5000; // 5 segundos
        this.isPolling = false;
        this.lastState = null;
        this.consecutiveErrors = 0;
        this.maxErrors = 3;
    }
    
    /**
     * Inicia o polling do contrato
     */
    startPolling() {
        if (this.isPolling) {
            console.log('⚠️ Polling já está ativo');
            return;
        }
        
        console.log('🔄 Iniciando polling de atualizações (a cada 5 segundos)...');
        this.isPolling = true;
        this.consecutiveErrors = 0;
        
        // Mostrar indicador visual
        this.showPollingIndicator();
        
        // Primeira verificação imediata
        this.checkForUpdates();
        
        // Verificar periodicamente
        this.pollingInterval = setInterval(() => {
            this.checkForUpdates();
        }, this.pollingFrequency);
    }
    
    /**
     * Para o polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            this.isPolling = false;
            
            // Remover indicador visual
            this.hidePollingIndicator();
            
            console.log('⏹️ Polling interrompido');
        }
    }
    
    /**
     * Verifica se houve mudanças no contrato
     */
    async checkForUpdates() {
        try {
            // Só fazer polling se:
            // 1. Há contrato conectado
            // 2. Está na página de gerenciamento
            // 3. Carteira está conectada
            if (!window.realContractService?.contract || 
                window.navigationService?.currentPage !== 'manage' ||
                !window.walletService?.isConnected) {
                return;
            }
            
            // Obter dados atuais do contrato
            const contractData = await window.realContractService.getContractDetails();
            
            // Criar hash do estado para comparação
            const currentStateHash = this.createStateHash(contractData);
            
            // Comparar com último estado
            if (this.lastState && this.lastState !== currentStateHash) {
                console.log('🔔 Mudança detectada no contrato! Atualizando interface...');
                
                // Atualizar interface
                await this.updateInterface(contractData);
                
                // Mostrar notificação
                this.showUpdateNotification();
            }
            
            // Salvar estado atual
            this.lastState = currentStateHash;
            
            // Resetar contador de erros
            this.consecutiveErrors = 0;
            
        } catch (error) {
            this.consecutiveErrors++;
            console.warn(`⚠️ Erro no polling (${this.consecutiveErrors}/${this.maxErrors}):`, error.message);
            
            // Se muitos erros consecutivos, parar polling
            if (this.consecutiveErrors >= this.maxErrors) {
                console.error('❌ Muitos erros consecutivos. Parando polling.');
                this.stopPolling();
            }
        }
    }
    
    /**
     * Cria hash do estado para comparação
     */
    createStateHash(contractData) {
        const relevantData = {
            platformFeePaid: contractData.platformFeePaid,
            confirmedPayer: contractData.confirmedPayer,
            confirmedPayee: contractData.confirmedPayee,
            deposited: contractData.deposited,
            amount: contractData.amount,
            remainingAmount: contractData.remainingAmount,
            milestonesReleased: contractData.milestoneInfo ? 
                contractData.milestoneInfo.filter(m => m.released).length : 0,
            settlementAmount: contractData.settlementAmount,
            settlementApproved: contractData.settlementApproved,
            cancelApprovedPayer: contractData.cancelApprovedPayer,
            cancelApprovedPayee: contractData.cancelApprovedPayee
        };
        
        return JSON.stringify(relevantData);
    }
    
    /**
     * Atualiza a interface com novos dados
     */
    async updateInterface(contractData) {
        try {
            // Atualizar UI baseada em estado
            if (window.navigationService?.currentPage === 'manage') {
                const userAddress = window.walletService?.account || '';
                
                // Determinar novo estado
                const state = window.contractStateService.determineState(
                    contractData,
                    userAddress
                );
                
                console.log('🔄 Novo estado:', state.id);
                
                // Renderizar nova interface
                window.stateBasedUIComponent.render(state, contractData);
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar interface:', error);
        }
    }
    
    /**
     * Mostra notificação de atualização
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 20px 30px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            z-index: 10000;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 10px 30px rgba(16,185,129,0.3);
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = '🔄 Interface atualizada!';
        
        document.body.appendChild(notification);
        
        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Reseta o estado (útil ao trocar de contrato)
     */
    resetState() {
        this.lastState = null;
        this.consecutiveErrors = 0;
        console.log('🔄 Estado do polling resetado');
    }
    
    /**
     * Mostra indicador visual de polling ativo
     */
    showPollingIndicator() {
        // Remover indicador anterior se existir
        this.hidePollingIndicator();
        
        const indicator = document.createElement('div');
        indicator.id = 'polling-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 13px;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(102,126,234,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        indicator.innerHTML = `
            <span style="
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                animation: pulse 2s infinite;
            "></span>
            Sincronizando...
        `;
        
        // Adicionar animação de pulso
        if (!document.getElementById('pulse-animation')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
    }
    
    /**
     * Remove indicador visual
     */
    hidePollingIndicator() {
        const indicator = document.getElementById('polling-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Instância global
window.contractPollingService = new ContractPollingService();

// Parar polling quando sair da página
window.addEventListener('beforeunload', () => {
    if (window.contractPollingService) {
        window.contractPollingService.stopPolling();
    }
});

// Parar polling quando mudar de aba
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('🔕 Página oculta - pausando polling');
        if (window.contractPollingService?.isPolling) {
            window.contractPollingService.stopPolling();
        }
    } else {
        console.log('👁️ Página visível - retomando polling');
        if (window.navigationService?.currentPage === 'manage' && window.realContractService?.contract) {
            window.contractPollingService.startPolling();
        }
    }
});

