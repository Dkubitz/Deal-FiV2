/**
 * Serviço de Navegação
 * Gerencia rotas e navegação entre páginas da aplicação
 */
class NavigationService {
    constructor() {
        this.currentPage = 'home';
        this.isRenderingContracts = false; // Controle de renderização
        this.pages = {
            home: {
                id: 'home',
                title: 'Deal-Fi - Home',
                component: 'home-view'
            },
            create: {
                id: 'create',
                title: 'Deal-Fi - Criar Contrato',
                component: 'create-contract-view'
            },
            manage: {
                id: 'manage',
                title: 'Deal-Fi - Gerenciar Contratos',
                component: 'manage-contracts-view'
            }
        };
        
        this.init();
    }

    init() {
        // Configurar listener para mudanças de hash
        window.addEventListener('hashchange', this.handleHashChange.bind(this));
        
        // NÃO inicializar automaticamente - deixar para o main.js controlar
        console.log('🔧 NavigationService inicializado (sem auto-render)');
        
        // Configurar eventos do modal
        this.setupModalEvents();
    }

    /**
     * Inicializa a navegação após o DOM estar pronto
     */
    initializeNavigation() {
        // Verificar se há hash na URL
        if (!window.location.hash) {
            // Sem hash = página inicial, não fazer nada
            this.currentPage = 'home';
            console.log('🏠 Página inicial - componentes existentes mantidos');
        } else {
            // Com hash = navegar para a página específica
            this.handleHashChange();
        }
    }

    /**
     * Navega para uma página específica
     */
    navigateTo(pageId) {
        const page = this.pages[pageId];
        if (!page) {
            console.error(`Página não encontrada: ${pageId}`);
            return;
        }

        // Atualizar estado atual
        this.currentPage = pageId;
        
        // Atualizar título da página
        document.title = page.title;
        
        // Renderizar página
        this.renderPage(pageId);
        
        // Atualizar hash da URL
        window.location.hash = `#${pageId}`;
        
        console.log(`🚀 Navegando para: ${page.title}`);
    }

    /**
     * Manipula mudanças no hash da URL
     */
    handleHashChange() {
        const hash = window.location.hash.replace('#', '');
        const pageId = hash || 'home';
        
        // Evitar renderização dupla se já estiver na página correta
        if (this.currentPage === pageId) {
            return;
        }
        
        if (this.pages[pageId]) {
            this.currentPage = pageId;
            this.renderPage(pageId);
        } else {
            console.warn(`Página não encontrada: ${pageId}, redirecionando para home`);
            this.navigateTo('home');
        }
    }

    /**
     * Renderiza a página solicitada
     */
    renderPage(pageId) {
        const page = this.pages[pageId];
        const mainContainer = document.querySelector('.main-container');
        
        if (!mainContainer) {
            console.error('Container principal não encontrado');
            return;
        }
        // Fade out suave do conteúdo atual
        mainContainer.classList.add('fade-out');

        // Após a transição, troca o conteúdo e faz fade in
        setTimeout(() => {
            // Limpar container
            mainContainer.innerHTML = '';
        
            // Renderizar página específica
            switch (pageId) {
                case 'home':
                    this.renderHomePage(mainContainer);
                    break;
                case 'create':
                    this.renderCreatePage(mainContainer);
                    break;
                case 'manage':
                    this.renderManagePage(mainContainer);
                    break;
                default:
                    this.renderHomePage(mainContainer);
            }

            // Pequeno timeout para garantir reflow antes de remover fade-out
            requestAnimationFrame(() => {
                mainContainer.classList.remove('fade-out');
            });
        }, 180); // combina com o transition do CSS
    }

    /**
     * Renderiza a página inicial
     */
    renderHomePage(container) {
        // Parar polling ao sair da página de gerenciamento
        if (window.contractPollingService) {
            window.contractPollingService.stopPolling();
        }
        // Sempre renderizar com card de notificação inicialmente
        container.innerHTML = `
            <div class="home-content">
                <div class="welcome-section">
                    <h2>🏠 Bem-vindo</h2>
                    <p>Plataforma de escrow não-custodial para contratos inteligentes</p>
                </div>
                
                <div class="wallet-notice" id="wallet-notice">
                    <div class="notice-card">
                        <div class="notice-icon">🔗</div>
                        <h3>Conecte sua Carteira</h3>
                        <p>Para usar os contratos escrow, clique no ícone da MetaMask no canto superior direito para conectar sua carteira.</p>
                    </div>
                    
                    <div class="action-card" onclick="window.navigationService.showHelpModal()">
                        <div class="action-icon help-icon"></div>
                        <h3>Como Funciona</h3>
                        <p>Entenda o funcionamento dos contratos escrow</p>
                    </div>
                </div>
                
                <div class="quick-actions" id="quick-actions" style="display: none;">
                    <div class="action-card" onclick="window.navigationService.navigateTo('create')">
                        <div class="action-icon create-icon"></div>
                        <h3>Criar Novo Contrato</h3>
                        <p>Crie um contrato na rede Polygon</p>
                    </div>
                    
                    <div class="action-card" onclick="window.navigationService.navigateTo('manage')">
                        <div class="action-icon manage-icon"></div>
                        <h3>Gerenciar Contratos</h3>
                        <p>Visualize e gerencie seus contratos ativos</p>
                    </div>
                    
                    <div class="action-card" onclick="window.navigationService.showHelpModal()">
                        <div class="action-icon help-icon"></div>
                        <h3>Como Funciona</h3>
                        <p>Entenda o funcionamento dos contratos escrow</p>
                </div>
                </div>
            </div>
            
        <!-- Container para contratos reais (OCULTO na tela inicial) -->
        <div class="right-column" id="right-content" style="display: none;">
            <!-- Contratos reais serão renderizados aqui APENAS quando necessário -->
            </div>
        `;
        
        // Verificar se carteira já está conectada e atualizar interface
        this.updateHomePageForWalletStatus();
        
        // Adicionar listener para atualizar quando carteira conectar
        this.addWalletConnectionListener();
        
        console.log('🏠 Página inicial renderizada com botões de navegação e right-content');
    }

    /**
     * Atualiza a página inicial baseado no status da carteira
     */
    updateHomePageForWalletStatus() {
        const isWalletConnected = window.walletService && window.walletService.isConnected;
        const walletNotice = document.getElementById('wallet-notice');
        const quickActions = document.getElementById('quick-actions');
        
        if (walletNotice && quickActions) {
            if (isWalletConnected) {
                // Transição suave: esconder notificação primeiro
                walletNotice.style.transition = 'opacity 0.2s ease-out';
                walletNotice.style.opacity = '0';
                
                setTimeout(() => {
                    walletNotice.style.display = 'none';
                    // Mostrar botões após notificação desaparecer
                    quickActions.style.display = 'flex';
                    quickActions.style.transition = 'opacity 0.2s ease-in';
                    quickActions.style.opacity = '0';
                    
                    // Pequeno delay para evitar tremilico
                    requestAnimationFrame(() => {
                        quickActions.style.opacity = '1';
                    });
                }, 200);
                
                console.log('✅ Interface atualizada: carteira conectada - mostrando botões');
            } else {
                // Transição suave: esconder botões primeiro
                quickActions.style.transition = 'opacity 0.2s ease-out';
                quickActions.style.opacity = '0';
                
                setTimeout(() => {
                    quickActions.style.display = 'none';
                    // Mostrar notificação após botões desaparecerem
                    walletNotice.style.display = 'flex';
                    walletNotice.style.transition = 'opacity 0.2s ease-in';
                    walletNotice.style.opacity = '0';
                    
                    // Pequeno delay para evitar tremilico
                    requestAnimationFrame(() => {
                        walletNotice.style.opacity = '1';
                    });
                }, 200);
                
                console.log('⚠️ Interface atualizada: carteira desconectada - mostrando notificação');
            }
        }
    }

    /**
     * Adiciona listener para eventos de conexão da carteira
     */
    addWalletConnectionListener() {
        // Remover listener anterior se existir
        if (this.walletConnectionHandler) {
            document.removeEventListener('walletConnected', this.walletConnectionHandler);
        }
        
        // Criar novo handler
        this.walletConnectionHandler = () => {
            console.log('🔄 Evento de conexão recebido - atualizando página inicial');
            this.updateHomePageForWalletStatus();
        };
        
        // Adicionar listener
        document.addEventListener('walletConnected', this.walletConnectionHandler);
        console.log('🎧 Listener de conexão da carteira adicionado');
    }

