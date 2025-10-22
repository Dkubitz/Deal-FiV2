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
                walletNotice.style.display = 'none';
                quickActions.style.display = 'flex';
                console.log('✅ Interface atualizada: carteira conectada - mostrando botões');
            } else {
                walletNotice.style.display = 'flex';
                quickActions.style.display = 'none';
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
        // Usar o formulário avançado do create-contract-form.js
        container.innerHTML = window.createContractForm.render();
        
        // Inicializar eventos do formulário avançado
        window.createContractForm.bindEvents();
    }

    /**
     * Renderiza a página de gerenciamento de contratos
     */
    async renderManagePage(container) {
        container.innerHTML = `
            <div class="manage-contracts-page">
                <!-- Botão Voltar no canto superior esquerdo -->
                <div class="top-back-button">
                    <button class="back-btn-top" onclick="window.navigationService.restoreHomePage()">
                        ← Voltar
                    </button>
                </div>
                
                
                <div class="contracts-list" id="contractsList">
                    <!-- Contratos reais serão renderizados aqui -->
                    <div class="loading-message">
                        <p>🔄 Carregando seus contratos...</p>
                        </div>
                        </div>
                        </div>
        `;

        // Carregar contratos reais APENAS quando entrar na página de gerenciamento
        await this.loadRealContractsForManage();
        console.log('📋 Página de gerenciamento carregada com contratos reais');
    }

    /**
     * Carrega contratos reais para a página de gerenciamento
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
                
                if (!contractData.deposited) {
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
                    statusText = '💰 Contrato Ativo';
                    statusColor = '#10b981';
                    
                    if (isPayer) {
                        // Botões específicos para PAGADOR
                        actionsHTML = '';
                        
                        // Verificar quais marcos ainda não foram executados
                        const pendingMilestones = [];
                        for (let i = 0; i < contractData.milestoneExecuted.length; i++) {
                            if (!contractData.milestoneExecuted[i]) {
                                pendingMilestones.push(i);
                            }
                        }
                        
                        // Mostrar botões para marcos pendentes
                        if (pendingMilestones.length > 0) {
                            pendingMilestones.forEach(milestoneIndex => {
                                actionsHTML += `
                                    <button class="btn-primary" onclick="window.navigationService.approveMilestone(${milestoneIndex})">
                                        ✅ Aprovar Marco ${milestoneIndex + 1}
                                    </button>
                                `;
                            });
                        } else {
                            actionsHTML += `
                                <div class="milestone-status">
                                    <span class="status-text">✅ Todos os marcos foram executados</span>
                                </div>
                            `;
                        }
                        
                        actionsHTML += `
                            <button class="btn-warning" onclick="window.navigationService.approveCancel()">
                                ❌ Aprovar Cancelamento
                            </button>
                            <button class="btn-danger" onclick="window.navigationService.claimAfterDeadline()">
                                ⏰ Reclamar Após Prazo
                            </button>
                        `;
                    } else if (isPayee) {
                        // Botões específicos para RECEBEDOR
                        actionsHTML = `
                            <button class="btn-warning" onclick="window.navigationService.approveCancel()">
                                ❌ Aprovar Cancelamento
                            </button>
                            <button class="btn-danger" onclick="window.navigationService.refundContract()">
                                🔄 Fazer Refund
                            </button>
                        `;
                    }
                }
                
                // Adicionar botão para ver detalhes
                actionsHTML += `
                    <button class="btn-secondary" onclick="window.navigationService.viewContractDetails()">
                        🔍 Ver Detalhes
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
                        <button class="btn-primary" onclick="window.navigationService.loadRealContractsForManage()">
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
                // Recarregar interface
                await this.loadRealContractsForManage();
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
            // Recarregar página
            await this.loadRealContractsForManage();
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
            // Recarregar página
            await this.loadRealContractsForManage();
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
            // Recarregar página
            await this.loadRealContractsForManage();
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
            // Recarregar página
            await this.loadRealContractsForManage();
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
                  `👤 Seu Papel: ${isPayer ? 'PAGADOR' : isPayee ? 'RECEBEDOR' : 'OBSERVADOR'}`);
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
                    <button class="close-help-btn" onclick="this.closest('.help-modal-overlay').remove()">×</button>
                </div>
                
                <div class="help-modal-body">
                    <div class="help-section">
                        <h3>🔒 O que é Escrow?</h3>
                        <p>Escrow é um sistema de pagamento seguro onde o dinheiro fica "em custódia" até que as condições do contrato sejam atendidas. É como um intermediário confiável que garante que ambas as partes cumpram seus compromissos.</p>
                    </div>
                    
                    <div class="help-section">
                        <h3>💡 Como Funciona?</h3>
                        <ol>
                            <li><strong>Pagador</strong> cria um contrato e define marcos/entregas</li>
                            <li><strong>Pagador</strong> deposita USDC no contrato inteligente</li>
                            <li><strong>Recebedor</strong> entrega o trabalho conforme os marcos</li>
                            <li><strong>Pagador</strong> aprova cada marco liberando o pagamento</li>
                            <li><strong>Recebedor</strong> recebe os USDC automaticamente</li>
                        </ol>
                    </div>
                    
                    <div class="help-section">
                        <h3>📝 Condições do Contrato</h3>
                        <ul>
                            <li><strong>Valor Mínimo:</strong> $1 USDC (antes era $10)</li>
                            <li><strong>Marcos:</strong> 1 a 10 marcos por contrato</li>
                            <li><strong>Percentuais:</strong> Personalizáveis (ex: 50%/50% ou 30%/70%)</li>
                            <li><strong>Prazo:</strong> Definido pelo pagador (ex: 30 dias)</li>
                            <li><strong>Token:</strong> USDC na rede Polygon (endereço: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359)</li>
                            <li><strong>Rede:</strong> Polygon Mainnet (taxas baixas)</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>🎮 Botões de Ação Disponíveis</h3>
                        
                        <h4>👤 Para o PAGADOR (criador do contrato):</h4>
                        <ul>
                            <li><strong>🟣 "Depositar USDC":</strong> Faz o depósito inicial no contrato</li>
                            <li><strong>🟣 "Aprovar Marco":</strong> Libera pagamento para marco aprovado</li>
                            <li><strong>🟣 "Aprovar Cancelamento":</strong> Confirma cancelamento conjunto</li>
                            <li><strong>🟣 "Reclamar Após Prazo":</strong> Recupera dinheiro se prazo expirar</li>
                            <li><strong>🟣 "Ver Detalhes":</strong> Mostra informações completas do contrato</li>
                        </ul>
                        
                        <h4>👤 Para o RECEBEDOR:</h4>
                        <ul>
                            <li><strong>🟣 "Aprovar Cancelamento":</strong> Confirma cancelamento conjunto</li>
                            <li><strong>🟣 "Fazer Refund":</strong> Devolve dinheiro para o pagador</li>
                            <li><strong>🟣 "Ver Detalhes":</strong> Mostra informações completas do contrato</li>
                        </ul>
                        
                        <p><strong>💡 Nota:</strong> Os botões são exibidos automaticamente baseado no seu papel no contrato!</p>
                        
                        <h4>⚙️ Estados do Contrato:</h4>
                        <ul>
                            <li><strong>🟢 "Contrato Ativo":</strong> Funcionando normalmente</li>
                            <li><strong>🟡 "Aguardando Depósito":</strong> Pagador ainda não depositou</li>
                            <li><strong>🔴 "Prazo Expirado":</strong> Pagador pode reclamar dinheiro</li>
                            <li><strong>⚫ "Cancelado":</strong> Contrato finalizado por acordo</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>⚡ Principais Funcionalidades</h3>
                        <ul>
                            <li><strong>Marcos Dinâmicos:</strong> Defina quantos marcos quiser (1-10)</li>
                            <li><strong>Percentuais Personalizados:</strong> 50%/50% ou 30%/70% etc.</li>
                            <li><strong>Prazo de Segurança:</strong> Recupere seu dinheiro se o prazo expirar</li>
                            <li><strong>Cancelamento Conjunto:</strong> Ambas as partes podem cancelar</li>
                            <li><strong>Transparência Total:</strong> Tudo registrado na blockchain</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>🎯 Cenários Práticos de Uso</h3>
                        
                        <h4>📋 Cenário 1: Desenvolvimento de Software</h4>
                        <ul>
                            <li><strong>Marco 1 (30%):</strong> Layout e design aprovado</li>
                            <li><strong>Marco 2 (50%):</strong> Funcionalidades principais prontas</li>
                            <li><strong>Marco 3 (20%):</strong> Testes e entrega final</li>
                        </ul>
                        
                        <h4>📋 Cenário 2: Serviços de Marketing</h4>
                        <ul>
                            <li><strong>Marco 1 (50%):</strong> Estratégia e planejamento</li>
                            <li><strong>Marco 2 (50%):</strong> Execução e resultados</li>
                        </ul>
                        
                        <h4>📋 Cenário 3: Freelancer Simples</h4>
                        <ul>
                            <li><strong>Marco 1 (100%):</strong> Trabalho completo entregue</li>
                        </ul>
                        
                        <h4>⚠️ Casos de Emergência:</h4>
                        <ul>
                            <li><strong>Recebedor some:</strong> Pagador usa "Reclamar Após Prazo"</li>
                            <li><strong>Problemas no projeto:</strong> Ambas as partes usam "Cancelamento"</li>
                            <li><strong>Recebedor quer devolver:</strong> Usa "Fazer Refund"</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>🛡️ Proteções de Segurança</h3>
                        <ul>
                            <li><strong>Para o Pagador:</strong> Dinheiro só sai após aprovação dos marcos</li>
                            <li><strong>Para o Recebedor:</strong> Trabalho aprovado = pagamento garantido</li>
                            <li><strong>Prazo de Expiração:</strong> Recupere dinheiro se recebedor não cumprir</li>
                            <li><strong>Contratos Inteligentes:</strong> Código imutável na blockchain</li>
                            <li><strong>Sem Intermediários:</strong> Você controla totalmente o processo</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>💰 Custos e Taxas</h3>
                        <ul>
                            <li><strong>Criação do Contrato:</strong> Taxa de gás (POL) - ~$1-3</li>
                            <li><strong>Depósito USDC:</strong> Taxa de gás (POL) - ~$0.50</li>
                            <li><strong>Aprovação de Marcos:</strong> Taxa de gás (POL) - ~$0.50</li>
                            <li><strong>Sem Taxas de Plataforma:</strong> 0% sobre o valor do contrato</li>
                        </ul>
                        <p><strong>💡 Dica:</strong> Mantenha sempre pelo menos 5-10 POL na carteira para cobrir todas as taxas de gás necessárias.</p>
                    </div>
                    
                    <div class="help-section">
                        <h3>🚀 Vantagens</h3>
                        <ul>
                            <li>✅ <strong>Segurança Máxima:</strong> Dinheiro protegido por smart contracts</li>
                            <li>✅ <strong>Transparência:</strong> Todas as transações são públicas</li>
                            <li>✅ <strong>Automação:</strong> Pagamentos automáticos após aprovação</li>
                            <li>✅ <strong>Global:</strong> Funciona em qualquer lugar do mundo</li>
                            <li>✅ <strong>Rápido:</strong> Pagamentos instantâneos na blockchain</li>
                            <li>✅ <strong>Sem Bancos:</strong> Controle total do seu dinheiro</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>⚠️ Importante Saber</h3>
                        <ul>
                            <li>• Você precisa de uma carteira (MetaMask) e USDC</li>
                            <li>• <strong>IMPORTANTE:</strong> Você precisa ter POL (Polygon) na carteira para pagar taxas de gás</li>
                            <li>• Todas as transações são irreversíveis</li>
                            <li>• Teste primeiro com valores pequenos</li>
                            <li>• Mantenha suas chaves privadas seguras</li>
                            <li>• O contrato funciona na rede Polygon</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>🔧 Informações Técnicas</h3>
                        <ul>
                            <li><strong>Smart Contract:</strong> EscrowUSDC_Dynamic_Production.sol</li>
                            <li><strong>Rede:</strong> Polygon Mainnet (Chain ID: 137)</li>
                            <li><strong>Token USDC:</strong> 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359</li>
                            <li><strong>Taxa de Cancelamento:</strong> 7 dias de espera após aprovação</li>
                            <li><strong>Limpeza de Poeira:</strong> 7 dias de espera para sweep</li>
                            <li><strong>Pausa de Emergência:</strong> Apenas pagador pode pausar</li>
                            <li><strong>Reentrância:</strong> Protegido contra ataques</li>
                            <li><strong>OpenZeppelin:</strong> Usa bibliotecas auditadas</li>
                        </ul>
                    </div>
                    
                    <div class="help-section">
                        <h3>📞 Suporte e Recursos</h3>
                        <ul>
                            <li><strong>📖 Documentação:</strong> Modal de ajuda sempre disponível</li>
                            <li><strong>🔍 Transparência:</strong> Todas as transações são públicas</li>
                            <li><strong>🛡️ Segurança:</strong> Código aberto e auditável</li>
                            <li><strong>⚡ Velocidade:</strong> Transações em segundos na Polygon</li>
                            <li><strong>💰 Economia:</strong> Taxas muito baixas comparado ao Ethereum</li>
                            <li><strong>🌍 Global:</strong> Funciona em qualquer lugar do mundo</li>
                        </ul>
                    </div>
                </div>
                
                <div class="help-modal-footer">
                    <button class="btn-primary" onclick="this.closest('.help-modal-overlay').remove()">
                        Entendi! Vamos Começar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
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
