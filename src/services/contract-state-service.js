/**
 * Serviço de Gerenciamento de Estados do Contrato
 * Arquitetura Limpa - Separation of Concerns
 * 
 * Este serviço mapeia TODOS os estados possíveis do contrato escrow
 * e determina qual interface mostrar para cada situação.
 */

class ContractStateService {
    constructor() {
        this.currentState = null;
        this.contractData = null;
        this.userRole = null; // 'PAYER' ou 'PAYEE'
        
        // Definição de TODOS os estados possíveis
        this.STATES = {
            // === FASE 1: PRÉ-ATIVAÇÃO ===
            INVALID_CONSTRUCTOR: {
                id: 'INVALID_CONSTRUCTOR',
                phase: 'PRE_DEPOSIT',
                title: '❌ Contrato Inválido',
                description: 'Falha no construtor do contrato',
                canInteract: false,
                isFatal: true
            },
            
            WAITING_PLATFORM_FEE: {
                id: 'WAITING_PLATFORM_FEE',
                phase: 'PRE_DEPOSIT',
                title: 'Aguardando Taxa de Plataforma',
                description: 'Taxa de 1 USDC deve ser paga',
                canInteract: true,
                actions: {
                    both: ['payPlatformFee', 'viewDetails']
                }
            },
            
            WAITING_PAYER_CONFIRMATION: {
                id: 'WAITING_PAYER_CONFIRMATION',
                phase: 'PRE_DEPOSIT',
                title: '⏳ Aguardando Confirmação do Payer',
                description: 'Payer precisa confirmar identidade',
                canInteract: true,
                actions: {
                    payer: ['confirmPayer', 'viewDetails'],
                    payee: ['viewDetails']
                }
            },
            
            WAITING_PAYEE_CONFIRMATION: {
                id: 'WAITING_PAYEE_CONFIRMATION',
                phase: 'PRE_DEPOSIT',
                title: '⏳ Aguardando Confirmação do Payee',
                description: 'Payee precisa confirmar identidade',
                canInteract: true,
                actions: {
                    payer: ['viewDetails'],
                    payee: ['confirmPayee', 'viewDetails']
                }
            },
            
            WAITING_BOTH_CONFIRMATIONS: {
                id: 'WAITING_BOTH_CONFIRMATIONS',
                phase: 'PRE_DEPOSIT',
                title: '⏳ Aguardando Confirmações Mútuas',
                description: 'Ambos Payer e Payee precisam confirmar',
                canInteract: true,
                actions: {
                    payer: ['confirmPayer', 'viewDetails'],
                    payee: ['confirmPayee', 'viewDetails']
                }
            },
            
            READY_FOR_DEPOSIT: {
                id: 'READY_FOR_DEPOSIT',
                phase: 'PRE_DEPOSIT',
                title: 'Pronto para Depósito',
                description: 'Confirmações OK - Aguardando depósito do Payer (valor dinâmico)',
                canInteract: true,
                actions: {
                    payer: ['deposit', 'viewDetails'],
                    payee: ['viewDetails']
                }
            },
            
            DEPOSIT_FAILED: {
                id: 'DEPOSIT_FAILED',
                phase: 'PRE_DEPOSIT',
                title: '❌ Erro no Depósito',
                description: 'Allowance insuficiente ou valor inválido',
                canInteract: true,
                isFatal: true,
                actions: {
                    payer: ['viewDetails'],
                    payee: ['viewDetails']
                }
            },
            
            // === FASE 2: CONTRATO ATIVO ===
            ACTIVE_NO_MILESTONES_RELEASED: {
                id: 'ACTIVE_NO_MILESTONES_RELEASED',
                phase: 'ACTIVE',
                title: 'Contrato Ativo',
                description: 'Depósito realizado - Nenhum marco liberado',
                canInteract: true,
                milestonesReleased: 0,
                actions: {
                    payer: [
                        {id: 'releaseMilestone', milestone: 0},
                        'refund',
                        'approveCancel',
                        'proposeSettlement',
                        'viewDetails'
                    ],
                    payee: [
                        'approveCancel',
                        'approveSettlement',
                        'viewDetails'
                    ]
                }
            },
            
            // Estados dinâmicos para cada marco liberado (1-10)
            ACTIVE_MILESTONE_1_RELEASED: {
                id: 'ACTIVE_MILESTONE_1_RELEASED',
                phase: 'ACTIVE',
                title: 'Contrato Ativo',
                description: 'Marco 1 liberado',
                canInteract: true,
                milestonesReleased: 1,
                actions: {
                    payer: [
                        {id: 'releaseMilestone', milestone: 1},
                        'approveCancel',
                        'proposeSettlement',
                        'viewDetails'
                    ],
                    payee: [
                        'approveCancel',
                        'approveSettlement',
                        'viewDetails'
                    ]
                }
            },
            
            // ... Estados para marcos 2-9 (similar)
            
            ACTIVE_DEADLINE_PASSED: {
                id: 'ACTIVE_DEADLINE_PASSED',
                phase: 'ACTIVE',
                title: '⏰ Prazo Vencido',
                description: 'Deadline passou - Payer pode reclamar saldo',
                canInteract: true,
                actions: {
                    payer: [
                        'claimAfterDeadline',
                        'approveCancel',
                        'viewDetails'
                    ],
                    payee: [
                        'approveCancel',
                        'viewDetails'
                    ]
                }
            },
            
            // === FASE 3: PROCESSOS ESPECIAIS ===
            CANCEL_PARTIAL_PAYER: {
                id: 'CANCEL_PARTIAL_PAYER',
                phase: 'SPECIAL_PROCESS',
                title: 'Cancelamento',
                description: 'Payer aprovou cancelamento - Aguardando Payee',
                canInteract: true,
                actions: {
                    payer: ['viewDetails'],
                    payee: ['approveCancel', 'viewDetails']
                }
            },
            
            CANCEL_PARTIAL_PAYEE: {
                id: 'CANCEL_PARTIAL_PAYEE',
                phase: 'SPECIAL_PROCESS',
                title: 'Cancelamento',
                description: 'Payee aprovou cancelamento - Aguardando Payer',
                canInteract: true,
                actions: {
                    payer: ['approveCancel', 'viewDetails'],
                    payee: ['viewDetails']
                }
            },
            
            CANCEL_WINDOW_EXPIRED: {
                id: 'CANCEL_WINDOW_EXPIRED',
                phase: 'SPECIAL_PROCESS',
                title: '⚠️ Janela de Cancelamento Expirada',
                description: 'Aprovação expirou (1h) - Contrato continua ativo',
                canInteract: true,
                actions: {
                    payer: ['approveCancel', 'viewDetails'],
                    payee: ['approveCancel', 'viewDetails']
                }
            },
            
            SETTLEMENT_PROPOSED: {
                id: 'SETTLEMENT_PROPOSED',
                phase: 'SPECIAL_PROCESS',
                title: '🤝 Acordo Proposto',
                description: 'Settlement aguardando aprovação do Payee',
                canInteract: true,
                actions: {
                    payer: ['approveCancel', 'viewDetails'],
                    payee: ['approveSettlement', 'approveCancel', 'viewDetails']
                }
            },
            
            SETTLEMENT_APPROVED_WAITING_CANCEL: {
                id: 'SETTLEMENT_APPROVED_WAITING_CANCEL',
                phase: 'SPECIAL_PROCESS',
                title: '✅ Acordo Aprovado - Aguardando Execução',
                description: 'Settlement aprovado! Ambas partes devem aprovar cancelamento para executar',
                canInteract: true,
                actions: {
                    payer: ['approveCancel', 'viewDetails'],
                    payee: ['approveCancel', 'viewDetails']
                }
            },
            
            // === FASE 4: ENCERRAMENTO ===
            COMPLETED_ALL_MILESTONES: {
                id: 'COMPLETED_ALL_MILESTONES',
                phase: 'CLOSED',
                title: '🎉 Contrato Concluído',
                description: 'Todos os marcos foram liberados',
                canInteract: false,
                isFinal: true
            },
            
            COMPLETED_CANCELLED: {
                id: 'COMPLETED_CANCELLED',
                phase: 'CLOSED',
                title: '✅ Cancelado Bilateralmente',
                description: '100% devolvido ao Payer',
                canInteract: false,
                isFinal: true
            },
            
            COMPLETED_SETTLEMENT: {
                id: 'COMPLETED_SETTLEMENT',
                phase: 'CLOSED',
                title: '✅ Acordo Aprovado',
                description: 'Settlement executado com sucesso',
                canInteract: false,
                isFinal: true
            },
            
            COMPLETED_REFUNDED: {
                id: 'COMPLETED_REFUNDED',
                phase: 'CLOSED',
                title: '✅ Refund Executado',
                description: '100% devolvido ao Payer',
                canInteract: false,
                isFinal: true
            },
            
            COMPLETED_CLAIMED_AFTER_DEADLINE: {
                id: 'COMPLETED_CLAIMED_AFTER_DEADLINE',
                phase: 'CLOSED',
                title: '✅ Saque Pós-Prazo',
                description: 'Payer recuperou saldo após deadline',
                canInteract: false,
                isFinal: true
            }
        };
    }