    /**
     * Renderiza a página de criação de contratos
     */
    renderCreatePage(container) {
        // Parar polling ao sair da página de gerenciamento
        if (window.contractPollingService) {
            window.contractPollingService.stopPolling();
        }
        // Usar o formulário avançado do create-contract-form.js
        container.innerHTML = window.createContractForm.render();
        
        // Inicializar eventos do formulário avançado
        window.createContractForm.bindEvents();
    }

    /**
     * Renderiza a página de gerenciamento de contratos
     * ATUALIZADO: Usa sistema de estados
     */
    async renderManagePage(container) {
        container.innerHTML = `
            <div class="manage-contracts-page" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
                <!-- Barra de Ações no Topo -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <button class="back-btn-top" onclick="window.navigationService.restoreHomePage()">
                        ← Voltar
                    </button>
                    
                    <button class="back-btn-top" 
                        onclick="window.realContractService.showAddContractModal('${window.walletService?.account || ''}')" 
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(102,126,234,0.4)';"
                        onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(102,126,234,0.3)';">
                        🔍 Buscar Contrato
                    </button>
                </div>
                
                <!-- Container para UI baseada em estado -->
                <div id="state-based-container">
                    <div style="text-align: center; padding: 60px 20px;">
                        <p style="font-size: 18px; color: #666;">🔄 Carregando estado do contrato...</p>
                    </div>
                </div>
            </div>
        `;

        // Carregar e renderizar usando sistema de estados
        await this.loadStateBasedUI();
        console.log('📋 Página de gerenciamento carregada com sistema de estados');
    }

