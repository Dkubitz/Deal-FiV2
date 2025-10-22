/**
 * Formulário de Criação de Contratos com Pagamento PIX
 */
class CreateContractForm {
    constructor() {
        this.milestones = [{ percentage: 50 }, { percentage: 50 }];
        this.init();
    }

    init() {
        // NÃO renderizar automaticamente - deixar para o main.js controlar
        console.log('🔧 CreateContractForm inicializado (sem auto-render)');
    }

    render() {
        return `
            <div class="create-contract-page">
                <!-- Botão de Voltar -->
                <div class="top-back-button">
                    <button class="back-btn-top" onclick="window.navigationService.restoreHomePage()">
                        ← Voltar
                    </button>
                </div>


                <div class="contract-form-container">
                    <form class="contract-form" id="createContractForm" onsubmit="window.createContractForm.handleSubmit(event)">
                        <!-- Timestamp de confirmação -->
                        <div style="position: absolute; top: 10px; right: 10px; font-size: 10px; color: #888; background: rgba(255,255,255,0.8); padding: 2px 5px; border-radius: 3px;">
                            21/10/2025 - 07:17
                        </div>
                        
                        <!-- Informações do Recebedor -->
                        <div class="form-section">
                            <h3>👤 Informações do Recebedor</h3>
                            <div class="form-group">
                                <label>Endereço da Carteira do Recebedor *</label>
                                <input type="text" id="payeeAddress" placeholder="0x..." required>
                                <small>O recebedor precisa conectar sua MetaMask e ter USDC para receber pagamentos</small>
                            </div>
                            <div class="form-group">
                                <label>Email do Recebedor (opcional)</label>
                                <input type="email" id="payeeEmail" placeholder="recebedor@email.com">
                                <small>Para notificações por email</small>
                            </div>
                        </div>

                        <!-- Verificação de USDC -->
                        <div class="form-section">
                            <h3>💰 Verificação de USDC</h3>
                            <div class="usdc-check">
                                <div class="usdc-status" id="usdcStatus">
                                    <span class="status-icon">⏳</span>
                                    <span class="status-text">Verificando saldo de USDC...</span>
                                </div>
                                        <div class="usdc-actions">
                                            <button type="button" class="btn-secondary" onclick="window.createContractForm.checkUSDCBalance()">
                                                🔄 Verificar Saldo USDC
                                            </button>
                                </div>
                                <div class="usdc-info">
                                    <p><strong>Importante:</strong> Você precisa ter USDC na sua carteira para executar este contrato.</p>
                                    <p>O sistema pagará todas as taxas de gas, mas o valor do contrato será transferido do seu saldo USDC.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Detalhes do Contrato -->
                        <div class="form-section">
                            <h3>📄 Detalhes do Contrato</h3>
                            
                            <div class="form-group">
                                <label>Descrição do Projeto *</label>
                                <textarea id="description" placeholder="Descreva o projeto, serviço ou produto..." rows="4" required></textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label>Valor Total (USDC) *</label>
                                            <input type="number" id="amount" placeholder="1000" min="1" step="0.01" required>
                                            <small>Mínimo: 1 USDC</small>
                                </div>

                                <div class="form-group">
                                    <label>Prazo (dias) *</label>
                                    <input type="number" id="duration" placeholder="30" min="1" max="365" required>
                                    <small>Máximo: 365 dias</small>
                                </div>
                            </div>
                        </div>

                        <!-- Marcos do Projeto -->
                        <div class="form-section">
                            <h3>🎯 Marcos do Projeto</h3>
                            <p class="section-description">
                                Divida o pagamento em marcos. Cada marco representa uma entrega específica.
                            </p>

                            <div id="milestonesContainer">
                                <!-- Marcos serão inseridos aqui -->
                            </div>

                            <button type="button" class="btn-add-milestone" onclick="window.createContractForm.addMilestone()">
                                + Adicionar Marco
                            </button>
                        </div>

                        <!-- Resumo do Deploy -->
                        <div class="payment-summary">
                            <h3>🔗 Resumo do Deploy</h3>
                            <div class="summary-item">
                                <span>Gas para Deploy:</span>
                                <span class="price">~0.05 POL</span>
                            </div>
                            <div class="summary-item">
                                <span>Valor do Contrato:</span>
                                <span class="price" id="contractValue">0 USDC</span>
                            </div>
                            <div class="summary-item small">
                                <span>Rede:</span>
                                <span>Polygon</span>
                            </div>
                            <div class="summary-info">
                                ℹ️ Você pagará gas em POL para criar o contrato e transferirá USDC para o escrow. Todas as transações são na blockchain.
                            </div>
                        </div>

                        <!-- Botões de Ação -->
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="window.navigationService.restoreHomePage()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                🚀 Deploy Smart Contract
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    renderMilestones() {
        const container = document.getElementById('milestonesContainer');
        if (!container) return;

        container.innerHTML = this.milestones.map((milestone, index) => `
            <div class="milestone-item">
                <div class="milestone-header">
                    <h4>Marco ${index + 1}</h4>
                    ${this.milestones.length > 1 ? `
                        <button type="button" class="btn-remove" onclick="window.createContractForm.removeMilestone(${index})">
                            ×
                        </button>
                    ` : ''}
                </div>
                
                <div class="form-group">
                    <label>Percentual do Pagamento (%)</label>
                    <input 
                        type="number" 
                        id="milestone-${index}" 
                        value="${milestone.percentage}"
                        min="1" 
                        max="100" 
                        required
                        onchange="window.createContractForm.updateMilestone(${index}, this.value)"
                    >
                    <small>Valor: <span id="milestone-value-${index}">-</span> USDC</small>
                </div>
                
                <div class="form-group">
                    <label>Descrição da Entrega</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Fundação concluída, Design aprovado, etc."
                        value="${milestone.description || ''}"
                        onchange="window.createContractForm.updateMilestoneDescription(${index}, this.value)"
                    >
                </div>
            </div>
        `).join('');

        this.validateMilestones();
        this.updateMilestoneValues();
    }

    addMilestone() {
        if (this.milestones.length >= 10) {
            alert('Máximo de 10 marcos permitidos');
            return;
        }

        // Redistribuir percentuais igualmente
        const newPercentage = Math.floor(100 / (this.milestones.length + 1));
        this.milestones = this.milestones.map(() => ({ percentage: newPercentage }));
        this.milestones.push({ percentage: newPercentage });

        // Ajustar o último para garantir 100%
        const total = this.milestones.reduce((sum, m) => sum + m.percentage, 0);
        if (total < 100) {
            this.milestones[this.milestones.length - 1].percentage += (100 - total);
        }

        this.renderMilestones();
    }

    removeMilestone(index) {
        if (this.milestones.length <= 1) return;

        this.milestones.splice(index, 1);
        
        // Redistribuir percentuais
        const newPercentage = Math.floor(100 / this.milestones.length);
        this.milestones = this.milestones.map((m, i) => ({
            ...m,
            percentage: i === this.milestones.length - 1 
                ? 100 - (newPercentage * (this.milestones.length - 1))
                : newPercentage
        }));

        this.renderMilestones();
    }

    updateMilestone(index, value) {
        this.milestones[index].percentage = parseInt(value) || 0;
        this.validateMilestones();
        this.updateMilestoneValues();
    }

    updateMilestoneDescription(index, value) {
        this.milestones[index].description = value;
    }

    updateMilestoneValues() {
        const amount = parseFloat(document.getElementById('amount')?.value) || 0;
        
        this.milestones.forEach((milestone, index) => {
            const valueEl = document.getElementById(`milestone-value-${index}`);
            if (valueEl) {
                const value = (amount * milestone.percentage / 100).toFixed(2);
                valueEl.textContent = value;
            }
        });
    }

    validateMilestones() {
        const total = this.milestones.reduce((sum, m) => sum + m.percentage, 0);
        const isValid = total === 100;

        // Mostrar aviso se não somar 100%
        let warningEl = document.getElementById('milestoneWarning');
        if (!warningEl && !isValid) {
            const container = document.getElementById('milestonesContainer');
            if (container) {
                container.insertAdjacentHTML('afterend', `
                    <div id="milestoneWarning" class="warning-message">
                        ⚠️ Os marcos devem somar exatamente 100% (atual: ${total}%)
                    </div>
                `);
            }
        } else if (warningEl && isValid) {
            warningEl.remove();
        } else if (warningEl) {
            warningEl.textContent = `⚠️ Os marcos devem somar exatamente 100% (atual: ${total}%)`;
        }

        return isValid;
    }

    async handleSubmit(event) {
        event.preventDefault();

        // Verificar se MetaMask está conectado
                if (!window.walletService || !window.walletService.isConnected || !window.walletService.account) {
            alert('Conecte sua carteira MetaMask primeiro');
            return;
        }

        // Validar marcos
        if (!this.validateMilestones()) {
            alert('Os marcos devem somar exatamente 100%');
            return;
        }

                // Verificar se tem USDC suficiente (já verificado anteriormente)
        const amount = parseFloat(document.getElementById('amount').value);
                console.log(`💰 Verificando se ${amount} USDC está disponível...`);

        // Coletar dados do formulário
        const formData = {
            payerAddress: window.walletService.account, // Endereço do pagador (conectado)
            payeeAddress: document.getElementById('payeeAddress').value,
            payeeEmail: document.getElementById('payeeEmail').value,
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            duration: parseInt(document.getElementById('duration').value) * 86400, // Converter dias para segundos
            milestones: this.milestones.map(m => m.percentage),
                    usdcTokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' // USDC.e na Polygon
        };

        try {
            // Deploy do smart contract
            console.log('🚀 Iniciando deploy do contrato...', formData);
            
            // Mostrar loading
            this.showDeployLoading(true);
            
            // Fazer deploy do contrato
            const contractAddress = await this.deploySmartContract(formData);
            
            // Mostrar sucesso
            this.showDeploySuccess(contractAddress, formData);
            
        } catch (error) {
            console.error('❌ Erro ao fazer deploy:', error);
            this.showDeployError(error.message);
        }
    }

    bindEvents() {
        // Re-renderizar marcos quando o valor mudar
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.updateMilestoneValues();
                this.updateContractValue();
            });
        }

        // Renderizar marcos iniciais
        this.renderMilestones();

        // Atualizar valor do contrato inicialmente
        this.updateContractValue();

        // Verificar USDC quando carteira conectar
        if (window.walletService && window.walletService.isConnected) {
            this.checkUSDCBalance();
        }
    }

    updateContractValue() {
        const amount = parseFloat(document.getElementById('amount')?.value) || 0;
        const contractValueEl = document.getElementById('contractValue');
        if (contractValueEl) {
            contractValueEl.textContent = `${amount.toFixed(2)} USDC`;
        }
    }

    async checkUSDCBalance() {
        try {
            const usdcStatus = document.getElementById('usdcStatus');
            if (!usdcStatus) return;

            // Verificar se MetaMask está conectado
                    if (!window.walletService || !window.walletService.isConnected || !window.walletService.account) {
                usdcStatus.innerHTML = `
                    <span class="status-icon">❌</span>
                    <span class="status-text">Conecte sua carteira MetaMask primeiro</span>
                `;
                return;
            }

                    console.log('🔍 Verificando saldo USDC para:', window.walletService.account);

                    // Verificar se ethers.js está disponível
                    if (typeof ethers === 'undefined') {
                        usdcStatus.innerHTML = `
                            <span class="status-icon">❌</span>
                            <span class="status-text">ethers.js não carregado</span>
                        `;
                        return;
                    }

                    // Verificar se estamos na rede Polygon
                    if (!window.ethereum) {
                        usdcStatus.innerHTML = `
                            <span class="status-icon">❌</span>
                            <span class="status-text">MetaMask não detectado</span>
                        `;
                        return;
                    }

                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const network = await provider.getNetwork();
                    
                    if (network.chainId !== 137) {
                        usdcStatus.innerHTML = `
                            <span class="status-icon">❌</span>
                            <span class="status-text">Conecte-se à rede Polygon (Chain ID: 137)</span>
                        `;
                        return;
                    }

                    // Endereço do USDC na Polygon (USDC.e - Bridged USDC)
                    const usdcAddress = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
                    
                    // ABI do ERC20 para verificar saldo
                    const erc20ABI = [
                        "function balanceOf(address owner) view returns (uint256)",
                        "function decimals() view returns (uint8)",
                        "function symbol() view returns (string)"
                    ];

                    const usdcContract = new ethers.Contract(usdcAddress, erc20ABI, provider);
                    
                    // Obter saldo e decimais
                    const [balance, decimals] = await Promise.all([
                        usdcContract.balanceOf(window.walletService.account),
                        usdcContract.decimals()
                    ]);

                    const balanceFormatted = ethers.utils.formatUnits(balance, decimals);
            const amount = parseFloat(document.getElementById('amount')?.value) || 0;

                    console.log('💰 Saldo USDC encontrado:', balanceFormatted, 'USDC');

                    if (parseFloat(balanceFormatted) >= amount) {
                usdcStatus.innerHTML = `
                    <span class="status-icon">✅</span>
                            <span class="status-text">Saldo USDC suficiente: ${parseFloat(balanceFormatted).toFixed(2)} USDC</span>
                `;
                usdcStatus.className = 'usdc-status success';
            } else {
                usdcStatus.innerHTML = `
                    <span class="status-icon">⚠️</span>
                            <span class="status-text">Saldo insuficiente: ${parseFloat(balanceFormatted).toFixed(2)} USDC (necessário: ${amount} USDC)</span>
                `;
                usdcStatus.className = 'usdc-status warning';
            }

        } catch (error) {
                    console.error('❌ Erro ao verificar USDC:', error);
            const usdcStatus = document.getElementById('usdcStatus');
            if (usdcStatus) {
                usdcStatus.innerHTML = `
                    <span class="status-icon">❌</span>
                            <span class="status-text">Erro ao verificar saldo USDC: ${error.message}</span>
                `;
                usdcStatus.className = 'usdc-status error';
                    }
                }
            }

    /**
     * Faz deploy do smart contract na blockchain
     */
    async deploySmartContract(formData) {
        console.log('🚀 Iniciando deploy do smart contract...');
        
        try {
            // Verificar se ethers.js está disponível
            if (typeof ethers === 'undefined') {
                throw new Error('ethers.js não está carregado. Verifique se está conectado à internet.');
            }

            // Verificar se MetaMask está conectado
            if (!window.ethereum) {
                throw new Error('MetaMask não está instalado ou não está acessível.');
            }

            // Verificar se estamos na rede Polygon
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            
            if (network.chainId !== 137) {
                throw new Error('Por favor, conecte-se à rede Polygon (Chain ID: 137)');
            }

            // Obter signer
            const signer = provider.getSigner();
            console.log('✅ Conectado à Polygon com endereço:', await signer.getAddress());

            // Carregar bytecode do arquivo
            const bytecode = await this.loadBytecode();
            console.log('✅ Bytecode carregado:', bytecode.substring(0, 20) + '...');

            // Criar factory do contrato
            const factory = new ethers.ContractFactory(window.escrowABI, bytecode, signer);
            console.log('✅ ContractFactory criado');

            // Preparar parâmetros do construtor
            const constructorParams = [
                formData.payerAddress,           // _payer
                formData.payeeAddress,           // _payee
                formData.duration,               // _duration (em segundos)
                formData.usdcTokenAddress,       // _token (USDC)
                formData.milestones              // _milestonePercentages
            ];

            console.log('📋 Parâmetros do construtor:', constructorParams);

            // Estimar gas
            const gasEstimate = await factory.getDeployTransaction(...constructorParams);
            console.log('⛽ Gas estimado para deploy:', gasEstimate.gasLimit?.toString());

            // Fazer deploy
            console.log('🚀 Fazendo deploy do contrato...');
            const contract = await factory.deploy(...constructorParams);
            
            console.log('⏳ Aguardando confirmação do deploy...');
            await contract.deployed();
            
            console.log('✅ Contrato deployado com sucesso!');
            console.log('📍 Endereço do contrato:', contract.address);

            return contract.address;

        } catch (error) {
            console.error('❌ Erro no deploy:', error);
            throw error;
        }
    }

    /**
     * Carrega o bytecode do arquivo
     */
    async loadBytecode() {
        try {
            const response = await fetch('src/contracts/bytecode.js');
            if (!response.ok) {
                throw new Error('Erro ao carregar bytecode');
            }
            
            const text = await response.text();
            // Extrair o bytecode da string
            const match = text.match(/const\s+bytecode\s*=\s*["']([^"']+)["']/);
            if (!match) {
                throw new Error('Bytecode não encontrado no arquivo');
            }
            
            return match[1];
        } catch (error) {
            console.error('Erro ao carregar bytecode:', error);
            // Fallback: bytecode hardcoded (será substituído pelo arquivo)
            throw new Error('Erro ao carregar bytecode do contrato');
        }
    }

    /**
     * Mostra loading durante o deploy
     */
    showDeployLoading(show) {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '⏳ Fazendo Deploy...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Deploy Smart Contract';
            }
        }
    }

    /**
     * Mostra sucesso após deploy
     */
    showDeploySuccess(contractAddress, formData) {
        // Criar modal de sucesso
        const modal = document.createElement('div');
        modal.className = 'deploy-success-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="success-icon">🎉</div>
                    <h2>Contrato Deployado com Sucesso!</h2>
                    
                    <div class="contract-info">
                        <div class="info-item">
                            <label>Endereço do Contrato:</label>
                            <div class="address-box">
                                <span class="address">${contractAddress}</span>
                                <button onclick="navigator.clipboard.writeText('${contractAddress}')" class="copy-btn">📋</button>
                            </div>
                        </div>
                        
                        <div class="info-item">
                            <label>Valor:</label>
                            <span class="value">${formData.amount} USDC</span>
                        </div>
                        
                        <div class="info-item">
                            <label>Prazo:</label>
                            <span class="value">${formData.duration / 86400} dias</span>
                        </div>
                        
                        <div class="info-item">
                            <label>Marcos:</label>
                            <span class="value">${formData.milestones.join(', ')}%</span>
                        </div>
                    </div>
                    
                    <div class="next-steps">
                        <h3>Próximos Passos:</h3>
                        <ol>
                            <li>Compartilhe o endereço do contrato com o recebedor</li>
                            <li>O recebedor deve conectar sua carteira ao contrato</li>
                            <li>Faça o depósito inicial de USDC</li>
                            <li>Execute os marcos conforme acordado</li>
                        </ol>
                    </div>
                    
                    <div class="modal-actions">
                        <button onclick="window.open('https://polygonscan.com/address/${contractAddress}', '_blank')" class="btn-secondary">
                            🔍 Ver no PolygonScan
                        </button>
                        <button onclick="this.closest('.deploy-success-modal').remove()" class="btn-primary">
                            ✅ Entendi
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Resetar formulário
        document.getElementById('createContractForm').reset();
        this.milestones = [{ percentage: 50 }, { percentage: 50 }];
        this.renderMilestones();
    }

    /**
     * Mostra erro durante deploy
     */
    showDeployError(errorMessage) {
        const modal = document.createElement('div');
        modal.className = 'deploy-error-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="error-icon">❌</div>
                    <h2>Erro no Deploy</h2>
                    <p class="error-message">${errorMessage}</p>
                    
                    <div class="error-suggestions">
                        <h3>Sugestões:</h3>
                        <ul>
                            <li>Verifique se você está conectado à rede Polygon</li>
                            <li>Certifique-se de ter POL suficiente para gas</li>
                            <li>Verifique se todos os campos estão preenchidos corretamente</li>
                            <li>Tente novamente em alguns minutos</li>
                        </ul>
                    </div>
                    
                    <button onclick="this.closest('.deploy-error-modal').remove()" class="btn-primary">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Criar instância global
window.createContractForm = new CreateContractForm();
