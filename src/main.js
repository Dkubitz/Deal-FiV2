/**
 * Arquivo Principal - Inicialização da Aplicação
 * CONTROLE TOTAL DA INICIALIZAÇÃO PARA EVITAR BAGUNÇA
 */
class EscrowApp {
    constructor() {
        this.components = [];
        this.initialized = false;
        this.init();
    }

    init() {
        console.log('🚀 Inicializando SmartContracts Brasil - Escrow dApp...');
        
        // Aguardar o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startApp());
        } else {
            this.startApp();
        }
    }

    startApp() {
        try {
            console.log('✅ DOM carregado, iniciando componentes...');
            
            // Verificar se todos os serviços estão disponíveis
            this.checkServices();
            
            // Inicializar componentes na ordem correta
            this.initializeComponents();
            
            // Renderizar apenas a tela inicial
            this.renderInitialScreen();
            
            console.log('🎉 Aplicação inicializada com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar aplicação:', error);
        }
    }

    checkServices() {
        const requiredServices = ['walletService', 'contractService'];
        const missingServices = requiredServices.filter(service => !window[service]);
        
        if (missingServices.length > 0) {
            throw new Error(`Serviços obrigatórios não encontrados: ${missingServices.join(', ')}`);
        }
        
        console.log('✅ Todos os serviços estão disponíveis');
    }

    initializeComponents() {
        // Ordem de inicialização importante
        const componentOrder = [
            'headerComponent',
            'summaryCardsComponent',
            'contractFormComponent',
            'contractsListComponent'
        ];

        componentOrder.forEach(componentName => {
            if (window[componentName]) {
                console.log(`🔧 Inicializando ${componentName}...`);
                this.components.push(window[componentName]);
            } else {
                console.warn(`⚠️ Componente ${componentName} não encontrado`);
            }
        });

        // Marcar como inicializado
        this.initialized = true;
    }

    /**
     * RENDERIZA APENAS A TELA INICIAL ORGANIZADA
     */
    renderInitialScreen() {
        console.log('🏠 Renderizando tela inicial organizada...');
        
        // 1. PRIMEIRO: Renderizar o Header (logo e carteira)
        if (window.headerComponent) {
            window.headerComponent.render();
            console.log('✅ Header renderizado!');
        }
        
        // 2. SEGUNDO: Limpar container principal
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.innerHTML = '';
        }
        
        // 3. TERCEIRO: Renderizar página inicial do navigation-service
        if (window.navigationService) {
            window.navigationService.renderHomePage(mainContainer);
        }
        
        // 4. QUARTO: Renderizar summary cards na página inicial
        if (window.summaryCardsComponent) {
            window.summaryCardsComponent.render();
        }
        
        console.log('✅ Tela inicial organizada renderizada!');
    }
    

    async initializeRealContractService() {
        try {
            console.log('🔄 Tentando inicializar RealContractService...');
            
            if (window.realContractService) {
                const success = await window.realContractService.init();
                if (success) {
                    console.log('✅ RealContractService inicializado com sucesso!');
                    
                    // Tentar carregar dados do contrato
                    try {
                        const contractData = await window.realContractService.getContractDetails();
                        console.log('📊 Dados do contrato carregados:', contractData);
                        
                        // Atualizar interface com dados reais
                        if (window.summaryCardsComponent) {
                            await window.summaryCardsComponent.updateWithRealData();
                        }
                        
                        if (window.contractsListComponent) {
                            await window.contractsListComponent.loadRealContracts();
                        }
                        
                    } catch (error) {
                        console.log('⚠️ Erro ao carregar dados do contrato:', error.message);
                    }
                } else {
                    console.log('⚠️ RealContractService não pôde ser inicializado');
                }
            } else {
                console.log('⚠️ RealContractService não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar RealContractService:', error);
        }
    }

    // Método para recarregar componentes específicos
    reloadComponent(componentName) {
        const component = window[componentName];
        if (component && component.render) {
            console.log(`🔄 Recarregando ${componentName}...`);
            component.render();
        }
    }

    // Método para obter status da aplicação
    getAppStatus() {
        return {
            services: {
                wallet: !!window.walletService,
                contract: !!window.contractService
            },
            components: this.components.map(comp => comp.constructor.name),
            walletConnected: window.walletService?.isConnected || false
        };
    }
}

// Inicializar a aplicação
window.escrowApp = new EscrowApp();

// Log de status para debugging
setTimeout(() => {
    console.log('📊 Status da Aplicação:', window.escrowApp.getAppStatus());
}, 1000);
