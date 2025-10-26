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
        const cardsContainer = document.getElementById('summary-cards-container');
        if (cardsContainer) {
            cardsContainer.innerHTML = this.getSummaryCardsHTML();
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
                            <div class="card-value" id="totalContracts">0</div>
                            <div class="card-subtext">Total de contratos em execução</div>
                        </div>
                        <div class="card-details">
                            <div class="details-grid">
                                <div>
                                    <span>Valor Total</span>
                                    <strong id="totalValue">0 USDC</strong>
                                </div>
                                <div>
                                    <span>Marcos Pendentes</span>
                                    <strong id="pendingMilestones">0</strong>
                                </div>
                                <div>
                                    <span>Contratos Ativos</span>
                                    <strong id="activeContracts">0</strong>
                                </div>
                                <div>
                                    <span>Taxa Média</span>
                                    <strong id="averageFee">0%</strong>
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
                            <div class="card-value" id="escrowBalance">0 USDC</div>
                            <div class="card-subtext">USDC bloqueado em contratos</div>
                        </div>
                        <div class="card-details">
                            <div class="details-grid">
                                <div>
                                    <span>USDC Total</span>
                                    <strong id="totalUSDC">0 USDC</strong>
                                </div>
                                <div>
                                    <span>Valor Médio</span>
                                    <strong id="averageValue">0 USDC</strong>
                                </div>
                                <div>
                                    <span>Maior Contrato</span>
                                    <strong id="maxContract">0 USDC</strong>
                                </div>
                                <div>
                                    <span>Menor Contrato</span>
                                    <strong id="minContract">0 USDC</strong>
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
                            <div class="card-value" id="successRate">0%</div>
                            <div class="card-subtext">Taxa de conclusão dos contratos</div>
                        </div>
                        <div class="card-details">
                            <div class="details-grid">
                                <div>
                                    <span>Reputação Média</span>
                                    <strong id="averageReputation">0.0</strong>
                                </div>
                                <div>
                                    <span>Taxa Média</span>
                                    <strong id="averageTax">0%</strong>
                                </div>
                                <div>
                                    <span>Casos Resolvidos</span>
                                    <strong id="resolvedCases">0</strong>
                                </div>
                                <div>
                                    <span>Tempo Médio</span>
                                    <strong id="averageTime">0 dias</strong>
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
            
            // Buscar dados da PolygonScan para o endereço conectado
            await this.updateWithPolygonScanData();
            
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

    async updateWithPolygonScanData() {
        try {
            const walletAddress = window.walletService?.account || window.walletService?.walletAddress;
            if (!walletAddress) {
                console.log('⚠️ Nenhum endereço de carteira encontrado');
                return;
            }

            console.log('🔍 Usando dados mockados para não bloquear interface');
            
            // Usar dados mockados para não bloquear a interface
            // TODO: Implementar busca assíncrona em background quando necessário
            this.updateElement('totalContracts', '1');
            
        } catch (error) {
            console.error('❌ Erro ao atualizar dados:', error);
            this.updateElement('totalContracts', '0');
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.log(`⚠️ Elemento ${id} não encontrado`);
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
            const amount = contractData.amount || '0';
            const balance = contractData.remainingAmount || contractData.balance || '0';
            
            updateElement('totalContracts', '1');
            updateElement('totalValue', `${amount} USDC`);
            updateElement('pendingMilestones', contractData.totalMilestones || '0');
            updateElement('activeContracts', contractData.deposited ? '1' : '0');
            updateElement('escrowBalance', `${balance} USDC`);
            updateElement('totalUSDC', `${amount} USDC`);
            updateElement('averageValue', `${amount} USDC`);
            updateElement('maxContract', `${amount} USDC`);
            updateElement('minContract', `${amount} USDC`);
            updateElement('successRate', contractData.deposited ? '100%' : '0%');
            updateElement('averageReputation', '5.0');
            updateElement('resolvedCases', '1');
            updateElement('averageTime', '0 dias');
            updateElement('averageFee', '0%');
            updateElement('averageTax', '0%');
        } else {
            // Valores padrão quando não há dados reais
            updateElement('totalContracts', '0');
            updateElement('totalValue', '0 USDC');
            updateElement('pendingMilestones', '0');
            updateElement('activeContracts', '0');
            updateElement('escrowBalance', '0 USDC');
            updateElement('totalUSDC', '0 USDC');
            updateElement('averageValue', '0 USDC');
            updateElement('maxContract', '0 USDC');
            updateElement('minContract', '0 USDC');
            updateElement('successRate', '0%');
            updateElement('averageReputation', '0.0');
            updateElement('resolvedCases', '0');
            updateElement('averageTime', '0 dias');
            updateElement('averageFee', '0%');
            updateElement('averageTax', '0%');
        }
    }
}

// Instância global do componente
window.summaryCardsComponent = new SummaryCardsComponent();
