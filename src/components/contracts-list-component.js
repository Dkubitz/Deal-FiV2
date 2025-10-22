/**
 * Componente da Lista de Contratos Ativos
 */
class ContractsListComponent {
    constructor() {
        this.element = null;
        this.currentView = 'all'; // 'all', 'toPay', 'toReceive'
        this.init();
    }

    init() {
        // NÃO renderizar automaticamente - deixar para o main.js controlar
        console.log('🔧 ContractsListComponent inicializado (sem auto-render)');
    }

    async render() {
        const container = document.getElementById('right-content');
        if (container) {
            // Renderizar diretamente na coluna direita
            container.innerHTML = this.getContractsListHTML();
        }
        this.bindModalEvents();
        
        // NÃO carregar contratos automaticamente
        // Eles serão carregados apenas quando necessário (ex: página de gerenciamento)
        console.log('📋 ContractsListComponent renderizado (sem auto-carregamento)');
    }

    async loadRealContracts() {
        try {
            console.log('🔄 Carregando contratos reais...');
            
            if (window.realContractService && window.realContractService.contract) {
                const contractData = await window.realContractService.getContractDetails();
                console.log('✅ Dados do contrato real carregados:', contractData);
                
                // Criar estrutura de contrato para exibição
                const realContract = {
                    id: 'real-1',
                    type: 'real',
                    title: 'Contrato Real - Escrow USDC',
                    value: parseFloat(contractData.amount),
                    clientAddress: contractData.payer,
                    supplierAddress: contractData.payee,
                    status: contractData.deposited ? 'active' : 'pending',
                    network: 'Polygon',
                    currentMilestone: contractData.milestoneExecuted ? contractData.milestoneExecuted.filter(m => m).length : 0,
                    totalMilestones: contractData.totalMilestones,
                    nextPayment: contractData.milestoneAmounts && contractData.milestoneAmounts.length > 0 ? 
                        parseFloat(contractData.milestoneAmounts[contractData.currentMilestone] || contractData.milestoneAmounts[0]) : 0,
                    milestones: contractData.milestonePercentages ? contractData.milestonePercentages.map((percentage, index) => ({
                        id: index + 1,
                        description: `Marco ${index + 1}`,
                        amount: parseFloat(contractData.milestoneAmounts[index] || 0),
                        status: contractData.milestoneExecuted && contractData.milestoneExecuted[index] ? 'completed' : 'pending'
                    })) : [],
                    realData: contractData
                };
                
                // Limpar interface anterior e atualizar com dados reais
                this.updateContractsDisplay([realContract]);
            } else {
                console.log('⚠️ Nenhum contrato real encontrado, usando dados mockados');
                // Manter dados mockados se não houver contrato real
            }
        } catch (error) {
            console.error('❌ Erro ao carregar contratos reais:', error);
        }
    }

    updateContractsDisplay(contracts) {
        // Primeiro, vamos encontrar onde mostrar o contrato
        let contractsList = document.getElementById('contractsList');
        
        // Se não encontrar, tentar outros elementos
        if (!contractsList) {
            contractsList = document.getElementById('right-content');
        }
        
        if (!contractsList) {
            console.log('⚠️ Elemento para mostrar contratos não encontrado');
            return;
        }
        
        if (contracts.length > 0) {
            const contract = contracts[0];
            
            console.log('🎨 Renderizando contrato na interface:', contract);
            
            // CRIAR ELEMENTO PARA O CONTRATO (não substituir todo o conteúdo)
            const contractElement = document.createElement('div');
            contractElement.className = 'aurora-card';
            contractElement.style.cssText = 'margin-bottom: 20px; width: 100%; max-width: none; cursor: pointer;';
            contractElement.onclick = () => window.contractsListComponent.openRealContractModal(contract.id);
            
            contractElement.innerHTML = `
                <div class="aurora-background"></div>
                <div class="card-content">
                    <div class="card-summary">
                        <div class="card-header">🔗 ${contract.title}</div>
                        <div class="card-value">${contract.value} USDC</div>
                        <div class="card-subtext">Pagador: ${contract.clientAddress.substring(0, 6)}...${contract.clientAddress.substring(38)} | Recebedor: ${contract.supplierAddress.substring(0, 6)}...${contract.supplierAddress.substring(38)}</div>
                    </div>
                    <div class="card-details">
                        <div class="details-grid">
                            <div>
                                <span>Status</span>
                                <strong style="color: ${this.getStatusColor(contract.status)};">${this.getStatusText(contract.status)}</strong>
                            </div>
                            <div>
                                <span>Rede</span>
                                <strong>${contract.network}</strong>
                            </div>
                            <div>
                                <span>Marco Atual</span>
                                <strong>${contract.currentMilestone} de ${contract.totalMilestones}</strong>
                            </div>
                            <div>
                                <span>Próximo Pagamento</span>
                                <strong>${contract.nextPayment} USDC</strong>
                            </div>
                        </div>
                        <div style="margin-top: 20px; text-align: center;">
                            ${this.renderRealContractActionButtons(contract)}
                        </div>
                    </div>
                </div>
            `;
            
            // LIMPAR conteúdo anterior e ADICIONAR novo contrato
            contractsList.innerHTML = '';
            contractsList.appendChild(contractElement);
            
            console.log('✅ Contrato renderizado na interface!');
        } else {
            console.log('⚠️ Nenhum contrato para mostrar');
            if (contractsList) {
                // Só limpar se não houver contratos
                contractsList.innerHTML = '<p class="no-contracts-message">Nenhum contrato encontrado.</p>';
            }
        }
    }

