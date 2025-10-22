/**
 * Serviço de Contratos - Conectado com Contrato Real
 */
class RealContractService {
    constructor() {
        this.contracts = [];
        this.contractAddress = null; // Será definido dinamicamente
        this.contractCreator = window.CONTRACT_CREATOR;
        this.contract = null;
        this.provider = null;
        this.signer = null;
        this.userContracts = []; // Array para múltiplos contratos do usuário
    }

    // Inicializar o serviço
    async init() {
        try {
            console.log('🔄 Inicializando RealContractService...');
            
            // Tentar conectar automaticamente se MetaMask estiver disponível
            if (window.ethereum) {
                console.log('🔍 MetaMask detectado, tentando conectar...');
                
                // Criar provider
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                
                // Tentar conectar com carteira
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    if (accounts.length > 0) {
                        this.signer = this.provider.getSigner();
                        console.log('✅ Carteira conectada:', accounts[0]);
                        
                        // Buscar contratos do usuário
                        await this.findUserContracts(accounts[0]);
                        return true;
                    }
                } catch (error) {
                    console.log('⚠️ Usuário não conectou carteira:', error.message);
                }
                
                // Se não conectou, usar provider sem signer
                console.log('🔍 Usando provider sem signer...');
                return true;
            }
            
            console.log('⚠️ MetaMask não detectado');
            return false;
        } catch (error) {
            console.error('❌ Erro ao inicializar RealContractService:', error);
            return false;
        }
    }

    // Buscar contratos do usuário dinamicamente
    async findUserContracts(userAddress) {
        try {
            console.log('🔍 Buscando contratos do usuário dinamicamente:', userAddress);
            
            // Limpar contratos anteriores
            this.userContracts = [];
            
            // 1. Verificar contrato fixo primeiro (se existir)
            if (window.ESCROW_CONTRACT_ADDRESS) {
                const foundFixed = await this.checkContractAtAddress(window.ESCROW_CONTRACT_ADDRESS, userAddress);
                if (foundFixed) {
                    console.log('✅ Contrato fixo encontrado e válido');
                }
            }
            
            // 2. Buscar contratos recentes do usuário (últimas transações)
            await this.searchRecentUserContracts(userAddress);
            
            // 3. Se encontrou contratos, usar o primeiro
            if (this.userContracts.length > 0) {
                const firstContract = this.userContracts[0];
                this.contractAddress = firstContract.address;
                this.contract = firstContract.contract;
                console.log('✅ Usando contrato:', this.contractAddress);
                return true;
            }
            
            console.log('⚠️ Nenhum contrato encontrado para o usuário');
            return false;
            
        } catch (error) {
            console.error('❌ Erro ao buscar contratos do usuário:', error);
            return false;
        }
    }

    // Verificar contrato em um endereço específico
    async checkContractAtAddress(contractAddress, userAddress) {
        try {
            console.log('🔍 Verificando contrato em:', contractAddress);
            
            // Verificar se o contrato existe
            const code = await this.provider.getCode(contractAddress);
            if (code === '0x') {
                console.log('⚠️ Contrato não encontrado no endereço:', contractAddress);
                return false;
            }
            
            // Criar instância do contrato
            const contractInstance = new ethers.Contract(
                contractAddress,
                window.escrowABI,
                this.provider
            );
            
            // Verificar se o usuário está envolvido
            try {
                const payer = await contractInstance.payer();
                const payee = await contractInstance.payee();
                
                console.log('👤 Pagador:', payer);
                console.log('👤 Recebedor:', payee);
                
                if (payer.toLowerCase() === userAddress.toLowerCase() || 
                    payee.toLowerCase() === userAddress.toLowerCase()) {
                    
                    // Adicionar ao array de contratos do usuário
                    this.userContracts.push({
                        address: contractAddress,
                        contract: contractInstance,
                        payer: payer,
                        payee: payee,
                        userRole: payer.toLowerCase() === userAddress.toLowerCase() ? 'payer' : 'payee'
                    });
                    
                    console.log('✅ Usuário está envolvido no contrato!');
                    return true;
                } else {
                    console.log('⚠️ Usuário não está envolvido neste contrato');
                    return false;
                }
            } catch (error) {
                console.log('⚠️ Erro ao verificar participação no contrato:', error.message);
                return false;
            }
            
        } catch (error) {
            console.log('⚠️ Erro ao verificar contrato:', error.message);
            return false;
        }
    }

    // Buscar contratos por endereço do criador (payer ou payee)
    async searchRecentUserContracts(userAddress) {
        try {
            console.log('🔍 Buscando contratos por endereço do usuário...');
            
            // Obter bloco atual
            const currentBlock = await this.provider.getBlockNumber();
            console.log('📊 Bloco atual:', currentBlock);
            
            // Buscar nos últimos 50.000 blocos (aproximadamente 2-3 dias)
            const fromBlock = Math.max(0, currentBlock - 50000);
            
            console.log('🔍 Buscando em blocos:', fromBlock, 'até', currentBlock);
            
            // Buscar eventos Deposited onde o usuário é o payer (primeiro parâmetro)
            const payerFilter = {
                topics: [
                    ethers.utils.id("Deposited(address,uint256,uint256)"),
                    ethers.utils.hexZeroPad(userAddress, 32) // payer
                ],
                fromBlock: fromBlock,
                toBlock: currentBlock
            };
            
            console.log('🔍 Buscando eventos onde usuário é PAYER...');
            const payerLogs = await this.provider.getLogs(payerFilter);
            console.log('📋 Contratos onde usuário é PAYER:', payerLogs.length);
            
            // Processar contratos onde o usuário é payer
            for (const log of payerLogs) {
                const contractAddress = log.address;
                console.log('🔍 Verificando contrato criado pelo usuário (PAYER):', contractAddress);
                await this.checkContractAtAddress(contractAddress, userAddress);
            }
            
            // Buscar TODOS os eventos Deposited para verificar se o usuário é payee
            const allDepositedFilter = {
                topics: [
                    ethers.utils.id("Deposited(address,uint256,uint256)")
                ],
                fromBlock: fromBlock,
                toBlock: currentBlock
            };
            
            console.log('🔍 Buscando todos os eventos Deposited para verificar PAYEE...');
            const allDepositedLogs = await this.provider.getLogs(allDepositedFilter);
            console.log('📋 Total de eventos Deposited encontrados:', allDepositedLogs.length);
            
            // Verificar cada contrato para ver se o usuário é payee
            for (const log of allDepositedLogs) {
                const contractAddress = log.address;
                console.log('🔍 Verificando se usuário é PAYEE no contrato:', contractAddress);
                await this.checkContractAtAddress(contractAddress, userAddress);
            }
            
            console.log('✅ Busca de contratos por endereço concluída');
            
        } catch (error) {
            console.log('⚠️ Erro ao buscar contratos por endereço:', error.message);
        }
    }

    // Permitir que o usuário insira manualmente um endereço de contrato
    async addContractByAddress(contractAddress, userAddress) {
        try {
            console.log('🔍 Adicionando contrato manualmente:', contractAddress);
            
            const found = await this.checkContractAtAddress(contractAddress, userAddress);
            if (found && this.userContracts.length > 0) {
                // Definir o contrato ativo como o primeiro (e único) da lista
                const firstContract = this.userContracts[0];
                this.contractAddress = firstContract.address;
                this.contract = firstContract.contract;
                
                console.log('✅ Contrato adicionado com sucesso!');
                console.log('✅ Contrato ativo definido:', this.contractAddress);
                return true;
            } else {
                console.log('⚠️ Contrato não encontrado ou usuário não envolvido');
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao adicionar contrato:', error);
            return false;
        }
    }

    // Função para mostrar modal de entrada de endereço
    showAddContractModal(userAddress) {
        const modal = document.createElement('div');
        modal.className = 'add-contract-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🔗 Adicionar Contrato</h2>
                        <button onclick="this.closest('.add-contract-modal').remove()" class="close-btn">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <p>Digite o endereço do contrato que você quer conectar:</p>
                        <input type="text" id="contractAddressInput" placeholder="0x..." class="contract-address-input">
                        <div class="modal-actions">
                            <button onclick="this.closest('.add-contract-modal').remove()" class="btn-secondary">
                                Cancelar
                            </button>
                            <button onclick="window.realContractService.handleAddContract('${userAddress}')" class="btn-primary">
                                Conectar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focar no input
        setTimeout(() => {
            const input = document.getElementById('contractAddressInput');
            if (input) input.focus();
        }, 100);
    }

    // Lidar com adição de contrato
    async handleAddContract(userAddress) {
        try {
            const input = document.getElementById('contractAddressInput');
            if (!input) {
                alert('Input não encontrado');
                return;
            }
            
            const contractAddress = input.value.trim();
            if (!contractAddress) {
                alert('Digite um endereço de contrato');
                return;
            }
            
            if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
                alert('Endereço de contrato inválido');
                return;
            }
            
            console.log('🔍 Tentando conectar contrato:', contractAddress);
            
            const success = await this.addContractByAddress(contractAddress, userAddress);
            
            if (success) {
                // Fechar modal
                const modal = document.querySelector('.add-contract-modal');
                if (modal) modal.remove();
                
                // Recarregar interface sem redirecionar
                if (window.navigationService) {
                    await window.navigationService.loadRealContractsForManage();
                    console.log('🔄 Interface recarregada com contrato conectado');
                }
                
                alert('✅ Contrato conectado com sucesso!');
            } else {
                alert('❌ Contrato não encontrado ou você não está envolvido neste contrato');
            }
            
        } catch (error) {
            console.error('❌ Erro ao lidar com adição de contrato:', error);
            alert('❌ Erro ao conectar contrato: ' + error.message);
        }
    }

    // Conectar com contrato real
    async connectToContract(provider, signer) {
        try {
            this.provider = provider;
            this.signer = signer;
            
            this.contract = new ethers.Contract(
                this.contractAddress,
                window.escrowABI,
                signer
            );
            
            console.log('✅ Conectado com contrato real:', this.contractAddress);
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar com contrato:', error);
            return false;
        }
    }

    // Buscar contratos reais da blockchain
    async fetchRealContracts() {
        if (!this.contract) {
            console.error('❌ Contrato não conectado');
            return [];
        }

        try {
            console.log('🔍 Buscando dados do contrato real...');
            
            // Buscar status do contrato
            const status = await this.contract.getContractStatus();
            const [deposited, totalMilestones, milestoneExecuted, remainingAmount, paused] = status;

            // Buscar informações básicas
            const payer = await this.contract.payer();
            const payee = await this.contract.payee();
            const amount = await this.contract.amount();
            const deadline = await this.contract.deadline();
            const token = await this.contract.token();

            console.log('📊 Dados do contrato:', {
                deposited,
                totalMilestones: totalMilestones.toString(),
                remainingAmount: ethers.formatUnits(remainingAmount, 6),
                paused
            });

            // Criar objeto do contrato
            const contractData = {
                id: 1,
                address: this.contractAddress,
                title: "Contrato Escrow Real",
                payer: payer,
                payee: payee,
                amount: parseFloat(ethers.formatUnits(amount, 6)), // USDC tem 6 decimais
                status: deposited ? "active" : "inactive",
                totalMilestones: totalMilestones.toString(),
                remainingAmount: parseFloat(ethers.formatUnits(remainingAmount, 6)),
                deadline: new Date(parseInt(deadline) * 1000).toISOString().split('T')[0],
                paused: paused,
                token: token,
                milestones: []
            };

            // Buscar informações dos marcos
            for (let i = 0; i < totalMilestones; i++) {
                const percentage = await this.contract.milestonePercentages(i);
                const milestoneAmount = await this.contract.milestoneAmounts(i);
                const executed = milestoneExecuted[i];

                contractData.milestones.push({
                    id: i + 1,
                    description: `Marco ${i + 1}`,
                    percentage: percentage.toString(),
                    completed: executed,
                    amount: parseFloat(ethers.formatUnits(milestoneAmount, 6))
                });
            }

            this.contracts = [contractData];
            console.log('✅ Contratos carregados:', this.contracts);
            return this.contracts;

        } catch (error) {
            console.error('❌ Erro ao buscar contratos:', error);
            return [];
        }
    }

    // Liberar marco
    async releaseMilestone(milestoneIndex) {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log(`🚀 Liberando marco ${milestoneIndex}...`);
            
            // Conectar contrato com signer
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.releaseMilestone(milestoneIndex);
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Marco liberado com sucesso!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao liberar marco:', error);
            throw error;
        }
    }

    // Aprovar cancelamento
    async approveCancel() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('🚫 Aprovando cancelamento...');
            
            // Conectar contrato com signer
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.approveCancel();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Cancelamento aprovado!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao aprovar cancelamento:', error);
            throw error;
        }
    }

    // Fazer refund
    async refund() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('💰 Fazendo refund...');
            
            // Conectar contrato com signer
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.refund();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Refund realizado!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao fazer refund:', error);
            throw error;
        }
    }

    // Claim após deadline
    async claimAfterDeadline() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('⏰ Claiming após deadline...');
            
            // Conectar contrato com signer
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.claimAfterDeadline();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Claim realizado!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao fazer claim:', error);
            throw error;
        }
    }

    // Pausar contrato
    async pause() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('⏸️ Pausando contrato...');
            const tx = await this.contract.pause();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Contrato pausado!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao pausar contrato:', error);
            throw error;
        }
    }

    // Despausar contrato
    async unpause() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('▶️ Despausando contrato...');
            const tx = await this.contract.unpause();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Contrato despausado!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao despausar contrato:', error);
            throw error;
        }
    }

    // Obter detalhes completos do contrato
    async getContractDetails() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('🔍 Obtendo detalhes do contrato...');
            
            // Buscar informações básicas (apenas funções que existem)
            const payer = await this.contract.payer();
            const payee = await this.contract.payee();
            const amount = await this.contract.amount();
            const deadline = await this.contract.deadline();
            const deposited = await this.contract.deposited();
            const remaining = await this.contract.remaining();

            // Buscar informações dos marcos (se existirem)
            let totalMilestones = 0;
            let milestonePercentages = [];
            let milestoneAmounts = [];
            let milestoneExecuted = [];

            try {
                totalMilestones = await this.contract.totalMilestones();
                
                for (let i = 0; i < totalMilestones; i++) {
                    milestonePercentages.push(await this.contract.milestonePercentages(i));
                    milestoneAmounts.push(await this.contract.milestoneAmounts(i));
                    milestoneExecuted.push(await this.contract.milestoneExecuted(i));
                }
            } catch (error) {
                console.log('⚠️ Funções de marcos não disponíveis, usando valores padrão');
                totalMilestones = 2; // Valor padrão
                milestonePercentages = ['50', '50'];
                milestoneAmounts = [ethers.utils.formatUnits(amount.div(2), 6), ethers.utils.formatUnits(amount.div(2), 6)];
                milestoneExecuted = [false, false];
            }

            return {
                payer,
                payee,
                amount: ethers.utils.formatUnits(amount, 6), // USDC tem 6 decimais
                deposited,
                deadline: new Date(parseInt(deadline) * 1000),
                totalMilestones: totalMilestones.toString(),
                milestonePercentages: milestonePercentages.map(p => p.toString()),
                milestoneAmounts: milestoneAmounts.map(a => typeof a === 'string' ? a : ethers.utils.formatUnits(a, 6)),
                milestoneExecuted,
                remainingAmount: ethers.utils.formatUnits(remaining, 6),
                paused: false, // Assumindo que não está pausado
                token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // USDC na Polygon (valor fixo)
            };
        } catch (error) {
            console.error('❌ Erro ao obter detalhes do contrato:', error);
            throw error;
        }
    }

    // Obter estatísticas
    async getStats() {
        if (!this.contract) {
            return {
                activeContracts: 0,
                totalValue: 0,
                averageRating: 4.8
            };
        }

        try {
            const status = await this.contract.getContractStatus();
            const [deposited, totalMilestones, milestoneExecuted, remainingAmount, paused] = status;
            const amount = await this.contract.amount();

            const completedMilestones = milestoneExecuted.filter(executed => executed).length;
            const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            return {
                activeContracts: deposited ? 1 : 0,
                totalValue: parseFloat(ethers.utils.formatUnits(amount, 6)),
                averageRating: completionRate > 80 ? 4.9 : completionRate > 60 ? 4.7 : 4.5,
                completionRate: completionRate
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                activeContracts: 0,
                totalValue: 0,
                averageRating: 4.8
            };
        }
    }
}

// Criar instância global (SEM inicialização automática)
window.realContractService = new RealContractService();
console.log('🔧 RealContractService criado (sem auto-init)');