    /**
     * Carrega UI baseada em estado (NOVO SISTEMA)
     */
    async loadStateBasedUI() {
        try {
            console.log('🔄 Carregando UI baseada em estado...');
            
            const container = document.getElementById('state-based-container');
            if (!container) {
                console.error('❌ Container state-based-container não encontrado');
                return;
            }
            
            // Verificar se há contrato conectado
            if (!window.realContractService || !window.realContractService.contract) {
                console.log('⚠️ Nenhum contrato encontrado');
                container.innerHTML = `
                    <div class="no-contracts">
                        <div class="no-contracts-icon">📋</div>
                        <h3>Nenhum contrato encontrado</h3>
                        <p>Conecte sua carteira ou adicione um contrato existente.</p>
                        <div class="no-contracts-actions">
                            <button class="btn-primary" onclick="window.realContractService.showAddContractModal('${window.walletService?.account || ''}')">
                                🔗 Conectar Contrato Existente
                            </button>
                            <button class="btn-secondary" onclick="window.navigationService.navigateTo('create')">
                                ➕ Criar Novo Contrato
                            </button>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Obter dados do contrato
            console.log('📍 [loadStateBasedUI] Contrato ativo:', window.realContractService.contractAddress);
            
            const contractData = await window.realContractService.getContractDetails();
            const userAddress = window.walletService?.account || '';
            
            console.log('📊 [loadStateBasedUI] Dados do contrato:', contractData);
            console.log('👤 [loadStateBasedUI] Usuário:', userAddress);
            console.log('💰 [loadStateBasedUI] Valor do contrato:', contractData.amount, 'USDC');
            
            // Determinar estado usando ContractStateService
            const state = window.contractStateService.determineState(
                contractData,
                userAddress
            );
            
            console.log('✅ Estado determinado:', state);
            
            // Renderizar UI usando StateBasedUIComponent
            window.stateBasedUIComponent.render(state, contractData);
            
            // Iniciar polling para atualizações automáticas
            if (window.contractPollingService) {
                window.contractPollingService.startPolling();
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar UI baseada em estado:', error);
            
            const container = document.getElementById('state-based-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-message" style="
                        text-align: center;
                        padding: 60px 20px;
                        background: rgba(239,68,68,0.1);
                        border: 2px solid rgba(239,68,68,0.3);
                        border-radius: 20px;
                        margin: 20px;
                    ">
                        <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                        <h3 style="color: #ef4444; margin-bottom: 15px;">Erro ao Carregar</h3>
                        <p style="color: #666; margin-bottom: 25px;">${error.message}</p>
                        <button class="btn-primary" onclick="window.navigationService.loadStateBasedUI()">
                            🔄 Tentar Novamente
                        </button>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Recarrega a página atual (usado após ações)
     */
    async refreshCurrentPage() {
        console.log('🔄 Recarregando página atual:', this.currentPage);
        
        if (this.currentPage === 'manage') {
            // Verificar se container existe antes de atualizar
            const container = document.getElementById('state-based-container');
            if (container) {
                await this.loadStateBasedUI();
            } else {
                console.warn('⚠️ Container ainda não existe, ignorando refresh');
            }
        }
    }
    
    /**
     * MÉTODO ANTIGO - Mantido por compatibilidade
     * @deprecated Use loadStateBasedUI() em vez disso
     */
    async loadRealContractsForManage() {
        try {
            // CONTROLE DE RENDERIZAÇÃO PARA EVITAR DUPLICAÇÃO
            if (this.isRenderingContracts) {
                console.log('⚠️ Renderização já em andamento, ignorando chamada duplicada');
                return;
            }
            
            this.isRenderingContracts = true;
            console.log('🔄 Carregando contratos reais para gerenciamento...');
            
            const contractsList = document.getElementById('contractsList');
            if (!contractsList) {
                console.log('❌ Elemento contractsList não encontrado');
                this.isRenderingContracts = false;
                return;
            }

            // Obter endereço do usuário (definir fora dos blocos para uso em toda função)
            const userAddress = window.walletService?.account || '';

            // Verificar se há contrato real conectado
            console.log('🔍 Verificando contrato no serviço...');
            console.log('🔍 realContractService existe:', !!window.realContractService);
            console.log('🔍 contract existe:', !!(window.realContractService && window.realContractService.contract));
            console.log('🔍 contractAddress:', window.realContractService?.contractAddress);
            
            if (window.realContractService && window.realContractService.contract) {
                console.log('✅ Contrato encontrado no serviço:', window.realContractService.contractAddress);
                const contractData = await window.realContractService.getContractDetails();
                console.log('📊 Dados do contrato para gerenciamento:', contractData);
                
                // Criar card do contrato real
                const isPayer = contractData.payer.toLowerCase() === userAddress.toLowerCase();
                const isPayee = contractData.payee.toLowerCase() === userAddress.toLowerCase();
                
                let actionsHTML = '';
                let statusText = '';
                let statusColor = '';
                
                // Debug: Verificar estado do contrato
                console.log('🔍 Estado do contrato para renderização:', {
                    platformFeePaid: contractData.platformFeePaid,
                    confirmedPayer: contractData.confirmedPayer,
                    confirmedPayee: contractData.confirmedPayee,
                    deposited: contractData.deposited,
                    isPayer: isPayer,
                    isPayee: isPayee
                });
                
                // Verificar se taxa de plataforma foi paga
                if (!contractData.platformFeePaid) {
                    statusText = '⚠️ Taxa de Plataforma Pendente';
                    statusColor = '#ef4444';
                    
                    actionsHTML = `
                        <button class="btn-primary" onclick="window.navigationService.payPlatformFee()">
                            💳 Pagar Taxa (1 USDC)
                        </button>
                    `;
                }
                // Verificar se confirmações estão pendentes
                else if (!contractData.confirmedPayer && isPayer) {
                    statusText = '⏳ Aguardando Confirmação do Payer';
                    statusColor = '#f59e0b';
                    
                    actionsHTML = `
                        <button class="btn-primary" onclick="window.navigationService.confirmPayer()">
                            ✅ Confirmar Payer
                        </button>
                    `;
                }
                else if (!contractData.confirmedPayee && isPayee) {
                    statusText = '⏳ Aguardando Confirmação do Payee';
                    statusColor = '#f59e0b';
                    
                    actionsHTML = `
                        <button class="btn-primary" onclick="window.navigationService.confirmPayee()">
                            ✅ Confirmar Payee
                        </button>
                    `;
                }
                else if (!contractData.confirmedPayer || !contractData.confirmedPayee) {
                    // Mostrar status de confirmação pendente para qualquer usuário
                    if (!contractData.confirmedPayer && !contractData.confirmedPayee) {
                        statusText = '⏳ Aguardando Confirmações (Payer e Payee)';
                    } else if (!contractData.confirmedPayer) {
                        statusText = '⏳ Aguardando Confirmação do Payer';
                    } else if (!contractData.confirmedPayee) {
                        statusText = '⏳ Aguardando Confirmação do Payee';
                    }
                    statusColor = '#f59e0b';
                    
                    actionsHTML = `
                        <button class="btn-secondary" onclick="window.navigationService.checkStatus()">
                            📋 Verificar Status
                        </button>
                    `;
                }
                // Verificar se depósito está pendente
                else if (!contractData.deposited) {
                    statusText = '⏳ Aguardando Depósito';
                    statusColor = '#f59e0b';
                    
                    if (isPayer) {
                        actionsHTML = `
                            <button class="btn-primary" onclick="window.navigationService.depositContract()">
                                💳 Depositar USDC
                        </button>
                        `;
                    } else if (isPayee) {
                        actionsHTML = `
                            <button class="btn-secondary" onclick="window.navigationService.checkStatus()">
                                📋 Verificar Status
                            </button>
                        `;
                    }
                } else {
                    statusText = 'Contrato Ativo';
                    statusColor = '#10b981';
                    
                    if (isPayer) {
                        // Botões específicos para PAGADOR
                        actionsHTML = '';
                        
                        // Verificar se algum marco foi liberado
                        const firstMilestoneReleased = contractData.milestoneInfo && 
                                                       contractData.milestoneInfo.length > 0 && 
                                                       contractData.milestoneInfo[0].released;
                        
                        // Verificar se prazo venceu
                        const deadlinePassed = contractData.deadline && new Date() > new Date(contractData.deadline);
                        
                        // Verificar quais marcos ainda não foram executados
                        const pendingMilestones = [];
                        if (contractData.milestoneInfo && contractData.milestoneInfo.length > 0) {
                            for (let i = 0; i < contractData.milestoneInfo.length; i++) {
                                if (!contractData.milestoneInfo[i].released) {
                                    pendingMilestones.push(i);
                                }
                            }
                        }
                        
                        // Mostrar botões para marcos pendentes
                        if (pendingMilestones.length > 0) {
                            pendingMilestones.forEach(milestoneIndex => {
                                actionsHTML += `
                                    <button class="btn-primary" onclick="window.navigationService.releaseMilestone(${milestoneIndex})">
                                        ✅ Liberar Marco ${milestoneIndex + 1}
                                    </button>
                                `;
                            });
                        } else {
                            actionsHTML += `
                                <div class="milestone-status">
                                    <span class="status-text">✅ Todos os marcos foram liberados</span>
                                </div>
                            `;
                        }
                        
                        // Refund: Apenas ANTES do primeiro marco ser liberado
                        if (!firstMilestoneReleased) {
                            actionsHTML += `
                                <button class="btn-danger" onclick="window.navigationService.refundContract()">
                                    🔄 Refund (Recuperar 100%)
                                </button>
                            `;
                        }
                        
                        // Propor Settlement: Sempre disponível
                        actionsHTML += `
                            <button class="btn-info" onclick="window.navigationService.proposeSettlement()">
                                🤝 Propor Acordo (Settlement)
                            </button>
                        `;
                        
                        // Aprovar Cancelamento: Sempre disponível
                        actionsHTML += `
                            <button class="btn-warning" onclick="window.navigationService.approveCancel()">
                                ❌ Aprovar Cancelamento
                            </button>
                        `;
                        
                        // Reclamar Após Prazo: Apenas APÓS deadline
                        if (deadlinePassed) {
                            actionsHTML += `
                                <button class="btn-danger" onclick="window.navigationService.claimAfterDeadline()">
                                    ⏰ Reclamar Após Prazo
                                </button>
                            `;
                        }
                    } else if (isPayee) {
                        // Botões específicos para RECEBEDOR
                        actionsHTML = `
                            <button class="btn-warning" onclick="window.navigationService.approveCancel()">
                                ❌ Aprovar Cancelamento
                            </button>
                            <button class="btn-info" onclick="window.navigationService.approveSettlement()">
                                ✅ Aprovar Acordo (Settlement)
                            </button>
                        `;
                    }
                }
                
                // Adicionar botão para ver detalhes
                actionsHTML += `
                    <button class="btn-secondary" onclick="window.navigationService.viewContractDetails()">
                        Ver Detalhes
                    </button>
                `;
                
                contractsList.innerHTML = `
                    <div class="contract-card-real">
                        <div class="contract-header">
                            <h3>🔗 Contrato Escrow USDC</h3>
                            <span class="status-badge" style="background: ${statusColor}20; color: ${statusColor};">
                                ${statusText}
                            </span>
                        </div>

                        <div class="contract-info">
                            <div class="info-row">
                                <span class="label">Valor Total:</span>
                                <span class="value">${contractData.amount} USDC</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Saldo Restante:</span>
                                <span class="value">${contractData.remainingAmount} USDC</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Pagador:</span>
                                <span class="value">${contractData.payer.substring(0, 6)}...${contractData.payer.substring(38)}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Recebedor:</span>
                                <span class="value">${contractData.payee.substring(0, 6)}...${contractData.payee.substring(38)}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Prazo:</span>
                                <span class="value">${contractData.deadline.toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Seu Papel:</span>
                                <span class="value">${isPayer ? '👤 PAGADOR' : isPayee ? '👤 RECEBEDOR' : '👤 OBSERVADOR'}</span>
                            </div>
                        </div>

                        <div class="contract-actions">
                            ${actionsHTML}
                        </div>
                    </div>
                `;
                
                console.log('✅ Contrato real renderizado na página de gerenciamento');
                
                } else {
                    // Nenhum contrato encontrado
                    console.log('⚠️ Nenhum contrato encontrado - mostrando opções de conexão');
                    contractsList.innerHTML = `
                        <div class="no-contracts">
                            <div class="no-contracts-icon">📋</div>
                            <h3>Nenhum contrato encontrado</h3>
                            <p>Você pode conectar um contrato existente ou criar um novo</p>
                            <div class="no-contracts-actions">
                                <button class="btn-primary" onclick="window.realContractService.showAddContractModal('${userAddress}')">
                                    🔗 Conectar Contrato Existente
                        </button>
                                <button class="btn-secondary" onclick="window.navigationService.navigateTo('create')">
                                    ➕ Criar Novo Contrato
                                </button>
                </div>
            </div>
        `;
                }
            
        } catch (error) {
            console.error('❌ Erro ao carregar contratos para gerenciamento:', error);
            
            const contractsList = document.getElementById('contractsList');
            if (contractsList) {
                contractsList.innerHTML = `
                    <div class="error-message">
                        <div class="error-icon">❌</div>
                        <h3>Erro ao carregar contratos</h3>
                        <p>${error.message}</p>
                        <button class="btn-primary" onclick="window.navigationService.loadStateBasedUI()">
                            🔄 Tentar Novamente
                        </button>
                    </div>
                `;
            }
        } finally {
            // LIBERAR CONTROLE DE RENDERIZAÇÃO
            this.isRenderingContracts = false;
        }
    }

    /**
     * Ações do contrato
     */
    
    // Função para pagar taxa de plataforma
    async payPlatformFee() {
        try {
            console.log('💳 Pagando taxa de plataforma...');
            
            const success = await window.realContractService.payPlatformFee();
            if (success) {
                alert('✅ Taxa de plataforma paga com sucesso!');
                
                // Aguardar propagação da transação
                console.log('⏳ Aguardando propagação da transação...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Recarregar interface usando novo sistema
                await this.refreshCurrentPage();
            } else {
                alert('❌ Erro ao pagar taxa de plataforma');
            }
        } catch (error) {
            console.error('❌ Erro ao pagar taxa:', error);
            alert('❌ Erro ao pagar taxa: ' + error.message);
        }
    }

    // Função para confirmar identidade do payer
    async confirmPayer() {
        try {
            console.log('✅ Confirmando identidade do payer...');
            
            await window.realContractService.confirmPayer();
            alert('✅ Identidade do payer confirmada!');
            
            // Aguardar um pouco para a transação ser propagada
            console.log('⏳ Aguardando propagação da transação...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Recarregar contratos para atualizar interface
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao confirmar payer:', error);
            alert('❌ Erro ao confirmar payer: ' + error.message);
        }
    }

    // Função para confirmar identidade do payee
    async confirmPayee() {
        try {
            console.log('✅ Confirmando identidade do payee...');
            
            await window.realContractService.confirmPayee();
            alert('✅ Identidade do payee confirmada!');
            
            // Aguardar propagação da transação
            console.log('⏳ Aguardando propagação da transação...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Recarregar contratos para atualizar interface
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao confirmar payee:', error);
            alert('❌ Erro ao confirmar payee: ' + error.message);
        }
    }

    // Função para liberar marco
    async releaseMilestone(milestoneIndex) {
        try {
            console.log(`✅ Liberando marco ${milestoneIndex}...`);
            
            await window.realContractService.releaseMilestone(milestoneIndex);
            alert(`✅ Marco ${milestoneIndex + 1} liberado com sucesso!`);
            
            // Aguardar propagação
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao liberar marco:', error);
            alert('❌ Erro ao liberar marco: ' + error.message);
        }
    }

    // Função para propor settlement
    async proposeSettlement() {
        try {
            console.log('🤝 Propondo settlement...');
            
            const amount = prompt('Digite o valor em USDC que deseja pagar ao payee (acordo parcial):');
            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                alert('❌ Valor inválido');
                return;
            }
            
            await window.realContractService.proposeSettlement(parseFloat(amount));
            alert('✅ Settlement proposto com sucesso!');
            
            // Aguardar propagação
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao propor settlement:', error);
            alert('❌ Erro ao propor settlement: ' + error.message);
        }
    }

    // Função para aprovar settlement (payee)
    async approveSettlement() {
        try {
            console.log('✅ Aprovando settlement...');
            
            await window.realContractService.approveSettlement();
            alert('✅ Settlement aprovado com sucesso!');
            
            // Aguardar propagação
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao aprovar settlement:', error);
            alert('❌ Erro ao aprovar settlement: ' + error.message);
        }
    }

    // Função para fazer refund
    async refundContract() {
        try {
            console.log('🔄 Fazendo refund...');
            
            const confirm = window.confirm('Tem certeza que deseja fazer refund? Você recuperará 100% do valor depositado.');
            if (!confirm) return;
            
            await window.realContractService.refund();
            alert('✅ Refund realizado com sucesso!');
            
            // Aguardar propagação
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao fazer refund:', error);
            alert('❌ Erro ao fazer refund: ' + error.message);
        }
    }

    // Função para aprovar cancelamento
    async approveCancel() {
        try {
            console.log('❌ Aprovando cancelamento...');
            
            await window.realContractService.approveCancel();
            alert('✅ Cancelamento aprovado! Se a outra parte também aprovar dentro de 1h, o contrato será cancelado.');
            
            // Aguardar propagação
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao aprovar cancelamento:', error);
            alert('❌ Erro ao aprovar cancelamento: ' + error.message);
        }
    }

    // Função para reclamar após prazo
    async claimAfterDeadline() {
        try {
            console.log('⏰ Reclamando após prazo...');
            
            const confirm = window.confirm('Tem certeza que deseja reclamar o saldo restante após o prazo?');
            if (!confirm) return;
            
            await window.realContractService.claimAfterDeadline();
            alert('✅ Saldo reclamado com sucesso!');
            
            // Aguardar propagação
            await new Promise(resolve => setTimeout(resolve, 3000));
            await this.loadRealContracts();
        } catch (error) {
            console.error('❌ Erro ao reclamar após prazo:', error);
            alert('❌ Erro ao reclamar após prazo: ' + error.message);
        }
    }

    async depositContract() {
        try {
            console.log('💰 Iniciando depósito no contrato...');
            
            // Verificar se há contrato conectado
            if (!window.realContractService || !window.realContractService.contract) {
                alert('❌ Nenhum contrato conectado');
                return;
            }
            
            // Verificar se há carteira conectada
            if (!window.walletService || !window.walletService.isConnected) {
                alert('❌ Carteira não conectada');
                return;
            }
            
            // Obter detalhes do contrato
            const contractData = await window.realContractService.getContractDetails();
            console.log('📊 Dados do contrato para depósito:', contractData);
            
            // Verificar se o usuário é o pagador
            const userAddress = window.walletService.account;
            const isPayer = contractData.payer.toLowerCase() === userAddress.toLowerCase();
            
            if (!isPayer) {
                alert('❌ Apenas o pagador pode fazer depósito');
                return;
            }
            
            // Verificar se já foi depositado
            if (contractData.deposited) {
                alert('✅ Contrato já foi depositado');
                return;
            }
            
                // Perguntar o valor do depósito
                const depositAmount = prompt(
                    `💰 Definir Valor do Depósito\n\n` +
                    `Recebedor: ${contractData.payee}\n` +
                    `Prazo: ${contractData.deadline}\n\n` +
                    `Digite o valor em USDC (ex: 8):`
                );
                
                if (!depositAmount || isNaN(depositAmount) || parseFloat(depositAmount) <= 0) {
                    alert('❌ Valor inválido');
                    return;
                }
                
                const confirmDeposit = confirm(
                    `💰 Confirmar Depósito\n\n` +
                    `Valor: ${depositAmount} USDC\n` +
                    `Recebedor: ${contractData.payee}\n` +
                    `Prazo: ${contractData.deadline}\n\n` +
                    `Deseja continuar?`
                );
            
            if (!confirmDeposit) {
                console.log('❌ Depósito cancelado pelo usuário');
                return;
            }
            
                // Executar depósito real
                console.log('🚀 Executando depósito real...');
                
                const success = await this.executeRealDeposit(contractData, parseFloat(depositAmount));
            
            if (success) {
                alert('✅ Depósito realizado com sucesso!');
                // Recarregar interface usando novo sistema
                await this.refreshCurrentPage();
            } else {
                alert('❌ Erro ao realizar depósito');
            }
            
        } catch (error) {
            console.error('❌ Erro ao depositar no contrato:', error);
            alert('❌ Erro ao depositar: ' + error.message);
        }
    }

        /**
         * Executa o depósito real no contrato
         */
        async executeRealDeposit(contractData, depositAmount) {
        try {
            console.log('💳 Executando depósito real no contrato...');
            
            const contract = window.realContractService.contract;
            const signer = window.walletService.signer;
            
            // Conectar contrato com signer
            const contractWithSigner = contract.connect(signer);
            
                // Obter valor total em wei (USDC tem 6 decimais)
                const totalValueWei = ethers.utils.parseUnits(depositAmount.toString(), 6);
                
                console.log('💰 Valor a depositar:', depositAmount, 'USDC');
            console.log('💰 Valor em wei:', totalValueWei.toString());
            
            // Verificar se tem saldo suficiente de USDC
            const usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // USDC.e na Polygon
            const usdcContract = new ethers.Contract(usdcAddress, [
                'function balanceOf(address owner) view returns (uint256)',
                'function approve(address spender, uint256 amount) returns (bool)',
                'function allowance(address owner, address spender) view returns (uint256)'
            ], signer);
            
            const userBalance = await usdcContract.balanceOf(window.walletService.account);
            console.log('💰 Saldo USDC do usuário:', ethers.utils.formatUnits(userBalance, 6), 'USDC');
            
            if (userBalance.lt(totalValueWei)) {
                alert('❌ Saldo insuficiente de USDC');
                return false;
            }
            
            // Verificar allowance
            const allowance = await usdcContract.allowance(window.walletService.account, contract.address);
            console.log('💰 Allowance atual:', ethers.utils.formatUnits(allowance, 6), 'USDC');
            
            if (allowance.lt(totalValueWei)) {
                console.log('🔓 Aprovando USDC para o contrato...');
                
                // Aprovar USDC para o contrato
                const approveTx = await usdcContract.approve(contract.address, totalValueWei);
                console.log('⏳ Aguardando confirmação da aprovação...');
                await approveTx.wait();
                
                console.log('✅ USDC aprovado com sucesso!');
            }
            
            // Executar depósito
            console.log('💳 Executando depósito no contrato...');
            const depositTx = await contractWithSigner.deposit(totalValueWei);
            
            console.log('⏳ Aguardando confirmação do depósito...');
            const receipt = await depositTx.wait();
            
            console.log('✅ Depósito confirmado!');
            console.log('📋 Transaction hash:', receipt.transactionHash);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao executar depósito:', error);
            
            if (error.code === 'ACTION_REJECTED') {
                alert('❌ Transação rejeitada pelo usuário');
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                alert('❌ Saldo insuficiente');
            } else {
                alert('❌ Erro na transação: ' + error.message);
            }
            
            return false;
        }
    }

    async checkStatus() {
        try {
            console.log('📋 Verificando status do contrato...');
            const contractData = await window.realContractService.getContractDetails();
            
            alert(`📊 STATUS DO CONTRATO\n\n` +
                  `💰 Valor: ${contractData.amount} USDC\n` +
                  `💳 Depositado: ${contractData.deposited ? 'Sim' : 'Não'}\n` +
                  `⏰ Prazo: ${contractData.deadline.toLocaleDateString('pt-BR')}\n` +
                  `💵 Saldo Restante: ${contractData.remainingAmount} USDC`);
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            alert('❌ Erro ao verificar status: ' + error.message);
        }
    }

    async approveMilestone(milestoneIndex = 0) {
        try {
            console.log(`✅ Aprovando marco ${milestoneIndex}...`);
            await window.realContractService.releaseMilestone(milestoneIndex);
            alert(`✅ Marco ${milestoneIndex + 1} aprovado com sucesso!`);
            // Recarregar página usando novo sistema
            await this.refreshCurrentPage();
        } catch (error) {
            console.error('❌ Erro ao aprovar marco:', error);
            
            // Verificar se é erro de marco já executado
            if (error.message.includes('Marco ja executado')) {
                alert('⚠️ Este marco já foi executado anteriormente!');
            } else {
                alert('❌ Erro ao aprovar marco: ' + error.message);
            }
        }
    }

    async approveCancel() {
        try {
            console.log('❌ Aprovando cancelamento...');
            await window.realContractService.approveCancel();
            alert('✅ Cancelamento aprovado!');
            // Recarregar página usando novo sistema
            await this.refreshCurrentPage();
        } catch (error) {
            console.error('❌ Erro ao aprovar cancelamento:', error);
            alert('❌ Erro ao aprovar cancelamento: ' + error.message);
        }
    }

    async refundContract() {
        try {
            console.log('🔄 Fazendo refund...');
            await window.realContractService.refund();
            alert('✅ Refund executado com sucesso!');
            // Recarregar página usando novo sistema
            await this.refreshCurrentPage();
        } catch (error) {
            console.error('❌ Erro ao fazer refund:', error);
            alert('❌ Erro ao fazer refund: ' + error.message);
        }
    }

    async showContractDetails() {
        try {
            console.log('👁️ Exibindo detalhes do contrato...');
            
            if (!window.realContractService || !window.realContractService.contract) {
                alert('❌ Nenhum contrato conectado');
                return;
            }
            
            const contractData = await window.realContractService.getContractDetails();
            
            // Criar modal com detalhes
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>📋 Detalhes do Contrato Escrow</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <div><strong>Valor Total:</strong> ${contractData.amount} USDC</div>
                            <div><strong>Saldo Restante:</strong> ${contractData.remainingAmount} USDC</div>
                            <div><strong>Status:</strong> ${contractData.deposited ? '✅ Depositado' : '⏳ Aguardando Depósito'}</div>
                            <div><strong>Pausado:</strong> ${contractData.paused ? '⏸️ Sim' : '▶️ Não'}</div>
                </div>
                
                        <div style="margin-bottom: 20px;">
                            <strong>Participantes:</strong>
                            <div style="margin-left: 15px;">
                                <div><strong>Pagador:</strong> ${contractData.payer}</div>
                                <div><strong>Recebedor:</strong> ${contractData.payee}</div>
                            </div>
                </div>
                
                        <div style="margin-bottom: 20px;">
                            <strong>Prazo:</strong> ${contractData.deadline.toLocaleDateString('pt-BR')}
                </div>
                
                        <div style="margin-bottom: 20px;">
                            <strong>Marcos (${contractData.totalMilestones}):</strong>
                            <div style="margin-left: 15px;">
                                ${contractData.milestonePercentages.map((percent, index) => `
                                    <div>Marco ${index + 1}: ${percent}% - ${contractData.milestoneAmounts[index]} USDC ${contractData.milestoneExecuted[index] ? '✅' : '⏳'}</div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div>
                            <strong>Token:</strong> ${contractData.token}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fechar</button>
                </div>
            </div>
        `;

            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('❌ Erro ao exibir detalhes:', error);
            alert('❌ Erro ao exibir detalhes: ' + error.message);
        }
    }

    async claimAfterDeadline() {
        try {
            console.log('⏰ Reclamando após deadline...');
            await window.realContractService.claimAfterDeadline();
            alert('✅ Reclamação executada com sucesso!');
            // Recarregar página usando novo sistema
            await this.refreshCurrentPage();
        } catch (error) {
            console.error('❌ Erro ao reclamar:', error);
            alert('❌ Erro ao reclamar: ' + error.message);
        }
    }

    async viewContractDetails() {
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
                  `Seu Papel: ${isPayer ? 'PAGADOR' : isPayee ? 'RECEBEDOR' : 'OBSERVADOR'}`);
        } catch (error) {
            console.error('❌ Erro ao mostrar detalhes:', error);
            alert('❌ Erro ao mostrar detalhes: ' + error.message);
        }
    }

    /**
     * Renderiza a lista de contratos
     */
    renderContractsList() {
        const contractsList = document.getElementById('contractsList');
        if (!contractsList) return;

        // Usar dados do ContractService
        const contracts = window.contractService?.getContracts() || [];
        
        if (contracts.length === 0) {
            contractsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>Nenhum contrato encontrado</h3>
                    <p>Crie seu primeiro contrato de escrow para começar</p>
                    <button class="btn-primary" onclick="window.navigationService.navigateTo('create')">
                        Criar Primeiro Contrato
                    </button>
                </div>
            `;
            return;
        }

        contractsList.innerHTML = contracts.map(contract => `
            <div class="contract-item" data-status="${contract.status}">
                <div class="contract-header">
                    <h4>${contract.title}</h4>
                    <span class="status-badge ${contract.status}">${this.getStatusText(contract.status)}</span>
                </div>
                <div class="contract-details">
                    <p><strong>Valor:</strong> R$ ${(contract.totalValue || 0).toLocaleString()}</p>
                    <p><strong>Marcos:</strong> ${(contract.milestones || []).length}</p>
                    <p><strong>Criado:</strong> ${contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
                <div class="contract-actions">
                    <button class="btn-secondary" onclick="window.navigationService.viewContract('${contract.id}')">
                        👁️ Ver Detalhes
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Retorna texto do status
     */
    getStatusText(status) {
        const statusMap = {
            'pending': '⏳ Pendente',
            'active': '✅ Ativo',
            'disputed': '⚠️ Disputado',
            'completed': '🎉 Concluído'
        };
        return statusMap[status] || status;
    }

    /**
     * Bind dos eventos do formulário de criação
     */
    bindCreateFormEvents() {
        const form = document.getElementById('createContractForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateContract();
            });
        }
    }

    /**
     * Bind dos eventos de filtro
     */
    bindFilterEvents() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover classe active de todos
                filterBtns.forEach(b => b.classList.remove('active'));
                // Adicionar classe active ao clicado
                e.target.classList.add('active');
                
                // Aplicar filtro
                const filter = e.target.dataset.filter;
                this.applyFilter(filter);
            });
        });
    }

    /**
     * Aplica filtro na lista de contratos
     */
    applyFilter(filter) {
        const contractItems = document.querySelectorAll('.contract-item');
        
        contractItems.forEach(item => {
            if (filter === 'all' || item.dataset.status === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Visualiza detalhes de um contrato
     */
    viewContract(contractId) {
        console.log(`👁️ Visualizando contrato: ${contractId}`);
        
        // Buscar contrato na lista
        const contract = this.contracts.find(c => c.id === contractId);
        
        if (contract) {
            // Mostrar modal com detalhes
            this.showContractModal(contract);
        } else {
            console.warn(`Contrato não encontrado: ${contractId}`);
        }
    }

    /**
     * Mostra modal com detalhes do contrato
     */
    showContractModal(contract) {
        const modal = document.getElementById('contractModal');
        const modalContent = document.getElementById('modalContent');
        
        if (modal && modalContent) {
            modalContent.innerHTML = `
                <div class="contract-modal-header">
                    <h3>${contract.title}</h3>
                    <span class="status-badge ${contract.status}">${this.getStatusText(contract.status)}</span>
                </div>
                <div class="contract-modal-body">
                    <p><strong>Tipo:</strong> ${contract.type}</p>
                    <p><strong>Valor:</strong> R$ ${(contract.totalValue || 0).toLocaleString()}</p>
                    <p><strong>Marcos:</strong> ${(contract.milestones || []).length}</p>
                    <p><strong>Cliente:</strong> ${contract.clientAddress || 'N/A'}</p>
                    <p><strong>Fornecedor:</strong> ${contract.supplierAddress || 'N/A'}</p>
                    <p><strong>Criado:</strong> ${contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                </div>
            `;
            
            modal.style.display = 'block';
        }
    }

    /**
     * Manipula criação de contrato
     */
    handleCreateContract() {
        const formData = new FormData(document.getElementById('createContractForm'));
        const contractData = {
            type: document.getElementById('contractType').value,
            clientAddress: document.getElementById('clientAddress').value,
            supplierAddress: document.getElementById('supplierAddress').value,
            totalValue: parseFloat(document.getElementById('totalValue').value),
            milestoneCount: parseInt(document.getElementById('milestoneCount').value)
        };

        // Validar dados
        if (!this.validateContractData(contractData)) {
            return;
        }

        // Criar contrato via ContractService
        if (window.contractService) {
            const newContract = window.contractService.createContract(contractData);
            if (newContract) {
                alert('✅ Contrato criado com sucesso!');
                this.navigateTo('manage');
            } else {
                alert('❌ Erro ao criar contrato. Tente novamente.');
            }
        }
    }

    /**
     * Valida dados do contrato
     */
    validateContractData(data) {
        if (!data.type) {
            alert('❌ Selecione o tipo de contrato');
            return false;
        }
        if (!data.clientAddress || !data.supplierAddress) {
            alert('❌ Preencha os endereços das carteiras');
            return false;
        }
        if (!data.totalValue || data.totalValue < 1000) {
            alert('❌ Valor deve ser maior que R$ 1.000');
            return false;
        }
        if (!data.milestoneCount || data.milestoneCount < 2) {
            alert('❌ Selecione pelo menos 2 marcos');
            return false;
        }
        return true;
    }

    /**
     * Obtém página atual
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * Verifica se está em uma página específica
     */
    isOnPage(pageId) {
        return this.currentPage === pageId;
    }

    /**
     * Restaura a página inicial (para uso do botão voltar)
     */
    restoreHomePage() {
        console.log('🔄 Restaurando página inicial...');
        
        // Limpar hash da URL sem recarregar
        history.replaceState(null, '', ' ');
        
        // Atualizar estado e renderizar home
        this.currentPage = 'home';
        this.renderPage('home');
    }

    /**
     * Mostra modal de ajuda com explicações detalhadas
     */
    showHelpModal() {
        console.log('📖 Mostrando modal de ajuda...');
        
        const modal = document.createElement('div');
        modal.className = 'help-modal-overlay';
        modal.innerHTML = `
            <div class="help-modal-content">
                <div class="help-modal-header">
                    <h2>📚 Como Funciona o Deal-Fi</h2>
                    <button class="close-help-btn" onclick="window.navigationService.closeHelpModal(this.closest('.help-modal-overlay'))">×</button>
                </div>
                
                <div class="help-modal-body">
                    <div class="help-section">
                        <h3>🚀 Fluxo Completo do Deal-Fi</h3>
                        <p>Este é o fluxo exato que o smart contract segue, desde o deploy até o encerramento:</p>
                    </div>
                    
                    <div class="help-section">
                        <h3>1️⃣ FASE INICIAL: Deploy e Validações</h3>
                        <p><strong>🚀 Deploy do Smart Contract</strong><br>
                        Por Payer ou Payee com parâmetros: payer, payee, duration, token USDC, milestones array</p>
                        
                        <p><strong>✓ Validações no Construtor:</strong></p>
                        <ul>
                            <li>Endereços válidos</li>
                            <li>Percentuais somam 100%</li>
                            <li>Máximo 10 marcos</li>
                        </ul>
                        <p><strong>❌ Falha → Contrato não ativado</strong></p>
                        
                        <p><strong>⚙️ Contrato Ativo</strong><br>
                        deadline = block.timestamp + duration<br>
                        deposited = false, confirmedPayer = false, confirmedPayee = false</p>
                    </div>
                    
                    <div class="help-section">
                        <h3>2️⃣ FASE DE ATIVAÇÃO: Taxa e Confirmações</h3>
                        <p><strong>💰 Taxa de Plataforma: 1 USDC</strong><br>
                        Transferido por qualquer parte para: 0xC101e76Da55BC93438a955546E93D56312a3CF16<br>
                        Evento: PlatformFeePaid</p>
                        
                        <p><strong>⏳ Aguardando Confirmações Mútuas</strong><br>
                        Ambas as partes devem confirmar identidade:</p>
                        <ul>
                            <li>Payer: confirmPayer() → confirmedPayer = true</li>
                            <li>Payee: confirmPayee() → confirmedPayee = true</li>
                        </ul>
                        <p><strong>❌ Falha → Allowance insuficiente, valor ≤0, já depositado</strong></p>
                        
                        <p><strong>🔓 Depósito Integral Permitido</strong><br>
                        Payer: token.approve(address(this), amount)<br>
                        Payer: deposit(amount)<br>
                        <strong>✅ Sucesso → Depósito integral efetuado, garantia trancada</strong></p>
                    </div>
                    
                    <div class="help-section">
                        <h3>3️⃣ FASE DE EXECUÇÃO: Escolhas do Payer</h3>
                        <p><strong>🎯 Escolha do Payer (Disponível SEMPRE)</strong><br>
                        Antes e após deadline, o Payer pode escolher:</p>
                        
                        <h4>📤 Opção 1: Liberar Marco</h4>
                        <p><strong>releaseMilestone(index)</strong></p>
                        <ul>
                            <li>require msg.sender == payer</li>
                            <li>require deposited == true</li>
                            <li>SEM verificação de deadline</li>
                        </ul>
                        <p><strong>❌ Falha → Não sequencial, marco já executado, índice inválido</strong><br>
                        <strong>✅ Sucesso → Transfer ao Payee, Evento: MilestoneReleased</strong></p>
                        
                        <h4>🚫 Opção 2: Cancel Bilateral</h4>
                        <p><strong>approveCancel</strong></p>
                        <ul>
                            <li>require msg.sender == payer OR payee</li>
                            <li>require deposited == true</li>
                            <li>SEM verificação de deadline</li>
                            <li>Registra timestamp da aprovação</li>
                        </ul>
                        <p><strong>⚠️ Janela 1h expirada → Contrato continua ativo</strong><br>
                        <strong>✅ Sucesso → Devolve 100% saldo ao Payer, Evento: Cancelled</strong></p>
                        
                        <h4>↩️ Opção 3: Refund Unilateral</h4>
                        <p><strong>refund</strong></p>
                        <ul>
                            <li>require msg.sender == payer</li>
                            <li>require deposited == true</li>
                        </ul>
                        <p><strong>❌ Falha → Primeiro marco já executado</strong><br>
                        <strong>✅ Sucesso → Devolve 100% ao Payer, Evento: Refunded</strong></p>
                        
                        <h4>⏰ Opção 4: Saque Pós-Prazo</h4>
                        <p><strong>claimAfterDeadline</strong></p>
                        <ul>
                            <li>require msg.sender == payer</li>
                            <li>require deposited == true</li>
                            <li>require block.timestamp > deadline</li>
                        </ul>
                        <p><strong>❌ Falha → Não depositado ou prazo não expirado</strong><br>
                        <strong>✅ Sucesso → Devolve saldo ao Payer, Evento: ClaimedAfterDeadline</strong></p>
                    </div>
                    
                    <div class="help-section">
                        <h3>4️⃣ FASE DE SETTLEMENT (Opcional)</h3>
                        <p><strong>Se Cancel Bilateral for escolhido:</strong></p>
                        <ul>
                            <li>Payer: proposeSettlement(amount) → Registra timestamp</li>
                            <li>Payee: approveSettlement (dentro de 1h)</li>
                        </ul>
                        <p><strong>✅ Sucesso → Acordo: Parte ao Payee, Resto ao Payer, Evento: Settled</strong><br>
                        <strong>⚠️ Timeout → Cancelamento normal</strong></p>
                    </div>
                    
                    <div class="help-section">
                        <h3>5️⃣ FASE FINAL: Encerramento</h3>
                        <p><strong>🎉 Fim: Execução Plena</strong><br>
                        Contrato encerrado quando:</p>
                        <ul>
                            <li>Todos os marcos liberados</li>
                            <li>Cancelamento bilateral executado</li>
                            <li>Settlement aprovado</li>
                            <li>Refund unilateral executado</li>
                            <li>Saque pós-prazo executado</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>⚠️ Fluxos de Invalidação</h3>
                        <p><strong>❌ Fim: Nulidade Inicial</strong><br>
                        Contrato não ativado quando:</p>
                        <ul>
                            <li>Vício no construtor (endereços inválidos, % ≠100, máx 10 marcos)</li>
                            <li>Allowance insuficiente, valor ≤0, já depositado, taxa não paga</li>
                            <li>Não sequencial, marco já executado, índice inválido</li>
                            <li>Primeiro marco já executado para refund</li>
                            <li>Não depositado ou prazo não expirado para saque</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>🔧 Informações Técnicas</h3>
                        <ul>
                            <li><strong>Smart Contract:</strong> EscrowUSDC_Dynamic_Production.sol</li>
                            <li><strong>Rede:</strong> Polygon Mainnet (Chain ID: 137)</li>
                            <li><strong>Token USDC:</strong> 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359</li>
                            <li><strong>Taxa de Plataforma:</strong> 1 USDC para 0xC101e76Da55BC93438a955546E93D56312a3CF16</li>
                            <li><strong>Janela de Cancelamento:</strong> 1 hora após primeira aprovação</li>
                            <li><strong>Janela de Settlement:</strong> 1 hora após proposta</li>
                        </ul>
                    </div>
                </div>
                
                <div class="help-modal-footer">
                    <button class="btn-primary" onclick="window.navigationService.closeHelpModal(this.closest('.help-modal-overlay'))">
                        Entendi! Vamos Começar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Fecha o modal de ajuda com transição suave
     */
    closeHelpModal(modal) {
        if (modal) {
            modal.classList.add('closing');
            setTimeout(() => {
                modal.remove();
            }, 200); // Tempo da animação de fechamento
        }
    }
    
    /**
     * Configura eventos do modal
     */
    setupModalEvents() {
        // Fechar modal ao clicar no X
        const closeBtn = document.getElementById('modalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const modal = document.getElementById('contractModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Fechar modal ao clicar fora dele
        const modal = document.getElementById('contractModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    async loadRealContracts() {
        try {
            if (window.realContractService && window.realContractService.contract) {
                console.log('🔍 Carregando contratos reais...');
                const contracts = await window.realContractService.fetchRealContracts();
                console.log('✅ Contratos reais carregados:', contracts);
                
                // Atualizar estatísticas
                if (window.summaryCardsComponent) {
                    const stats = await window.realContractService.getStats();
                    console.log('📊 Estatísticas atualizadas:', stats);
                }
                
                // Re-renderizar a página de gerenciamento se estivermos nela
                if (this.currentPage === 'manage') {
                    console.log('🔄 Re-renderizando página de gerenciamento...');
                    await this.loadStateBasedUI();
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar contratos reais:', error);
        }
    }

    async testRealConnection() {
        try {
            console.log('🧪 Testando conexão com contrato real...');
            
            // Verificar se MetaMask está disponível
            if (!window.ethereum) {
                console.log('❌ window.ethereum não encontrado');
                console.log('🔍 Verificando alternativas...');
                
                // Tentar detectar MetaMask de outras formas
                if (window.web3) {
                    console.log('✅ window.web3 encontrado');
                } else {
                    console.log('❌ window.web3 também não encontrado');
                }
                
                // Verificar se MetaMask está instalado mas não detectado
                if (typeof window.ethereum === 'undefined') {
                    alert('❌ MetaMask não detectado!\n\n' +
                          'Tente:\n' +
                          '1. Recarregar a página (F5)\n' +
                          '2. Verificar se MetaMask está ativo\n' +
                          '3. Permitir acesso ao site');
                    return;
                }
            }

            // Conectar com MetaMask
            console.log('🔗 Conectando com MetaMask...');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log('✅ Carteira conectada:', account);

            // Criar provider e signer
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Conectar com contrato real
            console.log('🔗 Conectando com contrato:', window.ESCROW_CONTRACT_ADDRESS);
            const contract = new ethers.Contract(
                window.ESCROW_CONTRACT_ADDRESS,
                window.escrowABI,
                signer
            );

            // Testar leitura do contrato
            console.log('📖 Testando leitura do contrato...');
            const payer = await contract.payer();
            const payee = await contract.payee();
            const amount = await contract.amount();
            const deposited = await contract.deposited();
            const deadline = await contract.deadline();

            console.log('✅ Dados do contrato lidos com sucesso!');
            console.log('📊 Dados:', {
                payer,
                payee,
                amount: ethers.formatUnits(amount, 6) + ' USDC',
                deposited,
                deadline: new Date(parseInt(deadline) * 1000).toLocaleString()
            });

            // Mostrar resultado
            alert(`✅ Conexão com contrato real bem-sucedida!\n\n` +
                  `Endereço: ${window.ESCROW_CONTRACT_ADDRESS}\n` +
                  `Pagador: ${payer}\n` +
                  `Recebedor: ${payee}\n` +
                  `Valor: ${ethers.formatUnits(amount, 6)} USDC\n` +
                  `Depositado: ${deposited ? 'Sim' : 'Não'}\n` +
                  `Prazo: ${new Date(parseInt(deadline) * 1000).toLocaleString()}`);

            // Atualizar interface
            await this.loadRealContracts();

        } catch (error) {
            console.error('❌ Erro ao testar conexão:', error);
            alert('❌ Erro ao conectar com contrato real:\n\n' + error.message);
        }
    }

    debugMetaMask() {
        console.log('🔍 === DEBUG METAMASK ===');
        console.log('window.ethereum:', window.ethereum);
        console.log('typeof window.ethereum:', typeof window.ethereum);
        console.log('window.web3:', window.web3);
        console.log('typeof window.web3:', typeof window.web3);
        console.log('window.MetaMask:', window.MetaMask);
        console.log('navigator.userAgent:', navigator.userAgent);
        
        // Verificar se MetaMask está disponível
        if (window.ethereum) {
            console.log('✅ window.ethereum encontrado!');
            console.log('isMetaMask:', window.ethereum.isMetaMask);
            console.log('chainId:', window.ethereum.chainId);
            console.log('networkVersion:', window.ethereum.networkVersion);
        } else {
            console.log('❌ window.ethereum não encontrado');
        }
        
        // Mostrar resultado
        const result = `
🔍 DEBUG METAMASK:
• window.ethereum: ${window.ethereum ? '✅ Encontrado' : '❌ Não encontrado'}
• typeof: ${typeof window.ethereum}
• window.web3: ${window.web3 ? '✅ Encontrado' : '❌ Não encontrado'}
• isMetaMask: ${window.ethereum?.isMetaMask ? '✅ Sim' : '❌ Não'}
• chainId: ${window.ethereum?.chainId || 'N/A'}
• networkVersion: ${window.ethereum?.networkVersion || 'N/A'}
        `;
        
        alert(result);
        console.log('🔍 === FIM DEBUG ===');
    }

    async forceMetaMaskConnection() {
        console.log('🚀 Forçando conexão com MetaMask...');
        
        let ethereum = null;
        
        // Método 1: Usar detectEthereumProvider (recomendado)
        if (typeof detectEthereumProvider !== 'undefined') {
            console.log('🔍 Usando detectEthereumProvider...');
            ethereum = await detectEthereumProvider();
            if (ethereum) {
                console.log('✅ MetaMask encontrado via detectEthereumProvider');
            }
        }
        
        // Método 2: window.ethereum (fallback)
        if (!ethereum && window.ethereum) {
            ethereum = window.ethereum;
            console.log('✅ MetaMask encontrado via window.ethereum');
        }
        
        // Método 3: window.web3.currentProvider (fallback)
        if (!ethereum && window.web3 && window.web3.currentProvider) {
            ethereum = window.web3.currentProvider;
            console.log('✅ MetaMask encontrado via window.web3.currentProvider');
        }
        
        if (!ethereum) {
            console.log('❌ MetaMask não encontrado');
            alert('❌ MetaMask não encontrado!\n\n' +
                  'IMPORTANTE: O MetaMask só funciona quando o site roda em um servidor!\n\n' +
                  'Soluções:\n' +
                  '1. Use um servidor local (npx serve, http-server)\n' +
                  '2. Não abra arquivos HTML diretamente\n' +
                  '3. Teste em localhost:3000 ou similar\n\n' +
                  'Para testar agora:\n' +
                  '• Abra o terminal\n' +
                  '• Execute: npx serve escrow-dapp/frontend\n' +
                  '• Acesse o link fornecido');
            return false;
        }
        
        try {
            console.log('🔗 Conectando com MetaMask...');
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const account = accounts[0];
            console.log('✅ Carteira conectada:', account);
            
            // Criar provider e signer (ethers v5) - FORÇAR POLYGON
            const provider = new ethers.providers.Web3Provider(ethereum, "any");
            const signer = provider.getSigner();
            
            // Forçar conexão com contas
            await provider.send("eth_requestAccounts", []);
            
            // Debug da rede
            console.log('🔍 Debug da rede...');
            const network = await provider.getNetwork();
            console.log('📡 Rede:', network);
            
            // Verificar se está na Polygon Mainnet
            if (network.chainId !== 137) {
                throw new Error(`Rede incorreta! Atual: ${network.chainId}, Necessário: 137 (Polygon Mainnet)`);
            }
            
            console.log('✅ Conectado à Polygon Mainnet!');
            
            const blockNumber = await provider.getBlockNumber();
            console.log('📦 Block atual:', blockNumber);
            
            // Conectar com contrato real
            const contractAddress = "0xE960D1E2A2D5F5B629C022EEd464e53BB8B09AA9";
            console.log('🔗 Conectando com contrato:', contractAddress);
            
            const balance = await provider.getBalance(contractAddress);
            console.log('💰 Saldo do contrato:', ethers.utils.formatEther(balance), 'POL');
            
            // Buscar ABI do PolygonScan
            console.log('🔍 Buscando ABI do PolygonScan...');
            try {
                const abiResponse = await fetch(`https://api.polygonscan.com/api?module=contract&action=getabi&address=${contractAddress}`);
                const abiData = await abiResponse.json();
                
                if (abiData.status === '1') {
                    const realABI = JSON.parse(abiData.result);
                    console.log('✅ ABI encontrado no PolygonScan:', realABI);
                    
                    // Usar o ABI real
                    const contract = new ethers.Contract(contractAddress, realABI, signer);
                    
                    // Testar funções do ABI real
                    console.log('📖 Testando funções do ABI real...');
                    
                    // Listar todas as funções disponíveis
                    const functions = realABI.filter(item => item.type === 'function');
                    console.log('📋 Funções disponíveis:', functions.map(f => f.name));
                    
                    alert(`✅ ABI encontrado no PolygonScan!\n\n` +
                          `Funções disponíveis: ${functions.map(f => f.name).join(', ')}\n\n` +
                          `Veja o console para detalhes`);
                    
                    return true;
                } else {
                    console.log('❌ ABI não encontrado no PolygonScan:', abiData.message);
                }
            } catch (e) {
                console.log('❌ Erro ao buscar ABI:', e.message);
            }
            
            // ABI correto baseado no código do contrato
            const correctABI = [
                {
                    "inputs": [],
                    "name": "payer",
                    "outputs": [{"name": "", "type": "address"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "payee",
                    "outputs": [{"name": "", "type": "address"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "token",
                    "outputs": [{"name": "", "type": "address"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "amount",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "deposited",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "deadline",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "m1PayerApproved",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "m1PayeeApproved",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "m2PayerApproved",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "m2PayeeApproved",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "m1Executed",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "m2Executed",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "cancelPayerApproved",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "cancelPayeeApproved",
                    "outputs": [{"name": "", "type": "bool"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "remaining",
                    "outputs": [{"name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "halves",
                    "outputs": [
                        {"name": "half1", "type": "uint256"},
                        {"name": "half2", "type": "uint256"}
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ];
            
            console.log('📋 ABI correto carregado:', correctABI);
            const contract = new ethers.Contract(
                contractAddress,
                correctABI,
                signer
            );
            
            // Testar se o contrato existe
            console.log('📖 Testando se o contrato existe...');
            
            // Tentar ler o código do contrato
            const code = await provider.getCode(contractAddress);
            console.log('📋 Código do contrato:', code);
            
            if (code === '0x') {
                throw new Error('Contrato não encontrado neste endereço');
            }
            
            // Testar funções do contrato EscrowUSDC
            let payer, payee, amount, deposited, deadline, token, remaining;
            
            try {
                payer = await contract.payer();
                console.log('✅ payer():', payer);
            } catch (e) {
                console.log('❌ payer() não existe:', e.message);
            }
            
            try {
                payee = await contract.payee();
                console.log('✅ payee():', payee);
            } catch (e) {
                console.log('❌ payee() não existe:', e.message);
            }
            
            try {
                token = await contract.token();
                console.log('✅ token():', token);
            } catch (e) {
                console.log('❌ token() não existe:', e.message);
            }
            
            try {
                amount = await contract.amount();
                console.log('✅ amount():', amount);
            } catch (e) {
                console.log('❌ amount() não existe:', e.message);
            }
            
            try {
                deposited = await contract.deposited();
                console.log('✅ deposited():', deposited);
            } catch (e) {
                console.log('❌ deposited() não existe:', e.message);
            }
            
            try {
                deadline = await contract.deadline();
                console.log('✅ deadline():', deadline);
            } catch (e) {
                console.log('❌ deadline() não existe:', e.message);
            }
            
            try {
                remaining = await contract.remaining();
                console.log('✅ remaining():', remaining);
            } catch (e) {
                console.log('❌ remaining() não existe:', e.message);
            }
            
            // Mostrar resultado com dados reais
            const deadlineDate = new Date(parseInt(deadline.toString()) * 1000);
            const amountFormatted = ethers.utils.formatUnits(amount, 6); // USDC tem 6 decimais
            
            alert(`✅ Contrato encontrado e funcionando!\n\n` +
                  `Endereço: ${contractAddress}\n` +
                  `Pagador: ${payer}\n` +
                  `Recebedor: ${payee}\n` +
                  `Token: ${token}\n` +
                  `Valor: ${amountFormatted} USDC\n` +
                  `Depositado: ${deposited ? 'Sim' : 'Não'}\n` +
                  `Prazo: ${deadlineDate.toLocaleString()}\n\n` +
                  `🎉 Sistema conectado com sucesso!`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao forçar conexão:', error);
            alert('❌ Erro ao conectar:\n\n' + error.message);
            return false;
        }
    }
}

// Instância global do serviço
window.navigationService = new NavigationService();

// Log de debug
console.log('🔧 NavigationService inicializado:', window.navigationService);