    renderRealContractActionButtons(contract) {
        const userAddress = window.walletService?.account || '';
        const isPayer = contract.realData?.payer?.toLowerCase() === userAddress.toLowerCase();
        const isPayee = contract.realData?.payee?.toLowerCase() === userAddress.toLowerCase();
        const isDeposited = contract.realData?.deposited;
        
        let buttons = [];
        
        if (!isDeposited) {
            // Contrato não depositado ainda
            if (isPayer) {
                buttons.push(`<button class="btn-small btn-approve" style="margin-right: 10px;" onclick="window.contractsListComponent.depositRealContract('${contract.id}')">💳 Depositar USDC</button>`);
            } else if (isPayee) {
                buttons.push(`<button class="btn-small btn-info" style="margin-right: 10px;" onclick="window.contractsListComponent.checkContractStatus('${contract.id}')">📋 Verificar Status</button>`);
            }
        } else {
            // Contrato depositado - ações ativas
            if (isPayer || isPayee) {
                buttons.push(`<button class="btn-small btn-release" style="margin-right: 10px;" onclick="window.contractsListComponent.releaseRealMilestone('${contract.id}')">✅ Aprovar Marco</button>`);
                buttons.push(`<button class="btn-small btn-cancel" style="margin-right: 10px;" onclick="window.contractsListComponent.approveRealCancel('${contract.id}')">❌ Aprovar Cancelamento</button>`);
            }
            
            if (isPayer) {
                buttons.push(`<button class="btn-small btn-warning" onclick="window.contractsListComponent.refundRealContract('${contract.id}')">🔄 Refund</button>`);
            } else if (isPayee) {
                buttons.push(`<button class="btn-small btn-info" onclick="window.contractsListComponent.claimAfterDeadline('${contract.id}')">⏰ Reclamar Após Prazo</button>`);
            }
        }
        
        // Botão para ver detalhes
        buttons.push(`<button class="btn-small btn-info" onclick="window.contractsListComponent.showContractDetails('${contract.id}')">🔍 Ver Detalhes</button>`);
        
        return buttons.join('');
    }

    async releaseRealMilestone(contractId) {
        try {
            console.log('💰 Liberando marco do contrato real...');
            await window.realContractService.releaseMilestone(0);
            alert('✅ Marco liberado com sucesso!');
            // Recarregar dados
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao liberar marco:', error);
            alert('❌ Erro ao liberar marco: ' + error.message);
        }
    }

    async approveRealCancel(contractId) {
        try {
            console.log('❌ Aprovando cancelamento do contrato real...');
            await window.realContractService.approveCancel();
            alert('✅ Cancelamento aprovado!');
            // Recarregar dados
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao aprovar cancelamento:', error);
            alert('❌ Erro ao aprovar cancelamento: ' + error.message);
        }
    }

    async depositRealContract(contractId) {
        try {
            console.log('💳 Depositando USDC no contrato real...');
            // Aqui você pode implementar a lógica de depósito
            alert('💳 Funcionalidade de depósito será implementada em breve!');
        } catch (error) {
            console.error('❌ Erro ao depositar:', error);
            alert('❌ Erro ao depositar: ' + error.message);
        }
    }

    async refundRealContract(contractId) {
        try {
            console.log('🔄 Fazendo refund do contrato real...');
            await window.realContractService.refund();
            alert('✅ Refund executado com sucesso!');
            // Recarregar dados
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao fazer refund:', error);
            alert('❌ Erro ao fazer refund: ' + error.message);
        }
    }

