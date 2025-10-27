/**
 * Componente de Interface Baseado em Estados
 * Renderiza a UI apropriada para cada estado do contrato
 */
class StateBasedUIComponent {
    constructor() {
        this.currentState = null;
        this.contractData = null;
    }
    
    /**
     * Renderiza a interface baseado no estado atual
     * @param {Object} state - Estado retornado pelo ContractStateService
     * @param {Object} contractData - Dados completos do contrato
     */
    render(state, contractData) {
        this.currentState = state;
        this.contractData = contractData;
        
        const container = document.getElementById('state-based-container');
        if (!container) {
            console.warn('Container state-based-container não encontrado');
            return;
        }
        
        // Renderizar baseado na fase
        container.innerHTML = this.renderStateCard(state, contractData);
        
        // Bind events para botões de ação
        this.bindActionButtons(state);
    }
    
    /**
     * Renderiza o card de estado usando padrão Aurora Card
     */
    renderStateCard(state, contractData) {
        const phaseColor = this.getPhaseColor(state.phase);
        
        return `
            <!-- Card Principal com Efeito Aurora -->
            <div class="contract-card-real" style="
                width: 100%;
                max-width: 1100px;
                position: relative;
                padding: 35px;
                box-sizing: border-box;
                border-radius: 28px;
                background-color: rgba(255, 255, 255, 0.2);
                border: 2px solid ${phaseColor};
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                overflow: visible;
                margin: 0 auto;
            ">
                <!-- Fundo Aurora Rotativo -->
                <div class="aurora-background"></div>
                
                <!-- Conteúdo do Card -->
                <div style="position: relative; z-index: 2;">
                    <!-- Cabeçalho com Status -->
                    <div class="contract-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 25px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
                        gap: 20px;
                    ">
                        <h3 style="color: #1c1c1e; font-size: 20px; font-weight: 700; margin: 0;">
                            ${state.title}
                        </h3>
                        ${this.renderStatusBadge(state)}
                    </div>
                    
                    <!-- Descrição -->
                    <p style="color: #555; font-size: 16px; margin-bottom: 25px; line-height: 1.6;">
                        ${state.description}
                    </p>
                    
                    <!-- Informações do Contrato (Grid 2x2) -->
                    ${this.renderContractInfo(contractData)}
                    
                    <!-- Próximo Marco (se ativo) -->
                    ${state.phase === 'ACTIVE' ? this.renderMilestonesInfo(contractData, state) : ''}
                    
                    <!-- Informações de Settlement (se houver) -->
                    ${this.renderSettlementInfo(contractData)}
                    
                    <!-- Informações de Cancelamento (se houver) -->
                    ${this.renderCancelInfo(contractData)}
                    
                    <!-- Papel do Usuário -->
                    <div style="
                        background: linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%);
                        border: 2px solid rgba(102,126,234,0.3);
                        border-radius: 12px;
                        padding: 15px 20px;
                        margin: 25px 0;
                        text-align: center;
                    ">
                        <strong style="color: #667eea; font-size: 13px;">
                            Seu Papel: ${state.userRole === 'PAYER' ? 'Pagador (Payer)' : state.userRole === 'PAYEE' ? 'Recebedor (Payee)' : 'Observador'}
                        </strong>
                    </div>
                    
                    <!-- Ações Disponíveis -->
                    ${this.renderActions(state)}
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza informações do contrato
     */
    renderContractInfo(contractData) {
        if (!contractData) return '';
        
        return `
            <div class="contract-info" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 25px;
            ">
                <div class="info-row" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <span class="label" style="color: rgba(28, 28, 30, 0.7); font-size: 13px; font-weight: 600;">Valor Total:</span>
                    <span class="value" style="color: #1c1c1e; font-size: 16px; font-weight: 700;">${contractData.amount} USDC</span>
                </div>
                
                <div class="info-row" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <span class="label" style="color: rgba(28, 28, 30, 0.7); font-size: 13px; font-weight: 600;">Saldo Restante:</span>
                    <span class="value" style="color: #1c1c1e; font-size: 16px; font-weight: 700;">${contractData.remainingAmount || '0'} USDC</span>
                </div>
                
                <div class="info-row" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <span class="label" style="color: rgba(28, 28, 30, 0.7); font-size: 13px; font-weight: 600;">Total de Marcos:</span>
                    <span class="value" style="color: #1c1c1e; font-size: 16px; font-weight: 700;">${contractData.totalMilestones}</span>
                </div>
                
                <div class="info-row" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    <span class="label" style="color: rgba(28, 28, 30, 0.7); font-size: 13px; font-weight: 600;">Prazo:</span>
                    <span class="value" style="color: #1c1c1e; font-size: 16px; font-weight: 700;">
                        ${contractData.deadline ? new Date(contractData.deadline).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza informações dos marcos (próximo + progresso visual)
     */
    renderMilestonesInfo(contractData, state) {
        if (!contractData.milestoneInfo || contractData.milestoneInfo.length === 0) {
            return '';
        }
        
        const releasedCount = contractData.milestoneInfo.filter(m => m.released).length;
        const totalMilestones = contractData.milestoneInfo.length;
        const progressPercent = (releasedCount / totalMilestones) * 100;
        
        // Encontrar próximo marco a liberar
        const nextMilestoneIndex = contractData.milestoneInfo.findIndex(m => !m.released);
        
        // Se todos marcos liberados
        if (nextMilestoneIndex === -1) {
            return `
                <div style="
                    background: linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.1) 100%);
                    border: 2px solid rgba(16,185,129,0.3);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                ">
                    <h3 style="color: #10b981; margin: 0 0 10px 0;">✅ Todos os Marcos Foram Liberados!</h3>
                    <div style="font-size: 24px; font-weight: 700; color: #10b981;">${releasedCount}/${totalMilestones}</div>
                </div>
            `;
        }
        
        const nextAmount = contractData.milestoneAmounts[nextMilestoneIndex];
        const nextPercentage = contractData.milestonePercentages[nextMilestoneIndex];
        
        return `
            <div style="
                background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
                border: 2px solid rgba(102,126,234,0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="color: white; margin: 0; font-size: 16px; font-weight: 700;">
                        <span class="pulse-dot"></span>Progresso dos Marcos
                    </h3>
                    <span style="
                        background: #667eea20;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                        border: 1px solid #667eea;
                    ">
                        ${releasedCount}/${totalMilestones} Concluídos
                    </span>
                </div>
                
                <!-- Barra de Progresso -->
                <div style="
                    background: rgba(255,255,255,0.3);
                    border-radius: 10px;
                    height: 8px;
                    margin-bottom: 15px;
                    overflow: hidden;
                ">
                    <div style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        height: 100%;
                        width: ${progressPercent}%;
                        transition: width 0.5s ease;
                        border-radius: 10px;
                    "></div>
                </div>
                
                <!-- Próximo Marco -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: rgba(255,255,255,0.3); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: #888; margin-bottom: 4px;">Próximo Marco</div>
                        <div style="font-size: 18px; font-weight: 700; color: #667eea;">Marco ${nextMilestoneIndex + 1}</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.3); padding: 12px; border-radius: 8px;">
                        <div style="font-size: 11px; color: #888; margin-bottom: 4px;">Valor a Liberar</div>
                        <div style="font-size: 18px; font-weight: 700; color: #667eea;">${nextAmount} USDC</div>
                        <div style="font-size: 10px; color: #888;">${nextPercentage}% do total</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Renderiza botões de ação
     */
    renderActions(state) {
        if (!state.availableActions || state.availableActions.length === 0) {
            return '';
        }
        
        const buttons = state.availableActions.map(action => {
            const buttonStyle = this.getButtonStyle(action.type);
            
            // Label especial para release milestone
            let label = action.label;
            if (action.id === 'releaseMilestone' && action.milestone !== undefined) {
                label = `<span class="pulse-dot"></span>Liberar Marco ${action.milestone + 1}`;
            } else if (action.id === 'approveCancel') {
                label = `<span class="pulse-dot"></span>Aprovar Cancelamento`;
            } else if (action.id === 'proposeSettlement') {
                label = `<span class="pulse-dot"></span>Propor Acordo`;
            }
            
            return `
                <button 
                    class="action-button" 
                    data-action-id="${action.id}"
                    ${action.milestone !== undefined ? `data-milestone="${action.milestone}"` : ''}
                    style="${buttonStyle}"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(102,126,234,0.3)';"
                    onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(102,126,234,0.2)';"
                >
                    ${label}
                </button>
            `;
        }).join('');
        
        return `
            <div class="contract-actions" style="
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                justify-content: center;
                padding-top: 25px;
                margin-top: 25px;
                border-top: 1px solid rgba(255, 255, 255, 0.3);
            ">
                ${buttons}
            </div>
        `;
    }
    
    /**
     * Bind eventos nos botões de ação
     */
    bindActionButtons(state) {
        const buttons = document.querySelectorAll('.action-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const actionId = button.dataset.actionId;
                const milestone = button.dataset.milestone;
                this.handleAction(actionId, milestone, state);
            });
        });
    }
    
    /**
     * Mostra notificação de execução
     */
    showNotification(message, type = 'info') {
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
            animation: slideInRight 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        `;
        
        const colors = {
            info: 'background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;',
            success: 'background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;',
            error: 'background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;',
            warning: 'background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;'
        };
        
        notification.style.cssText += colors[type] || colors.info;
        notification.innerHTML = message;
        
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    /**
     * Manipula ações dos botões
     */
    async handleAction(actionId, milestone, state) {
        console.log(`🎯 Ação disparada: ${actionId}`, { milestone, state });
        
        try {
            // Mostrar notificação de início apenas para ações que precisam da MetaMask
            if (actionId !== 'viewDetails') {
                this.showNotification('⏳ Executando ação... Confirme na MetaMask', 'info');
            }
            switch (actionId) {
                case 'payPlatformFee':
                    await window.realContractService.payPlatformFee();
                    break;
                case 'confirmPayer':
                    await window.realContractService.confirmPayer();
                    break;
                case 'confirmPayee':
                    await window.realContractService.confirmPayee();
                    break;
                case 'deposit':
                    // Contrato dinâmico - perguntar valor ao usuário
                    const depositValue = prompt('Digite o valor em USDC para depositar (ex: 100):\n\n⚠️ Você precisará confirmar 2 transações:\n1. Approve (autorizar USDC)\n2. Deposit (transferir USDC)');
                    
                    if (!depositValue || isNaN(depositValue)) {
                        throw new Error('Valor inválido. Digite um número válido.');
                    }
                    
                    const amount = parseFloat(depositValue);
                    
                    if (amount <= 0) {
                        throw new Error('O valor do depósito deve ser maior que 0 USDC.');
                    }
                    
                    console.log(`💰 Depositando ${amount} USDC...`);
                    this.showNotification('⏳ Prepare-se: 2 transações na MetaMask (Approve + Deposit)', 'info');
                    await window.realContractService.deposit(amount);
                    break;
                case 'releaseMilestone':
                    await window.realContractService.releaseMilestone(parseInt(milestone));
                    console.log(`✅ Ação ${actionId} executada com sucesso!`);
                    this.showNotification('✅ Transação enviada! Aguardando confirmação...', 'success');
                    break;
                case 'refund':
                    if (confirm('Tem certeza que deseja executar refund? Isso recuperará 100% do valor depositado.')) {
                        await window.realContractService.refund();
                        console.log(`✅ Ação ${actionId} executada com sucesso!`);
                        this.showNotification('✅ Transação enviada! Aguardando confirmação...', 'success');
                    }
                    break;
                case 'approveCancel':
                    await window.realContractService.approveCancel();
                    console.log(`✅ Ação ${actionId} executada com sucesso!`);
                    this.showNotification('✅ Transação enviada! Aguardando confirmação...', 'success');
                    break;
                case 'proposeSettlement':
                    const settlementAmount = prompt('Digite o valor do settlement (USDC):');
                    if (settlementAmount && !isNaN(settlementAmount)) {
                        await window.realContractService.proposeSettlement(parseFloat(settlementAmount));
                        console.log(`✅ Ação ${actionId} executada com sucesso!`);
                        this.showNotification('✅ Transação enviada! Aguardando confirmação...', 'success');
                    }
                    break;
                case 'approveSettlement':
                    await window.realContractService.approveSettlement();
                    console.log(`✅ Ação ${actionId} executada com sucesso!`);
                    this.showNotification('✅ Transação enviada! Aguardando confirmação...', 'success');
                    break;
                case 'claimAfterDeadline':
                    await window.realContractService.claimAfterDeadline();
                    console.log(`✅ Ação ${actionId} executada com sucesso!`);
                    this.showNotification('✅ Transação enviada! Aguardando confirmação...', 'success');
                    break;
                case 'viewDetails':
                    this.showDetailedView();
                    break;
                default:
                    console.warn('Ação não mapeada:', actionId);
            }
            
            // Forçar atualização imediata apenas para ações que fazem transações
            if (actionId !== 'viewDetails') {
                console.log('⏳ Aguardando propagação da transação (2 segundos)...');
                setTimeout(async () => {
                    if (window.contractPollingService) {
                        // Resetar estado para forçar detecção de mudança
                        window.contractPollingService.resetState();
                        // Verificar imediatamente
                        await window.contractPollingService.checkForUpdates();
                    }
                }, 2000);
            }
            
        } catch (error) {
            console.error(`❌ Erro ao executar ação ${actionId}:`, error);
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    }
    
    /**
     * Mostra visão detalhada
     */
    showDetailedView() {
        alert('Detalhes completos do contrato:\n\n' + JSON.stringify(this.contractData, null, 2));
    }
    
    /**
     * Placeholders - Serão sobrescritos pelo helpers.js
     */
    renderSettlementInfo(contractData) {
        return ''; // Implementado em helpers.js
    }
    
    renderCancelInfo(contractData) {
        return ''; // Implementado em helpers.js
    }
    
    /**
     * Auxiliares de estilo
     */
    renderStatusBadge(state) {
        const phaseColor = this.getPhaseColor(state.phase);
        const phaseText = this.getPhaseText(state.phase);
        
        return `
            <span class="status-badge" style="
                background: ${phaseColor}20;
                color: ${phaseColor};
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 1px solid ${phaseColor};
            ">
                ${phaseText}
            </span>
        `;
    }
    
    getPhaseColor(phase) {
        const colors = {
            'PRE_DEPOSIT': '#f59e0b',
            'ACTIVE': '#10b981',
            'SPECIAL_PROCESS': '#667eea',
            'CLOSED': '#6b7280'
        };
        return colors[phase] || '#6b7280';
    }
    
    getPhaseText(phase) {
        const texts = {
            'PRE_DEPOSIT': 'Pré-Depósito',
            'ACTIVE': 'Ativo',
            'SPECIAL_PROCESS': 'Em Processo',
            'CLOSED': 'Encerrado'
        };
        return texts[phase] || phase;
    }
    
    getButtonStyle(type) {
        const styles = {
            primary: `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102,126,234,0.3);
            `,
            danger: `
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(239,68,68,0.3);
            `,
            warning: `
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(245,158,11,0.3);
            `,
            info: `
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(59,130,246,0.3);
            `,
            secondary: `
                background: rgba(255,255,255,0.95);
                color: #667eea;
                border: 2px solid rgba(102,126,234,0.3);
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102,126,234,0.1);
            `
        };
        
        return styles[type] || styles.secondary;
    }
}

// Instância global
window.stateBasedUIComponent = new StateBasedUIComponent();