    /**
     * Determina o estado atual do contrato baseado nos dados da blockchain
     * @param {Object} contractData - Dados do contrato
     * @param {string} userAddress - Endereço do usuário conectado
     * @returns {Object} Estado atual com ações disponíveis
     */
    determineState(contractData, userAddress) {
        this.contractData = contractData;
        this.userRole = this.determineUserRole(contractData, userAddress);
        
        // DEBUG: Log completo do estado
        console.log('🔍 [ContractStateService] Determinando estado com dados:', {
            platformFeePaid: contractData.platformFeePaid,
            confirmedPayer: contractData.confirmedPayer,
            confirmedPayee: contractData.confirmedPayee,
            deposited: contractData.deposited,
            userRole: this.userRole
        });
        
        // FASE 1: PRÉ-DEPÓSITO
        if (!contractData.platformFeePaid) {
            console.log('→ Estado: WAITING_PLATFORM_FEE');
            return this.buildState('WAITING_PLATFORM_FEE');
        }
        
        if (!contractData.confirmedPayer && !contractData.confirmedPayee) {
            console.log('→ Estado: WAITING_BOTH_CONFIRMATIONS');
            return this.buildState('WAITING_BOTH_CONFIRMATIONS');
        }
        
        if (!contractData.confirmedPayer) {
            console.log('→ Estado: WAITING_PAYER_CONFIRMATION');
            return this.buildState('WAITING_PAYER_CONFIRMATION');
        }
        
        if (!contractData.confirmedPayee) {
            console.log('→ Estado: WAITING_PAYEE_CONFIRMATION');
            return this.buildState('WAITING_PAYEE_CONFIRMATION');
        }
        
        if (!contractData.deposited) {
            console.log('→ Estado: READY_FOR_DEPOSIT');
            return this.buildState('READY_FOR_DEPOSIT');
        }
        
        // FASE 2: CONTRATO ATIVO
        if (contractData.deposited) {
            // Verificar se todos os marcos foram liberados
            const allMilestonesReleased = this.checkAllMilestonesReleased(contractData);
            if (allMilestonesReleased) {
                return this.buildState('COMPLETED_ALL_MILESTONES');
            }
            
            // Verificar deadline
            if (this.isDeadlinePassed(contractData)) {
                return this.buildState('ACTIVE_DEADLINE_PASSED');
            }
            
            // Verificar processos especiais
            if (contractData.cancelApprovedPayer && !contractData.cancelApprovedPayee) {
                return this.buildState('CANCEL_PARTIAL_PAYER');
            }
            
            if (contractData.cancelApprovedPayee && !contractData.cancelApprovedPayer) {
                return this.buildState('CANCEL_PARTIAL_PAYEE');
            }
            
            if (contractData.settlementAmount > 0 && !contractData.settlementApproved) {
                return this.buildState('SETTLEMENT_PROPOSED');
            }
            
            if (contractData.settlementAmount > 0 && contractData.settlementApproved) {
                return this.buildState('SETTLEMENT_APPROVED_WAITING_CANCEL');
            }
            
            // Estado ativo normal - determinar quantos marcos foram liberados
            const releasedCount = this.countReleasedMilestones(contractData);
            if (releasedCount === 0) {
                return this.buildState('ACTIVE_NO_MILESTONES_RELEASED');
            } else {
                // Estado dinâmico baseado em marcos liberados
                return this.buildMilestoneState(releasedCount, contractData);
            }
        }
        
        // Estado padrão (não deveria chegar aqui)
        return this.buildState('WAITING_PLATFORM_FEE');
    }
    