    async checkContractStatus(contractId) {
        try {
            console.log('📋 Verificando status do contrato...');
            const contractData = await window.realContractService.getContractDetails();
            
            alert(`📊 STATUS DO CONTRATO\n\n` +
                  `💰 Valor: ${contractData.amount} USDC\n` +
                  `💳 Depositado: ${contractData.deposited ? 'Sim' : 'Não'}\n` +
                  `⏰ Prazo: ${contractData.deadline.toLocaleDateString('pt-BR')}\n` +
                  `🎯 Marcos: ${contractData.totalMilestones}\n` +
                  `💵 Saldo Restante: ${contractData.remainingAmount} USDC\n\n` +
                  `📋 Status: ${contractData.deposited ? 'Ativo' : 'Aguardando Depósito'}`);
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            alert('❌ Erro ao verificar status: ' + error.message);
        }
    }

    async claimAfterDeadline(contractId) {
        try {
            console.log('⏰ Reclamando após deadline...');
            await window.realContractService.claimAfterDeadline();
            alert('✅ Reclamação executada com sucesso!');
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao reclamar após deadline:', error);
            alert('❌ Erro ao reclamar: ' + error.message);
        }
    }

    async showContractDetails(contractId) {
        try {
            console.log('🔍 Mostrando detalhes do contrato...');
            const contractData = await window.realContractService.getContractDetails();
            
            const userAddress = window.walletService?.account || '';
            const isPayer = contractData.payer.toLowerCase() === userAddress.toLowerCase();
            const isPayee = contractData.payee.toLowerCase() === userAddress.toLowerCase();
            
            alert(`🔍 DETALHES COMPLETOS DO CONTRATO\n\n` +
                  `📋 Informações Básicas:\n` +
                  `• Endereço: ${window.realContractService.contractAddress}\n` +
                  `• Pagador: ${contractData.payer}\n` +
                  `• Recebedor: ${contractData.payee}\n` +
                  `• Valor: ${contractData.amount} USDC\n` +
                  `• Prazo: ${contractData.deadline.toLocaleString('pt-BR')}\n\n` +
                  `💰 Status Financeiro:\n` +
                  `• Depositado: ${contractData.deposited ? 'Sim' : 'Não'}\n` +
                  `• Saldo Restante: ${contractData.remainingAmount} USDC\n` +
                  `• Token: USDC (Polygon)\n\n` +
                  `🎯 Marcos:\n` +
                  `• Total: ${contractData.totalMilestones}\n` +
                  `• Percentuais: ${contractData.milestonePercentages.join(', ')}%\n` +
                  `• Valores: ${contractData.milestoneAmounts.join(', ')} USDC\n` +
                  `• Executados: ${contractData.milestoneExecuted.map(e => e ? 'Sim' : 'Não').join(', ')}\n\n` +
                  `👤 Seu Papel: ${isPayer ? 'PAGADOR' : isPayee ? 'RECEBEDOR' : 'OBSERVADOR'}`);
        } catch (error) {
            console.error('❌ Erro ao mostrar detalhes:', error);
            alert('❌ Erro ao mostrar detalhes: ' + error.message);
        }
    }

    showAvailableActions(contractData, userAddress) {
        const isPayer = contractData.payer.toLowerCase() === userAddress.toLowerCase();
        const isPayee = contractData.payee.toLowerCase() === userAddress.toLowerCase();
        
        let actions = [];
        let status = '';
        
        if (!contractData.deposited) {
            status = '⏳ Aguardando Depósito';
            if (isPayer) {
                actions.push('💳 Depositar USDC no contrato');
                actions.push('❌ Cancelar contrato (se possível)');
            } else if (isPayee) {
                actions.push('⏳ Aguardar pagador depositar USDC');
                actions.push('📋 Verificar status do contrato');
            }
        } else {
            status = '💰 Contrato Ativo';
            if (isPayer) {
                actions.push('✅ Aprovar liberação de marcos');
                actions.push('❌ Aprovar cancelamento (se necessário)');
                actions.push('🔄 Fazer refund (se permitido)');
            } else if (isPayee) {
                actions.push('✅ Aprovar liberação de marcos');
                actions.push('💰 Receber pagamentos liberados');
                actions.push('❌ Aprovar cancelamento (se necessário)');
                actions.push('⏰ Reclamar após deadline (se expirado)');
            }
        }
        
        const actionsList = actions.map(action => `• ${action}`).join('\n');
        
        alert(`🎯 AÇÕES DISPONÍVEIS PARA VOCÊ\n\n` +
              `📋 Status: ${status}\n\n` +
              `👤 Seu papel: ${isPayer ? 'PAGADOR' : 'RECEBEDOR'}\n\n` +
              `🎬 Ações disponíveis:\n${actionsList}\n\n` +
              `📊 Detalhes do contrato:\n` +
              `• Pagador: ${contractData.payer.substring(0, 6)}...${contractData.payer.substring(38)}\n` +
              `• Recebedor: ${contractData.payee.substring(0, 6)}...${contractData.payee.substring(38)}\n` +
              `• Valor: ${contractData.amount} USDC\n` +
              `• Prazo: ${contractData.deadline.toLocaleDateString('pt-BR')}\n` +
              `• Marcos: ${contractData.totalMilestones}\n\n` +
              `🔗 Contrato carregado na interface!`);
    }

