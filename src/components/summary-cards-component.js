/**
 * Componente dos Cards de Resumo Aurora
 */
class SummaryCardsComponent {
    constructor() {
        this.element = null;
        this.init();
    }

    init() {
        // NÃO renderizar automaticamente - deixar para o main.js controlar
        console.log('🔧 SummaryCardsComponent inicializado (sem auto-render)');
    }

    render() {
        const headerContainer = document.getElementById('header-component');
        if (headerContainer) {
            // Adicionar os cards após o header existente
            const existingHeader = headerContainer.innerHTML;
            headerContainer.innerHTML = existingHeader + this.getSummaryCardsHTML();
        }
    }

    getSummaryCardsHTML() {
        return `
            <div class="summary-cards-top">
                <!-- Card 1: Contratos Ativos -->
                <div class="aurora-card">
                    <div class="aurora-background"></div>
                    <div class="card-content">
                        <div class="card-summary">
                            <div class="card-header">Contratos Ativos</div>
                            <div class="card-value" id="totalContracts">Carregando...</div>
                            <div class="card-subtext">Total de contratos em execução</div>
                        </div>
                        <div class="card-details">
                            <div class="details-grid">
                                <div>
                                    <span>Valor Total</span>
                                    <strong id="totalValue">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Marcos Pendentes</span>
                                    <strong id="pendingMilestones">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Contratos Ativos</span>
                                    <strong id="activeContracts">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Taxa Média</span>
                                    <strong id="averageFee">1.5%</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 2: Saldo em Escrow -->
                <div class="aurora-card">
                    <div class="aurora-background"></div>
                    <div class="card-content">
                        <div class="card-summary">
                            <div class="card-header">Saldo em Escrow</div>
                            <div class="card-value" id="escrowBalance">Carregando...</div>
                            <div class="card-subtext">USDC bloqueado em contratos</div>
                        </div>
                        <div class="card-details">
                            <div class="details-grid">
                                <div>
                                    <span>USDC Total</span>
                                    <strong id="totalUSDC">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Valor Médio</span>
                                    <strong id="averageValue">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Maior Contrato</span>
                                    <strong id="maxContract">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Menor Contrato</span>
                                    <strong id="minContract">Carregando...</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 3: Taxa de Sucesso -->
                <div class="aurora-card">
                    <div class="aurora-background"></div>
                    <div class="card-content">
                        <div class="card-summary">
                            <div class="card-header">Taxa de Sucesso</div>
                            <div class="card-value" id="successRate">Carregando...</div>
                            <div class="card-subtext">Taxa de conclusão dos contratos</div>
                        </div>
                        <div class="card-details">
                            <div class="details-grid">
                                <div>
                                    <span>Reputação Média</span>
                                    <strong id="averageReputation">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Taxa Média</span>
                                    <strong id="averageTax">2.1%</strong>
                                </div>
                                <div>
                                    <span>Casos Resolvidos</span>
                                    <strong id="resolvedCases">Carregando...</strong>
                                </div>
                                <div>
                                    <span>Tempo Médio</span>
                                    <strong id="averageTime">Carregando...</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async updateWithRealData() {
        try {
            console.log('🔄 Atualizando summary cards com dados reais...');
            
            // Verificar se há dados reais disponíveis
            if (window.realContractService && window.realContractService.contract) {
                const contractData = await window.realContractService.getContractDetails();
                console.log('📊 Dados do contrato para summary:', contractData);
                
                // Atualizar elementos com dados reais
                this.updateSummaryElements(contractData);
            } else {
                // Usar dados mockados se não houver contrato real
                this.updateSummaryElements(null);
            }
            
        } catch (error) {
            console.error('❌ Erro ao atualizar summary cards:', error);
            // Em caso de erro, manter dados mockados
            this.updateSummaryElements(null);
        }
    }

    updateSummaryElements(contractData) {
        // Função auxiliar para atualizar elemento se existir
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            } else {
                console.log(`⚠️ Elemento ${id} não encontrado`);
            }
        };

        if (contractData) {
            // Dados reais do contrato
            updateElement('totalContracts', '1');
            updateElement('totalValue', `${contractData.amount} USDC`);
            updateElement('pendingMilestones', contractData.totalMilestones);
            updateElement('activeContracts', contractData.deposited ? '1' : '0');
            updateElement('escrowBalance', `${contractData.remainingAmount} USDC`);
            updateElement('totalUSDC', `${contractData.amount} USDC`);
            updateElement('averageValue', `${contractData.amount} USDC`);
            updateElement('maxContract', `${contractData.amount} USDC`);
            updateElement('minContract', `${contractData.amount} USDC`);
            updateElement('successRate', contractData.deposited ? '100%' : '0%');
            updateElement('averageReputation', '5.0');
            updateElement('resolvedCases', '1');
            updateElement('averageTime', '0 dias');
        } else {
            // Dados mockados (fallback)
            updateElement('totalContracts', '12');
            updateElement('totalValue', 'R$ 2.4M');
            updateElement('pendingMilestones', '8');
            updateElement('activeContracts', '2');
            updateElement('escrowBalance', 'R$ 847.2K');
            updateElement('totalUSDC', '1,547.2K');
            updateElement('averageValue', 'R$ 70.6K');
            updateElement('maxContract', 'R$ 320K');
            updateElement('minContract', 'R$ 15K');
            updateElement('successRate', '98%');
            updateElement('averageReputation', '4.8');
            updateElement('resolvedCases', '156');
            updateElement('averageTime', '2.3 dias');
        }
    }
}

// Instância global do componente
window.summaryCardsComponent = new SummaryCardsComponent();
