/**
 * Wizard de Criação de Contrato (mobile-first)
 * Mostra poucos campos por vez e valida antes de avançar.
 */
class CreateContractWizard {
    constructor() {
        this.stepIndex = 0;
        this.state = {
            payeeAddress: '',
            amount: 100,
            durationDays: '',
        };
        this.isDeploying = false;
    }

    getSteps() {
        return [
            { id: 'payee', title: 'Recebedor' },
            { id: 'amount', title: 'Valor' },
            { id: 'duration', title: 'Prazo' },
            { id: 'milestones', title: 'Marcos' },
            { id: 'review', title: 'Revisão' },
            { id: 'success', title: 'Concluído' },
        ];
    }

    render() {
        const steps = this.getSteps();
        const step = steps[this.stepIndex];

        return `
            <div class="create-contract-page">
                <div class="top-back-button">
                    <button class="back-btn-top" onclick="window.navigationService.restoreHomePage()">
                        ← Voltar
                    </button>
                </div>

                <div class="contract-form-container">
                    <div class="wizard-container" id="createContractWizard">
                        <div class="wizard-header">
                            <div class="wizard-progress">
                                <div class="wizard-progress-bar">
                                    <div class="wizard-progress-fill" style="width: ${this.getProgressPercent()}%"></div>
                                </div>
                                <div class="wizard-progress-text">
                                    Etapa ${Math.min(this.stepIndex + 1, steps.length - 1)} de ${steps.length - 1}
                                </div>
                            </div>
                            <h2 class="wizard-title">${step.title}</h2>
                        </div>

                        <form id="createContractWizardForm" class="wizard-form">
                            <div class="wizard-step" data-step="${step.id}">
                                ${this.renderStep(step.id)}
                            </div>

                            ${this.renderFooter(step.id)}
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        const form = document.getElementById('createContractWizardForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.getSteps()[this.stepIndex]?.id === 'review') {
                    this.handleDeploy();
                }
            });
        }

        // Hidratar valores salvos no estado
        this.hydrateInputs();

        // Se estivermos na etapa de marcos, renderizar UI existente
        const currentStepId = this.getSteps()[this.stepIndex]?.id;
        if (currentStepId === 'milestones') {
            this.ensureMilestonesUI();
        }
    }

    renderFooter(stepId) {
        if (stepId === 'success') {
            return `
                <div class="wizard-footer wizard-footer-success">
                    <button type="button" class="btn-secondary" onclick="window.navigationService.navigateTo('manage')">
                        Ir para Gerenciar
                    </button>
                    <button type="button" class="btn-primary" onclick="window.navigationService.restoreHomePage()">
                        Voltar para Home
                    </button>
                </div>
            `;
        }

        const isFirst = this.stepIndex === 0;
        const isLastBeforeSuccess = stepId === 'review';

        return `
            <div class="wizard-footer">
                <button type="button" class="btn-secondary" ${isFirst ? 'disabled' : ''} onclick="window.createContractWizard.prevStep()">
                    ← Voltar
                </button>
                ${isLastBeforeSuccess
                    ? `<button type="submit" class="btn-primary" id="wizardDeployBtn" ${this.isDeploying ? 'disabled' : ''}>
                           ${this.isDeploying ? '⏳ Fazendo Deploy...' : 'Deploy Smart Contract'}
                       </button>`
                    : `<button type="button" class="btn-primary" onclick="window.createContractWizard.nextStep()">
                           Próximo →
                       </button>`
                }
            </div>
        `;
    }

    renderStep(stepId) {
        switch (stepId) {
            case 'payee':
                return `
                    <div class="wizard-field">
                        <label for="payeeAddress">Endereço da Carteira do Recebedor *</label>
                        <input type="text" id="payeeAddress" placeholder="0x..." autocomplete="off" required />
                        <small>Endereço da carteira que receberá os pagamentos</small>
                    </div>
                `;
            case 'amount':
                return `
                    <div class="wizard-field">
                        <label for="amount">Valor Total (USDC) *</label>
                        <input type="number" id="amount" placeholder="100" min="1" step="0.01" required />
                        <small>Valor total do contrato em USDC</small>
                    </div>
                `;
            case 'duration':
                return `
                    <div class="wizard-field">
                        <label for="duration">Prazo (dias) *</label>
                        <input type="number" id="duration" placeholder="30" min="1" max="365" required />
                        <small>Prazo máximo para execução do contrato</small>
                    </div>
                `;
            case 'milestones':
                return `
                    <div class="wizard-section">
                        <h3>Marcos do Projeto</h3>
                        <p class="section-description">
                            Divida o pagamento em marcos. Cada marco representa uma entrega específica.
                        </p>
                        <div id="milestonesContainer"></div>
                        <button type="button" class="btn-add-milestone" onclick="window.createContractForm.addMilestone()">
                            + Adicionar Marco
                        </button>
                        <div class="wizard-helper">
                            <small>Os marcos devem somar exatamente 100%.</small>
                        </div>
                    </div>
                `;
            case 'review':
                return `
                    <div class="wizard-review">
                        <h3>Revise as informações</h3>
                        <div class="wizard-review-grid">
                            <div class="review-item">
                                <span class="review-label">Pagador (você)</span>
                                <span class="review-value">${this.formatAddress(window.walletService?.account || '')}</span>
                            </div>
                            <div class="review-item">
                                <span class="review-label">Recebedor</span>
                                <span class="review-value">${this.formatAddress(this.state.payeeAddress)}</span>
                            </div>
                            <div class="review-item">
                                <span class="review-label">Valor</span>
                                <span class="review-value">${Number(this.state.amount || 0).toFixed(2)} USDC</span>
                            </div>
                            <div class="review-item">
                                <span class="review-label">Prazo</span>
                                <span class="review-value">${this.state.durationDays} dias</span>
                            </div>
                            <div class="review-item review-item-wide">
                                <span class="review-label">Marcos</span>
                                <span class="review-value">${this.getMilestonesPercentages().join('%, ')}%</span>
                            </div>
                        </div>
                        <div class="wizard-warning">
                            <strong>Atenção</strong>: ao clicar em “Deploy Smart Contract”, a MetaMask irá pedir confirmação e será cobrado gas (POL).
                        </div>
                    </div>
                `;
            case 'success':
                return `
                    <div class="wizard-success">
                        <div id="wizardSuccessContainer"></div>
                    </div>
                `;
            default:
                return '';
        }
    }

    getProgressPercent() {
        const steps = this.getSteps();
        const total = steps.length - 1; // não contar "success" como etapa de preenchimento
        const current = Math.min(this.stepIndex + 1, total);
        return Math.round((current / total) * 100);
    }

    hydrateInputs() {
        const payee = document.getElementById('payeeAddress');
        if (payee) payee.value = this.state.payeeAddress || '';

        const amount = document.getElementById('amount');
        if (amount) amount.value = this.state.amount ?? 100;

        const duration = document.getElementById('duration');
        if (duration) duration.value = this.state.durationDays || '';

        // sync state on input
        if (payee) payee.addEventListener('input', () => (this.state.payeeAddress = payee.value.trim()));
        if (amount) amount.addEventListener('input', () => (this.state.amount = parseFloat(amount.value)));
        if (duration) duration.addEventListener('input', () => (this.state.durationDays = duration.value));
    }

    ensureMilestonesUI() {
        if (!window.createContractForm) return;
        // Garantir que o componente tenha o array de milestones inicial
        if (!Array.isArray(window.createContractForm.milestones) || window.createContractForm.milestones.length === 0) {
            window.createContractForm.milestones = [{ percentage: 50 }, { percentage: 50 }];
        }
        window.createContractForm.renderMilestones();
        window.createContractForm.updateMilestoneValues();
    }

    persistCurrentStepState() {
        const payee = document.getElementById('payeeAddress');
        if (payee) this.state.payeeAddress = payee.value.trim();
        const amount = document.getElementById('amount');
        if (amount) this.state.amount = parseFloat(amount.value);
        const duration = document.getElementById('duration');
        if (duration) this.state.durationDays = duration.value;
    }

    validateCurrentStep() {
        const stepId = this.getSteps()[this.stepIndex]?.id;
        this.persistCurrentStepState();

        if (stepId === 'payee') {
            if (!this.isValidAddress(this.state.payeeAddress)) {
                window.walletService?.showToast?.({ variant: 'warning', message: 'Informe um endereço 0x válido do recebedor.' });
                return false;
            }
            return true;
        }

        if (stepId === 'amount') {
            const amount = Number(this.state.amount);
            if (!amount || Number.isNaN(amount) || amount <= 0) {
                window.walletService?.showToast?.({ variant: 'warning', message: 'Informe um valor maior que 0 USDC.' });
                return false;
            }
            return true;
        }

        if (stepId === 'duration') {
            const days = parseInt(this.state.durationDays, 10);
            if (!days || Number.isNaN(days) || days < 1 || days > 365) {
                window.walletService?.showToast?.({ variant: 'warning', message: 'Informe um prazo entre 1 e 365 dias.' });
                return false;
            }
            return true;
        }

        if (stepId === 'milestones') {
            if (!window.createContractForm?.validateMilestones?.()) {
                window.walletService?.showToast?.({ variant: 'warning', message: 'Os marcos devem somar exatamente 100%.' });
                return false;
            }
            return true;
        }

        if (stepId === 'review') {
            // Validar tudo antes do deploy
            return (
                this.isValidAddress(this.state.payeeAddress) &&
                Number(this.state.amount) > 0 &&
                parseInt(this.state.durationDays, 10) > 0 &&
                window.createContractForm?.validateMilestones?.()
            );
        }

        return true;
    }

    nextStep() {
        if (!this.validateCurrentStep()) return;
        if (this.stepIndex < this.getSteps().length - 2) {
            this.stepIndex += 1;
            this.rerender();
        }
    }

    prevStep() {
        if (this.stepIndex <= 0) return;
        this.stepIndex -= 1;
        this.rerender();
    }

    rerender() {
        const mainContainer = document.querySelector('.main-container');
        if (!mainContainer) return;
        mainContainer.innerHTML = this.render();
        this.bindEvents();
    }

    async handleDeploy() {
        if (this.isDeploying) return;
        if (!this.validateCurrentStep()) return;

        // Verificar se MetaMask está conectado
        if (!window.walletService || !window.walletService.isConnected || !window.walletService.account) {
            window.walletService?.showToast?.({ variant: 'warning', message: 'Conecte sua carteira MetaMask primeiro.' });
            return;
        }

        this.isDeploying = true;
        this.rerender();

        const formData = this.buildFormData();
        try {
            const contractAddress = await window.createContractForm.deploySmartContract(formData);
            // Renderizar card final dentro do wizard (sem re-render do container principal depois)
            this.stepIndex = this.getSteps().length - 1; // success
            this.isDeploying = false;
            this.rerender();

            const container = document.getElementById('wizardSuccessContainer');
            if (container) {
                container.innerHTML = window.createContractForm.getDeploySuccessHTML(contractAddress, formData);
                window.createContractForm.bindSuccessCardActions?.(contractAddress);
            }
        } catch (error) {
            this.isDeploying = false;
            this.rerender();
            window.createContractForm.showDeployError(error?.message || 'Erro no deploy');
        }
    }

    buildFormData() {
        const days = parseInt(this.state.durationDays, 10);
        return {
            payerAddress: window.walletService.account,
            payeeAddress: this.state.payeeAddress,
            amount: parseFloat(this.state.amount),
            duration: days * 86400,
            milestones: this.getMilestonesPercentages(),
            usdcTokenAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
        };
    }

    getMilestonesPercentages() {
        const ms = window.createContractForm?.milestones || [];
        return ms.map(m => m.percentage);
    }

    isValidAddress(addr) {
        if (!addr) return false;
        return /^0x[a-fA-F0-9]{40}$/.test(addr);
    }

    formatAddress(addr) {
        if (!addr || addr.length < 10) return addr || '-';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    }
}

window.createContractWizard = new CreateContractWizard();