    async forceUpdateInterface() {
        try {
            console.log('🔄 Forçando atualização da interface...');
            
            // Recarregar contratos reais
            await this.loadRealContracts();
            
            // Verificar se há contratos carregados
            if (window.realContractService && window.realContractService.contract) {
                const contractData = await window.realContractService.getContractDetails();
                console.log('📊 Dados para interface:', contractData);
                
                // Criar estrutura de contrato para exibição
                const realContract = {
                    id: 'real-1',
                    type: 'real',
                    title: 'Contrato Real - Escrow USDC',
                    value: parseFloat(contractData.amount),
                    clientAddress: contractData.payer,
                    supplierAddress: contractData.payee,
                    status: contractData.deposited ? 'active' : 'pending',
                    network: 'Polygon',
                    currentMilestone: contractData.milestoneExecuted ? contractData.milestoneExecuted.filter(m => m).length : 0,
                    totalMilestones: contractData.totalMilestones,
                    nextPayment: contractData.milestoneAmounts && contractData.milestoneAmounts.length > 0 ? 
                        parseFloat(contractData.milestoneAmounts[contractData.currentMilestone] || contractData.milestoneAmounts[0]) : 0,
                    realData: contractData
                };
                
                // Limpar interface e atualizar com novo contrato
                this.updateContractsDisplay([realContract]);
                
                alert('✅ Interface atualizada!\n\n' +
                      'Contrato carregado na interface com todas as ações disponíveis.');
            } else {
                alert('⚠️ Nenhum contrato conectado!\n\n' +
                      'Use primeiro o botão "Conectar MetaMask e Buscar Contratos"');
            }
            
        } catch (error) {
            console.error('❌ Erro ao forçar atualização:', error);
            alert('❌ Erro ao atualizar interface: ' + error.message);
        }
    }

    openRealContractModal(contractId) {
        // Implementar modal para contrato real
        alert('🔗 Modal do contrato real será implementado em breve!');
    }