    /**
     * Constrói o objeto de estado completo
     */
    buildState(stateId) {
        const stateDefinition = this.STATES[stateId];
        const actions = this.getActionsForRole(stateDefinition);
        
        return {
            ...stateDefinition,
            availableActions: actions,
            userRole: this.userRole,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Constrói estado dinâmico para marcos liberados
     */
    buildMilestoneState(releasedCount, contractData) {
        const nextMilestone = releasedCount; // Próximo marco a liberar (0-indexed)
        
        return {
            id: `ACTIVE_MILESTONE_${releasedCount}_RELEASED`,
            phase: 'ACTIVE',
            title: 'Contrato Ativo',
            description: '',
            canInteract: true,
            milestonesReleased: releasedCount,
            availableActions: this.getMilestoneActions(nextMilestone, releasedCount),
            userRole: this.userRole,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Retorna ações específicas para liberação de marcos
     */
    getMilestoneActions(nextMilestone, releasedCount) {
        if (this.userRole === 'PAYER') {
            const actions = [
                {
                    id: 'releaseMilestone',
                    label: `✅ Liberar Marco ${nextMilestone + 1}`,
                    milestone: nextMilestone,
                    type: 'primary'
                },
                {
                    id: 'approveCancel',
                    label: '❌ Aprovar Cancelamento',
                    type: 'warning'
                },
                {
                    id: 'proposeSettlement',
                    label: '🤝 Propor Acordo',
                    type: 'info'
                },
                {
                    id: 'viewDetails',
                    label: 'Ver Detalhes',
                    type: 'secondary'
                }
            ];
            
            // Refund só se nenhum marco foi liberado ainda
            if (releasedCount === 0) {
                actions.splice(1, 0, {
                    id: 'refund',
                    label: '🔄 Refund (100%)',
                    type: 'danger'
                });
            }
            
            return actions;
        } else if (this.userRole === 'PAYEE') {
            return [
                {
                    id: 'approveCancel',
                    label: '❌ Aprovar Cancelamento',
                    type: 'warning'
                },
                {
                    id: 'approveSettlement',
                    label: '✅ Aprovar Acordo',
                    type: 'info'
                },
                {
                    id: 'viewDetails',
                    label: 'Ver Detalhes',
                    type: 'secondary'
                }
            ];
        }
        
        return [];
    }
    
    /**
     * Retorna ações baseadas no papel do usuário
     */
    getActionsForRole(stateDefinition) {
        if (!stateDefinition.actions) {
            return [];
        }
        
        const roleActions = stateDefinition.actions[this.userRole.toLowerCase()] || 
                           stateDefinition.actions.both || 
                           [];
        
        return roleActions.map(action => {
            // Se já é um objeto (releaseMilestone com milestone), retornar processado
            if (typeof action === 'object') {
                const mapped = this.mapActionIdToObject(action.id);
                return { ...mapped, milestone: action.milestone };
            }
            // Se é string, mapear normalmente
            return this.mapActionIdToObject(action);
        });
    }
    
    /**
     * Mapeia string de ação para objeto completo
     */
    mapActionIdToObject(actionId) {
        const actionMap = {
            payPlatformFee: {
                id: 'payPlatformFee',
                label: '💳 Pagar Taxa (1 USDC)',
                type: 'primary'
            },
            confirmPayer: {
                id: 'confirmPayer',
                label: '✅ Confirmar Payer',
                type: 'primary'
            },
            confirmPayee: {
                id: 'confirmPayee',
                label: '✅ Confirmar Payee',
                type: 'primary'
            },
            deposit: {
                id: 'deposit',
                label: '💳 Depositar USDC (Valor Dinâmico)',
                type: 'primary'
            },
            releaseMilestone: {
                id: 'releaseMilestone',
                label: '✅ Liberar Marco',  // Label será sobrescrito
                type: 'primary'
            },
            refund: {
                id: 'refund',
                label: '🔄 Refund (100%)',
                type: 'danger'
            },
            approveCancel: {
                id: 'approveCancel',
                label: '❌ Aprovar Cancelamento',
                type: 'warning'
            },
            proposeSettlement: {
                id: 'proposeSettlement',
                label: '🤝 Propor Acordo',
                type: 'info'
            },
            approveSettlement: {
                id: 'approveSettlement',
                label: '✅ Aprovar Acordo',
                type: 'info'
            },
            claimAfterDeadline: {
                id: 'claimAfterDeadline',
                label: '⏰ Reclamar Após Prazo',
                type: 'danger'
            },
            viewDetails: {
                id: 'viewDetails',
                label: 'Ver Detalhes',
                type: 'secondary'
            }
        };
        
        return actionMap[actionId] || { id: actionId, label: actionId, type: 'secondary' };
    }
    
    /**
     * Auxiliares
     */
    determineUserRole(contractData, userAddress) {
        const userLower = userAddress.toLowerCase();
        const payerLower = contractData.payer.toLowerCase();
        const payeeLower = contractData.payee.toLowerCase();
        
        if (userLower === payerLower) return 'PAYER';
        if (userLower === payeeLower) return 'PAYEE';
        return 'OBSERVER';
    }
    
    checkAllMilestonesReleased(contractData) {
        if (!contractData.milestoneInfo || contractData.milestoneInfo.length === 0) {
            return false;
        }
        
        return contractData.milestoneInfo.every(m => m.released);
    }
    
    countReleasedMilestones(contractData) {
        if (!contractData.milestoneInfo || contractData.milestoneInfo.length === 0) {
            return 0;
        }
        
        return contractData.milestoneInfo.filter(m => m.released).length;
    }
    
    isDeadlinePassed(contractData) {
        if (!contractData.deadline) return false;
        // deadline já vem como string ISO ou Date object
        return new Date() > new Date(contractData.deadline);
    }
}

// Instância global
window.contractStateService = new ContractStateService();

