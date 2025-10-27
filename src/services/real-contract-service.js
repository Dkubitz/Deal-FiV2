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
            console.log('🔍 Buscando contratos do usuário:', userAddress);
            
            // Limpar contratos anteriores
            this.userContracts = [];
            
            // APENAS verificar contrato fixo (se existir)
            if (window.ESCROW_CONTRACT_ADDRESS) {
                console.log('🔍 Verificando contrato fixo:', window.ESCROW_CONTRACT_ADDRESS);
                const foundFixed = await this.checkContractAtAddress(window.ESCROW_CONTRACT_ADDRESS, userAddress);
                if (foundFixed) {
                    console.log('✅ Contrato fixo encontrado e válido');
                }
            }
            
            // DESABILITADA: Busca automática causa muitos erros com contratos inválidos
            // await this.searchRecentUserContracts(userAddress);
            
            // Se encontrou contratos, usar o primeiro
            if (this.userContracts.length > 0) {
                const firstContract = this.userContracts[0];
                this.contractAddress = firstContract.address;
                this.contract = firstContract.contract;
                console.log('✅ Usando contrato:', this.contractAddress);
                return true;
            }
            
            console.log('ℹ️ Nenhum contrato pré-configurado. Use "Buscar Contrato" para adicionar.');
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
                // Erro silencioso - contrato não é Escrow válido
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
    
    // Define um contrato específico como ativo (substituindo o anterior)
    async setActiveContract(contractAddress, userAddress) {
        try {
            console.log('🔄 Definindo contrato ativo:', contractAddress);
            
            // Limpar cache de contratos anteriores
            this.userContracts = [];
            this.contract = null;
            this.contractAddress = null;
            
            // Resetar estado do polling ao trocar de contrato
            if (window.contractPollingService) {
                window.contractPollingService.resetState();
            }
            
            // Adicionar novo contrato
            console.log('📍 [setActiveContract] Verificando contrato:', contractAddress);
            const found = await this.checkContractAtAddress(contractAddress, userAddress);
            console.log('📍 [setActiveContract] Contrato encontrado:', found);
            console.log('📍 [setActiveContract] userContracts.length:', this.userContracts.length);
            
            if (found && this.userContracts.length > 0) {
                const firstContract = this.userContracts[0];
                this.contractAddress = firstContract.address;
                this.contract = firstContract.contract;
                
                console.log('✅ [setActiveContract] Contrato ativo atualizado para:', this.contractAddress);
                console.log('✅ [setActiveContract] Objeto do contrato:', this.contract.address);
                return true;
            } else {
                console.log('⚠️ Contrato não encontrado ou usuário não envolvido');
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao definir contrato ativo:', error);
            return false;
        }
    }

    // Função para fechar modal com transição
    closeAddContractModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 400);
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
                        <button onclick="window.realContractService.closeAddContractModal(this.closest('.add-contract-modal'))" class="close-btn">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <p>Digite o endereço do contrato que você quer conectar:</p>
                        <input type="text" id="contractAddressInput" placeholder="0x..." class="contract-address-input">
                        <div class="modal-actions">
                            <button onclick="window.realContractService.closeAddContractModal(this.closest('.add-contract-modal'))" class="btn-secondary">
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
        
        // Adicionar classe para mostrar com transição
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Focar no input após a transição
        setTimeout(() => {
            const input = document.getElementById('contractAddressInput');
            if (input) input.focus();
        }, 400);
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
            
            // Usar setActiveContract para substituir contrato anterior
            const success = await this.setActiveContract(contractAddress, userAddress);
            
            if (success) {
                // Fechar modal
                const modal = document.querySelector('.add-contract-modal');
                if (modal) this.closeAddContractModal(modal);
                
                // Recarregar interface
                if (window.navigationService) {
                    await window.navigationService.refreshCurrentPage();
                    console.log('🔄 Interface recarregada com novo contrato');
                }
                
                // Atualizar summary cards APENAS se estiver na página home
                if (window.summaryCardsComponent && window.navigationService?.currentPage === 'home') {
                    const details = await this.getContractDetails();
                    await window.summaryCardsComponent.updateSummaryElements(details);
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
            
            // Usar getContractDetails() que funciona com o novo contrato
            const details = await this.getContractDetails();
            console.log('📊 Dados do contrato carregados:', details);

            // Criar objeto do contrato compatível com a interface
            const contractData = {
                id: 1,
                address: this.contractAddress,
                title: "Contrato Escrow Real",
                payer: details.payer,
                payee: details.payee,
                amount: parseFloat(details.amount),
                status: details.deposited ? "active" : "inactive",
                totalMilestones: details.totalMilestones,
                remainingAmount: parseFloat(details.balance),
                deadline: details.deadline.toISOString().split('T')[0],
                paused: false,
                token: details.token,
                milestones: details.milestoneInfo.map((m, i) => ({
                    id: i + 1,
                    description: `Marco ${i + 1}`,
                    percentage: m.percentage,
                    completed: m.released,
                    amount: parseFloat(m.amount)
                })),
                platformFeePaid: details.platformFeePaid,
                confirmedPayer: details.confirmedPayer,
                confirmedPayee: details.confirmedPayee
            };

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

    // ============================================
    // NOVAS FUNÇÕES PARA O NOVO CONTRATO
    // ============================================

    // Pagar taxa de plataforma
    async payPlatformFee() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('💳 Pagando taxa de plataforma...');
            
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            // Primeiro, aprovar o contrato para transferir 1 USDC
            console.log('🔐 Aprovando contrato para transferir 1 USDC...');
            
            // Obter endereço do token do contrato
            const tokenAddress = await this.contract.token();
            console.log('🔍 Endereço do token do contrato:', tokenAddress);
            
            const usdcToken = new ethers.Contract(
                tokenAddress, // Usar endereço do token do contrato
                [
                    'function approve(address spender, uint256 amount) external returns (bool)',
                    'function allowance(address owner, address spender) external view returns (uint256)'
                ],
                signer
            );
            
            // Verificar allowance atual
            const currentAllowance = await usdcToken.allowance(signer.getAddress(), this.contract.address);
            console.log('🔍 Allowance atual:', ethers.utils.formatUnits(currentAllowance, 6), 'USDC');
            console.log('🔍 Endereço do usuário:', await signer.getAddress());
            console.log('🔍 Endereço do contrato:', this.contract.address);
            
            // Se allowance for menor que 1 USDC, aprovar
            const requiredAmount = ethers.utils.parseUnits('1', 6); // 1 USDC com 6 decimais
            if (currentAllowance.lt(requiredAmount)) {
                console.log('🔐 Fazendo approve de 1 USDC...');
                const approveTx = await usdcToken.approve(this.contract.address, requiredAmount);
                console.log('⏳ Transação de approve enviada:', approveTx.hash);
                await approveTx.wait();
                console.log('✅ Approve confirmado!');
                
                // Aguardar um pouco para a allowance ser propagada
                console.log('⏳ Aguardando propagação da allowance...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Verificar allowance novamente
                const newAllowance = await usdcToken.allowance(signer.getAddress(), this.contract.address);
                console.log('🔍 Nova allowance:', ethers.utils.formatUnits(newAllowance, 6), 'USDC');
                
                if (newAllowance.lt(requiredAmount)) {
                    throw new Error('Allowance ainda insuficiente após approve');
                }
            } else {
                console.log('✅ Allowance suficiente já existe');
            }
            
            // Verificação final antes de pagar
            const finalAllowance = await usdcToken.allowance(signer.getAddress(), this.contract.address);
            console.log('🔍 Allowance final antes do pagamento:', ethers.utils.formatUnits(finalAllowance, 6), 'USDC');
            
            if (finalAllowance.lt(requiredAmount)) {
                console.log('⚠️ Allowance ainda insuficiente, forçando novo approve...');
                const forceApproveTx = await usdcToken.approve(this.contract.address, requiredAmount);
                await forceApproveTx.wait();
                console.log('✅ Novo approve forçado confirmado!');
            }
            
            // Agora pagar a taxa
            console.log('💳 Executando pagamento da taxa...');
            const tx = await contractWithSigner.payPlatformFee();
            console.log('⏳ Transação de pagamento enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Taxa de plataforma paga!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao pagar taxa de plataforma:', error);
            throw error;
        }
    }

    // Confirmar identidade do payer
    async confirmPayer() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('✅ Confirmando identidade do payer...');
            
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.confirmPayer();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Identidade do payer confirmada!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao confirmar payer:', error);
            throw error;
        }
    }

    // Confirmar identidade do payee
    async confirmPayee() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('✅ Confirmando identidade do payee...');
            
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.confirmPayee();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Identidade do payee confirmada!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao confirmar payee:', error);
            throw error;
        }
    }

    // Depositar valor no contrato
    async deposit(amount) {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('💰 Iniciando processo de depósito:', amount, 'USDC');
            
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            // Converter para wei (USDC tem 6 decimais)
            const amountWei = ethers.utils.parseUnits(amount.toString(), 6);
            console.log('💰 Valor em wei (6 decimais):', amountWei.toString());
            
            // 1. Verificar allowance atual
            const usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // USDC.e Polygon
            const usdcContract = new ethers.Contract(
                usdcAddress,
                ['function allowance(address owner, address spender) view returns (uint256)',
                 'function approve(address spender, uint256 amount) returns (bool)',
                 'function balanceOf(address account) view returns (uint256)'],
                signer
            );
            
            const currentAllowance = await usdcContract.allowance(
                await signer.getAddress(),
                this.contractAddress
            );
            
            console.log('🔍 Allowance atual:', ethers.utils.formatUnits(currentAllowance, 6), 'USDC');
            console.log('💰 Valor a depositar:', amount, 'USDC');
            
            // 2. Verificar saldo de USDC
            const userAddress = await signer.getAddress();
            const usdcBalance = await usdcContract.balanceOf(userAddress);
            console.log('💵 Saldo USDC:', ethers.utils.formatUnits(usdcBalance, 6), 'USDC');
            
            if (usdcBalance.lt(amountWei)) {
                throw new Error(`Saldo insuficiente! Você tem ${ethers.utils.formatUnits(usdcBalance, 6)} USDC mas precisa de ${amount} USDC.`);
            }
            
            // 3. Se allowance insuficiente, solicitar approve
            if (currentAllowance.lt(amountWei)) {
                console.log('⚠️ Allowance insuficiente! Solicitando approve...');
                alert(`📝 Transação 1 de 2: Approve\n\nVocê precisa autorizar o contrato a usar ${amount} USDC.\n\nConfirme na MetaMask!`);
                
                const approveTx = await usdcContract.approve(this.contractAddress, amountWei);
                console.log('⏳ Approve enviado:', approveTx.hash);
                console.log('⏳ Aguardando confirmação do approve...');
                
                await approveTx.wait();
                console.log('✅ Approve confirmado!');
                alert('✅ Approve confirmado! Agora vem a transação de depósito...');
            } else {
                console.log('✅ Allowance já é suficiente');
            }
            
            // 3. Fazer depósito
            console.log('💳 Executando depósito...');
            const tx = await contractWithSigner.deposit(amountWei);
            console.log('⏳ Transação de depósito enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Valor depositado com sucesso!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao depositar:', error);
            throw error;
        }
    }

    // Propor settlement (acordo parcial)
    async proposeSettlement(amount) {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('🤝 Propondo settlement...');
            
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            // Converter para wei (USDC tem 6 decimais)
            const amountWei = ethers.utils.parseUnits(amount.toString(), 6);
            
            const tx = await contractWithSigner.proposeSettlement(amountWei);
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Settlement proposto!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao propor settlement:', error);
            throw error;
        }
    }

    // Aprovar settlement
    async approveSettlement() {
        if (!this.contract) {
            throw new Error('Contrato não conectado');
        }

        try {
            console.log('✅ Aprovando settlement...');
            
            const signer = window.walletService.signer;
            const contractWithSigner = this.contract.connect(signer);
            
            const tx = await contractWithSigner.approveSettlement();
            console.log('⏳ Transação enviada:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Settlement aprovado!', receipt);
            return receipt;
        } catch (error) {
            console.error('❌ Erro ao aprovar settlement:', error);
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
            console.log('📍 [getContractDetails] Endereço do contrato ativo:', this.contractAddress);
            console.log('📍 [getContractDetails] Objeto do contrato:', this.contract.address);
            
            // Usar nova função getContractInfo() do novo contrato
            const contractInfo = await this.contract.getContractInfo();
            const [payer, payee, totalAmount, deadline, deposited, platformFeePaid, confirmedPayer, confirmedPayee, balance] = contractInfo;
            
            // Buscar informações de settlement e cancelamento
            let settlementAmount = 0;
            let settlementApproved = false;
            let cancelApprovedPayer = false;
            let cancelApprovedPayee = false;
            
            try {
                settlementAmount = await this.contract.settlementAmount();
                settlementApproved = await this.contract.settlementApproved();
                cancelApprovedPayer = await this.contract.cancelApprovedPayer();
                cancelApprovedPayee = await this.contract.cancelApprovedPayee();
                
                console.log('🤝 Settlement:', {
                    amount: ethers.utils.formatUnits(settlementAmount, 6),
                    approved: settlementApproved
                });
                console.log('❌ Cancelamento:', {
                    payer: cancelApprovedPayer,
                    payee: cancelApprovedPayee
                });
            } catch (error) {
                console.log('⚠️ Erro ao buscar settlement/cancelamento:', error.message);
            }

            // Buscar informações dos marcos usando novas funções
            let totalMilestones = 0;
            let milestoneInfo = [];

            try {
                totalMilestones = await this.contract.getTotalMilestones();
                
                for (let i = 0; i < totalMilestones; i++) {
                    const milestone = await this.contract.getMilestoneInfo(i);
                    milestoneInfo.push({
                        percentage: milestone.percentage.toString(),
                        amount: ethers.utils.formatUnits(milestone.amount, 6),
                        released: milestone.released
                    });
                }
            } catch (error) {
                console.log('⚠️ Erro ao buscar informações dos marcos:', error);
                totalMilestones = 0;
                milestoneInfo = [];
            }

            // Criar arrays separados para compatibilidade
            const milestoneAmounts = milestoneInfo.map(m => m.amount);
            const milestonePercentages = milestoneInfo.map(m => m.percentage);
            
            const contractDetails = {
                payer,
                payee,
                amount: ethers.utils.formatUnits(totalAmount, 6), // USDC tem 6 decimais
                deposited,
                deadline: new Date(parseInt(deadline) * 1000),
                totalMilestones: totalMilestones.toString(),
                milestoneInfo,
                milestoneAmounts,      // Array de valores
                milestonePercentages,  // Array de percentuais
                remainingAmount: ethers.utils.formatUnits(balance, 6),
                balance: ethers.utils.formatUnits(balance, 6),
                platformFeePaid,
                confirmedPayer,
                confirmedPayee,
                settlementAmount: parseFloat(ethers.utils.formatUnits(settlementAmount, 6)),
                settlementApproved,
                cancelApprovedPayer,
                cancelApprovedPayee,
                token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // USDC na Polygon
            };
            
            // Debug: Log dos dados do contrato
            console.log('🔍 [getContractDetails] Dados completos:', {
                platformFeePaid,
                confirmedPayer,
                confirmedPayee,
                deposited,
                amount: ethers.utils.formatUnits(totalAmount, 6),
                totalMilestones: totalMilestones.toString()
            });
            
            // Verificar se confirmedPayee está sendo lido corretamente
            if (confirmedPayee) {
                console.log('✅ [getContractDetails] Payee JÁ confirmou na blockchain!');
            } else {
                console.log('⚠️ [getContractDetails] Payee ainda NÃO confirmou');
            }
            
            return contractDetails;
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
            // Usar getContractDetails() para obter dados
            const details = await this.getContractDetails();
            
            const completedMilestones = details.milestoneInfo.filter(m => m.released).length;
            const totalMilestones = parseInt(details.totalMilestones);
            const completionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            return {
                activeContracts: details.deposited ? 1 : 0,
                totalValue: parseFloat(details.amount),
                averageRating: completionRate > 80 ? 4.9 : completionRate > 60 ? 4.7 : 4.5,
                completionRate: completionRate
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return {
                activeContracts: 0,
                totalValue: 0,
                averageRating: 4.8,
                completionRate: 0
            };
        }
    }
}

// Criar instância global (SEM inicialização automática)
window.realContractService = new RealContractService();
console.log('🔧 RealContractService criado (sem auto-init)');