    bindModalEvents() {
        // Fechar modal ao clicar no botão X
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Fechar modal ao clicar fora dele
        const modal = document.getElementById('contractModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    getContractsListHTML() {
        return `
            <!-- Botão de Navegação para Lista de Contratos -->
            <div class="nav-button expand-button" onclick="window.contractsListComponent.handleManageContracts()">
                <span class="nav-button-arrow">→</span>
                <span class="nav-button-icon manage-icon-nav"></span>
                <div class="nav-button-title">Gerenciar Contratos</div>
                <div class="nav-button-description">
                    Visualize, gerencie e acompanhe todos os seus contratos de escrow ativos, 
                    com filtros por status e ações de aprovação e liberação de pagamentos.
                </div>
            </div>
            
            <!-- Botão para Conectar e Buscar Contratos Reais -->
            <div class="nav-button expand-button" onclick="window.contractsListComponent.connectAndLoadRealContracts()" style="margin-top: 20px; background: linear-gradient(135deg, #10b981, #059669);">
                <span class="nav-button-arrow">🔗</span>
                <span class="nav-button-icon manage-icon-nav"></span>
                <div class="nav-button-title">Conectar MetaMask e Buscar Contratos</div>
                <div class="nav-button-description">
                    Conecte sua carteira MetaMask e busque automaticamente todos os seus contratos de escrow na blockchain.
                </div>
            </div>
            
            <!-- Botão para Forçar Atualização da Interface -->
            <div class="nav-button expand-button" onclick="window.contractsListComponent.forceUpdateInterface()" style="margin-top: 20px; background: linear-gradient(135deg, #667eea, #764ba2);">
                <span class="nav-button-arrow">🔄</span>
                <span class="nav-button-icon manage-icon-nav"></span>
                <div class="nav-button-title">🔄 Atualizar Interface</div>
                <div class="nav-button-description">
                    Força a atualização da interface para mostrar contratos carregados.
                </div>
            </div>
        `;
    }

    async connectAndLoadRealContracts() {
        try {
            console.log('🔗 Conectando com MetaMask e buscando contratos...');
            
            // Conectar com MetaMask
            if (!window.ethereum) {
                alert('❌ MetaMask não detectado! Por favor, instale o MetaMask.');
                return;
            }

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const userAddress = accounts[0];
            console.log('✅ Carteira conectada:', userAddress);

            // Inicializar RealContractService
            if (window.realContractService) {
                await window.realContractService.init();
                
                // Buscar contratos do usuário
                const found = await window.realContractService.findUserContracts(userAddress);
                
                if (found) {
                    console.log('✅ Contratos do usuário encontrados!');
                    
                    // Carregar dados do contrato
                    const contractData = await window.realContractService.getContractDetails();
                    console.log('📊 Dados do contrato:', contractData);
                    
                // Atualizar interface
                await this.loadRealContracts();
                
                // Mostrar ações disponíveis
                this.showAvailableActions(contractData, userAddress);
                } else {
                    alert('⚠️ Nenhum contrato encontrado para este endereço.\n\n' +
                          `Endereço: ${userAddress}\n` +
                          'Verifique se você é o criador de algum contrato de escrow.');
                }
            } else {
                alert('❌ RealContractService não encontrado!');
            }
            
        } catch (error) {
            console.error('❌ Erro ao conectar e buscar contratos:', error);
            alert('❌ Erro ao conectar: ' + error.message);
        }
    }

    renderContractCards() {
        if (!window.contractService) return '';

        const allContracts = window.contractService.getContracts();
        let filteredContracts = [];

        switch (this.currentView) {
            case 'toPay':
                filteredContracts = allContracts.filter(contract => 
                    contract.status === 'pending' || contract.status === 'approved'
                );
                break;
            case 'toReceive':
                filteredContracts = allContracts.filter(contract => 
                    contract.status === 'pending' || contract.status === 'approved'
                );
                break;
            default:
                filteredContracts = allContracts;
        }

        if (filteredContracts.length === 0) {
            return this.renderEmptyState();
        }

        return filteredContracts.map(contract => this.renderContractCard(contract)).join('');
    }

    renderContractCard(contract) {
        const statusColor = this.getStatusColor(contract.status);
        const statusText = this.getStatusText(contract.status);
        
        return `
            <div class="aurora-card" style="margin-bottom: 20px; width: 100%; max-width: none; cursor: pointer;" onclick="window.contractsListComponent.openModal(${contract.id})">
                <div class="aurora-background"></div>
                <div class="card-content">
                    <div class="card-summary">
                        <div class="card-header">${this.getTypeIcon(contract.type)} ${contract.title}</div>
                        <div class="card-value">R$ ${contract.value.toLocaleString('pt-BR')}</div>
                        <div class="card-subtext">Cliente: ${contract.clientAddress.substring(0, 6)}...${contract.clientAddress.substring(38)} | Fornecedor: ${contract.supplierAddress.substring(0, 6)}...${contract.supplierAddress.substring(38)}</div>
                    </div>
                    <div class="card-details">
                        <div class="details-grid">
                            <div>
                                <span>Status</span>
                                <strong style="color: ${statusColor};">${statusText}</strong>
                            </div>
                            <div>
                                <span>Rede</span>
                                <strong>${contract.network}</strong>
                            </div>
                            <div>
                                <span>Marco Atual</span>
                                <strong>${contract.currentMilestone} de ${contract.totalMilestones}</strong>
                            </div>
                            <div>
                                <span>${this.getAmountLabel(contract)}</span>
                                <strong>${this.getAmountValue(contract)}</strong>
                            </div>
                        </div>
                        <div style="margin-top: 20px; text-align: center;">
                            ${this.renderActionButtons(contract)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getTypeIcon(type) {
        const icons = {
            construction: '🏗️',
            services: '🔧',
            supply: '📦',
            consulting: '💼'
        };
        return icons[type] || '📋';
    }

    getStatusColor(status) {
        const colors = {
            pending: '#f59e0b',
            approved: '#10b981',
            released: '#667eea',
            active: '#667eea',
            cancelled: '#ef4444'
        };
        return colors[status] || '#667eea';
    }

    getStatusText(status) {
        const texts = {
            pending: '⏳ Aguardando Aprovação',
            approved: '✅ Aprovado',
            released: '💰 Liberado',
            active: '🔄 Ativo',
            cancelled: '❌ Cancelado'
        };
        return texts[status] || 'Desconhecido';
    }

    getAmountLabel(contract) {
        if (contract.status === 'approved') return 'Próximo Pagamento';
        if (contract.status === 'pending') return 'Valor Pendente';
        if (contract.status === 'active') return 'Valor Ativo';
        if (contract.status === 'cancelled') return 'Valor Cancelado';
        return 'Valor';
    }

    getAmountValue(contract) {
        if (contract.status === 'approved' && contract.nextPayment) {
            return `R$ ${contract.nextPayment.toLocaleString('pt-BR')}`;
        }
        if (contract.status === 'pending' && contract.pendingAmount) {
            return `R$ ${contract.pendingAmount.toLocaleString('pt-BR')}`;
        }
        if (contract.status === 'active' && contract.nextPayment) {
            return `R$ ${contract.nextPayment.toLocaleString('pt-BR')}`;
        }
        if (contract.status === 'cancelled') {
            return 'Reembolsado';
        }
        return 'N/A';
    }

    renderActionButtons(contract) {
        if (contract.status === 'approved') {
            return `
                <button class="btn-small btn-release" style="margin-right: 10px;" onclick="window.contractsListComponent.releasePayment(${contract.id})">💰 Liberar Pagamento</button>
                <button class="btn-small btn-cancel" onclick="window.contractsListComponent.cancelContract(${contract.id})">❌ Cancelar Contrato</button>
            `;
        } else if (contract.status === 'pending') {
            return `
                <button class="btn-small btn-approve" style="margin-right: 10px;" onclick="window.contractsListComponent.approveMilestone(${contract.id})">✅ Aprovar Marco</button>
                <button class="btn-small btn-cancel" onclick="window.contractsListComponent.cancelContract(${contract.id})">❌ Cancelar Contrato</button>
            `;
        } else if (contract.status === 'active') {
            return `
                <button class="btn-small btn-approve" style="margin-right: 10px;" onclick="window.contractsListComponent.approveMilestone(${contract.id})">✅ Aprovar Marco</button>
                <button class="btn-small btn-cancel" onclick="window.contractsListComponent.cancelContract(${contract.id})">❌ Cancelar Contrato</button>
            `;
        }
        return '';
    }

    async handleManageContracts() {
        console.log('Botão Gerenciar Contratos clicado!');
        
        // Navegação simples sem animação complexa
        if (window.navigationService) {
            window.navigationService.navigateTo('manage');
        } else {
            alert('📋 Função Gerenciar Contratos ativada! (NavigationService não encontrado)');
        }
    }

    getManageContractsContent() {
        return `
            <div class="new-content" style="padding: 60px 40px; color: white; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; background: #1a1a1a;">
                <div style="max-width: 1000px; margin: 0 auto;">
                    <h2 style="margin-bottom: 30px; font-size: 2.5em; color: white;">📋 Gerenciar Contratos</h2>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 40px; border-radius: 28px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px);">
                        <h3 style="margin-bottom: 20px; color: #10b981;">Painel de Controle</h3>
                        <p style="margin-bottom: 30px; opacity: 0.8; color: #ccc;">
                            Gerencie todos os seus contratos de escrow com arbitragem inteligente.
                        </p>
                        
                        <!-- Filtros -->
                        <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap;">
                            <button style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 2px solid rgba(16, 185, 129, 0.4); padding: 12px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-size: 14px;" onmouseover="this.style.background='#10b981'; this.style.color='white';" onmouseout="this.style.background='rgba(16, 185, 129, 0.2)'; this.style.color='#10b981';">
                                📋 Todos os Contratos
                            </button>
                            <button style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 2px solid rgba(245, 158, 11, 0.4); padding: 12px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-size: 14px;" onmouseover="this.style.background='#f59e0b'; this.style.color='white';" onmouseout="this.style.background='rgba(245, 158, 11, 0.2)'; this.style.color='#f59e0b';">
                                ⏳ Pendentes
                            </button>
                            <button style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 2px solid rgba(239, 68, 68, 0.4); padding: 12px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-size: 14px;" onmouseover="this.style.background='#ef4444'; this.style.color='white';" onmouseout="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.color='#ef4444';">
                                ⚖️ Em Disputa
                            </button>
                            <button style="background: rgba(102, 126, 234, 0.2); color: #667eea; border: 2px solid rgba(102, 126, 234, 0.4); padding: 12px 24px; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-size: 14px;" onmouseover="this.style.background='#667eea'; this.style.color='white';" onmouseout="this.style.background='rgba(102, 126, 234, 0.2)'; this.style.color='#667eea';">
                                ✅ Finalizados
                            </button>
                        </div>

                        <!-- Lista de Contratos -->
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 20px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                            <div style="display: grid; gap: 20px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                                    <div style="text-align: left; flex: 1;">
                                        <div style="font-weight: 700; margin-bottom: 8px; color: white; font-size: 16px;">🏗️ Construção Casa Modelo A</div>
                                        <div style="font-size: 14px; color: #ccc; margin-bottom: 5px;">Valor: R$ 150.000 | Marco 2 de 4</div>
                                        <div style="font-size: 12px; color: #aaa;">Cliente: 0x1234...abcd | Fornecedor: 0x5678...efgh</div>
                                    </div>
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <span style="background: rgba(245, 158, 11, 0.3); color: #f59e0b; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">⏳ Aguardando Aprovação</span>
                                        <button style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">✅ Aprovar Marco</button>
                                    </div>
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                                    <div style="text-align: left; flex: 1;">
                                        <div style="font-weight: 700; margin-bottom: 8px; color: white; font-size: 16px;">🔧 Serviços de Consultoria</div>
                                        <div style="font-size: 14px; color: #ccc; margin-bottom: 5px;">Valor: R$ 45.000 | Marco 1 de 3</div>
                                        <div style="font-size: 12px; color: #aaa;">Cliente: 0x9abc...1234 | Fornecedor: 0xdef5...6789</div>
                                    </div>
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <span style="background: rgba(16, 185, 129, 0.3); color: #10b981; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">✅ Marco Aprovado</span>
                                        <button style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">💰 Liberar Pagamento</button>
                                    </div>
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);">
                                    <div style="text-align: left; flex: 1;">
                                        <div style="font-weight: 700; margin-bottom: 8px; color: white; font-size: 16px;">📦 Fornecimento de Materiais</div>
                                        <div style="font-size: 14px; color: #ccc; margin-bottom: 5px;">Valor: R$ 78.000 | Marco 3 de 3</div>
                                        <div style="font-size: 12px; color: #aaa;">Cliente: 0xabc1...2345 | Fornecedor: 0x6789...abcd</div>
                                    </div>
                                    <div style="display: flex; gap: 12px; align-items: center;">
                                        <span style="background: rgba(239, 68, 68, 0.3); color: #ef4444; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">⚖️ Em Arbitragem</span>
                                        <button style="background: linear-gradient(135deg, #764ba2 0%, #667eea 100%); color: white; border: none; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='none';">👨‍⚖️ Ver Árbitro</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 18px 40px; border-radius: 25px; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 35px rgba(16, 185, 129, 0.4)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 25px rgba(16, 185, 129, 0.3)';">
                            🔄 Atualizar Lista de Contratos
                        </button>
                    </div>
                    <div style="opacity: 0.7; font-size: 14px; color: #ccc;">
                        💡 Use os filtros para encontrar contratos específicos e gerencie pagamentos com arbitragem automática
                    </div>
                </div>
            </div>
        `;
    }

    // Métodos de ação
    async releasePayment(contractId) {
        alert(`💰 Liberando pagamento para contrato ${contractId}...`);
    }

    async approveMilestone(contractId) {
        alert(`✅ Aprovando marco para contrato ${contractId}...`);
    }

    async cancelContract(contractId) {
        const confirmed = confirm(`❌ Tem certeza que deseja cancelar o contrato ${contractId}?\n\nO valor em escrow será reembolsado para sua carteira.`);
        if (confirmed) {
            alert(`❌ Cancelando contrato ${contractId} e reembolsando valor...`);
            // Aqui seria chamada a função do smart contract para cancelar e reembolsar
        }
    }

    // Métodos do Modal
    openModal(contractId) {
        const contract = window.contractService.getContractById(contractId);
        if (!contract) return;

        // Encontrar o card clicado
        const clickedCard = document.querySelector(`[onclick*="openModal(${contractId})"]`);
        if (clickedCard) {
            // Adicionar classe de expansão ao card
            clickedCard.classList.add('expanded');
            
            // Aguardar a animação de expansão antes de abrir o modal
            setTimeout(() => {
                this.showModal(contract);
            }, 400); // Tempo da transição CSS
        } else {
            this.showModal(contract);
        }
    }

    showModal(contract) {
        const modal = document.getElementById('contractModal');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalContent) {
            modalContent.innerHTML = this.getModalContent(contract);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Previne scroll da página
        }
    }

    closeModal() {
        const modal = document.getElementById('contractModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Restaura scroll da página
            
            // Remover classe de expansão de todos os cards
            setTimeout(() => {
                const expandedCards = document.querySelectorAll('.aurora-card.expanded');
                expandedCards.forEach(card => {
                    card.classList.remove('expanded');
                });
            }, 400); // Aguardar fechamento do modal
        }
    }

    getModalContent(contract) {
        const statusColor = this.getStatusColor(contract.status);
        const statusText = this.getStatusText(contract.status);
        
        return `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1c1c1e; margin-bottom: 10px;">${this.getTypeIcon(contract.type)} ${contract.title}</h2>
                <div style="font-size: 2em; font-weight: 700; color: #667eea; margin-bottom: 20px;">
                    R$ ${contract.value.toLocaleString('pt-BR')}
                </div>
                <div style="background: ${statusColor}20; color: ${statusColor}; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600;">
                    ${statusText}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div style="background: rgba(102, 126, 234, 0.1); padding: 20px; border-radius: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #667eea;">👤 Cliente</h4>
                    <div style="font-family: monospace; font-size: 14px;">${contract.clientAddress}</div>
                </div>
                <div style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #10b981;">🏗️ Fornecedor</h4>
                    <div style="font-family: monospace; font-size: 14px;">${contract.supplierAddress}</div>
                </div>
            </div>

