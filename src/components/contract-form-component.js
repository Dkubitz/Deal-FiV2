/**
 * Componente do Formulário de Criação de Contratos
 */
class ContractFormComponent {
    constructor() {
        this.element = null;
        this.init();
    }

    init() {
        // NÃO renderizar automaticamente - deixar para o main.js controlar
        console.log('🔧 ContractFormComponent inicializado (sem auto-render)');
        this.bindEvents();
    }

    render() {
        const container = document.getElementById('left-content');
        if (container) {
            container.innerHTML = `
                <!-- Botão de Navegação para Criação de Contratos -->
                <div class="nav-button expand-button" onclick="window.contractFormComponent.handleCreateContract()">
                    <span class="nav-button-arrow">→</span>
                    <span class="nav-button-icon create-icon-nav"></span>
                    <div class="nav-button-title">Criar Novo Contrato</div>
                    <div class="nav-button-description">
                        Configure e crie um novo contrato de escrow com múltiplos marcos, 
                        endereços de carteira e valores personalizados para sua transação.
                    </div>
                </div>
            `;
        }
    }

    bindEvents() {
        const createBtn = document.getElementById('createContractBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createContract());
        }
    }

    async handleCreateContract() {
        console.log('Botão Criar Contrato clicado!');
        
        // Navegação simples sem animação complexa
        if (window.navigationService) {
            window.navigationService.navigateTo('create');
        } else {
            alert('🚀 Função Criar Contrato ativada! (NavigationService não encontrado)');
        }
    }

    getCreateContractContent() {
        return `
            <div class="new-content" style="padding: 60px 40px; color: white; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; background: #1a1a1a;">
                <div style="max-width: 800px; margin: 0 auto;">
                    <h2 style="margin-bottom: 30px; font-size: 2.5em; color: white;">📝 Criar Novo Contrato</h2>
                    <div style="background: rgba(255, 255, 255, 0.05); padding: 40px; border-radius: 28px; margin-bottom: 30px; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px);">
                        <h3 style="margin-bottom: 20px; color: #667eea;">Formulário de Criação</h3>
                        <p style="margin-bottom: 30px; opacity: 0.8; color: #ccc;">
                            Configure os detalhes do seu contrato de escrow com arbitragem inteligente.
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <div style="text-align: left;">
                                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: white;">Título do Contrato</label>
                                <input type="text" placeholder="Ex: Construção Casa Modelo A" style="width: 100%; padding: 15px; border-radius: 15px; border: 2px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: white; font-size: 16px; box-sizing: border-box; backdrop-filter: blur(10px);">
                            </div>
                            <div style="text-align: left;">
                                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: white;">Valor Total (R$)</label>
                                <input type="number" placeholder="Ex: 150000" style="width: 100%; padding: 15px; border-radius: 15px; border: 2px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: white; font-size: 16px; box-sizing: border-box; backdrop-filter: blur(10px);">
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                            <div style="text-align: left;">
                                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: white;">Endereço do Cliente</label>
                                <input type="text" placeholder="0x..." style="width: 100%; padding: 15px; border-radius: 15px; border: 2px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: white; font-size: 16px; box-sizing: border-box; backdrop-filter: blur(10px);">
                            </div>
                            <div style="text-align: left;">
                                <label style="display: block; margin-bottom: 10px; font-weight: 600; color: white;">Endereço do Fornecedor</label>
                                <input type="text" placeholder="0x..." style="width: 100%; padding: 15px; border-radius: 15px; border: 2px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: white; font-size: 16px; box-sizing: border-box; backdrop-filter: blur(10px);">
                            </div>
                        </div>
                        <div style="margin-bottom: 30px; text-align: left;">
                            <label style="display: block; margin-bottom: 10px; font-weight: 600; color: white;">Descrição do Projeto</label>
                            <textarea placeholder="Descreva os detalhes do projeto e marcos..." style="width: 100%; padding: 15px; border-radius: 15px; border: 2px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.1); color: white; font-size: 16px; height: 120px; resize: vertical; box-sizing: border-box; backdrop-filter: blur(10px);"></textarea>
                        </div>
                        <button style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 18px 40px; border-radius: 25px; font-size: 18px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 35px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.3)';">
                            🚀 Criar Contrato Inteligente
                        </button>
                    </div>
                    <div style="opacity: 0.7; font-size: 14px; color: #ccc;">
                        💡 O contrato será criado com arbitragem automática e múltiplos marcos de pagamento
                    </div>
                </div>
            </div>
        `;
    }

}

// Instância global do componente
window.contractFormComponent = new ContractFormComponent();