            <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                <h4 style="margin: 0 0 15px 0; color: #f59e0b;">📊 Informações do Contrato</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div>
                        <span style="font-size: 12px; opacity: 0.7;">Rede</span>
                        <div style="font-weight: 600;">${contract.network}</div>
                    </div>
                    <div>
                        <span style="font-size: 12px; opacity: 0.7;">Marco Atual</span>
                        <div style="font-weight: 600;">${contract.currentMilestone} de ${contract.totalMilestones}</div>
                    </div>
                    <div>
                        <span style="font-size: 12px; opacity: 0.7;">${this.getAmountLabel(contract)}</span>
                        <div style="font-weight: 600;">${this.getAmountValue(contract)}</div>
                    </div>
                </div>
            </div>

            ${this.renderModalMilestones(contract)}

            <div style="text-align: center; margin-top: 30px;">
                ${this.renderModalActionButtons(contract)}
            </div>
        `;
    }

    renderModalMilestones(contract) {
        if (!contract.milestones || contract.milestones.length === 0) return '';

        return `
            <div style="background: rgba(118, 75, 162, 0.1); padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                <h4 style="margin: 0 0 15px 0; color: #764ba2;">🎯 Marcos do Projeto</h4>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${contract.milestones.map(milestone => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255, 255, 255, 0.5); border-radius: 10px;">
                            <div>
                                <div style="font-weight: 600;">${milestone.description}</div>
                                <div style="font-size: 14px; opacity: 0.7;">R$ ${milestone.amount.toLocaleString('pt-BR')}</div>
                            </div>
                            <div style="padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; 
                                background: ${milestone.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 
                                           milestone.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 
                                           'rgba(239, 68, 68, 0.2)'};
                                color: ${milestone.status === 'completed' ? '#10b981' : 
                                       milestone.status === 'pending' ? '#f59e0b' : '#ef4444'};">
                                ${milestone.status === 'completed' ? '✅ Concluído' : 
                                  milestone.status === 'pending' ? '⏳ Pendente' : '⚖️ Em Disputa'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderModalActionButtons(contract) {
        if (contract.status === 'approved') {
            return `
                <button class="btn-small btn-release" style="margin-right: 10px;" onclick="window.contractsListComponent.releasePayment(${contract.id})">💰 Liberar Pagamento</button>
                <button class="btn-small btn-dispute" onclick="window.contractsListComponent.openDispute(${contract.id})">⚖️ Abrir Disputa</button>
            `;
        } else if (contract.status === 'pending') {
            return `
                <button class="btn-small btn-approve" style="margin-right: 10px;" onclick="window.contractsListComponent.approveMilestone(${contract.id})">✅ Aprovar Marco</button>
                <button class="btn-small btn-dispute" onclick="window.contractsListComponent.openDispute(${contract.id})">⚖️ Abrir Disputa</button>
            `;
        } else if (contract.status === 'disputed') {
            return `
                <button class="btn-small btn-approve" style="margin-right: 10px;" onclick="window.contractsListComponent.viewArbitrator(${contract.id})">👨‍⚖️ Ver Árbitro</button>
                <button class="btn-small btn-dispute" onclick="window.contractsListComponent.viewDetails(${contract.id})">📋 Ver Detalhes</button>
            `;
        }
        return '';
    }

    // Método para alternar entre as visualizações
    switchView(view) {
        this.currentView = view;
        this.render();
    }

    // Renderizar estado vazio quando não há contratos
    renderEmptyState() {
        const messages = {
            'toPay': {
                emoji: '💰',
                title: 'Nenhum contrato a pagar',
                subtitle: 'Todos os contratos estão em dia!'
            },
            'toReceive': {
                emoji: '🎯',
                title: 'Nenhum contrato a receber',
                subtitle: 'Todos os contratos foram finalizados!'
            },
            'all': {
                emoji: '📋',
                title: 'Nenhum contrato encontrado',
                subtitle: 'Crie seu primeiro contrato de escrow!'
            }
        };

        const message = messages[this.currentView] || messages['all'];

        return `
            <div class="empty-state" style="text-align: center; padding: 40px; border-radius: 15px; border: 2px dashed rgba(102, 126, 234, 0.3); background: rgba(102, 126, 234, 0.05);">
                <div style="font-size: 48px; margin-bottom: 15px;">${message.emoji}</div>
                <div style="font-weight: 600; margin-bottom: 8px; color: #667eea;">${message.title}</div>
                <div style="color: rgba(102, 126, 234, 0.7); font-size: 14px;">${message.subtitle}</div>
            </div>
        `;
    }


}

// Instância global do componente
window.contractsListComponent = new ContractsListComponent();
