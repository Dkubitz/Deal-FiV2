/**
 * Helpers para StateBasedUIComponent
 * Renderizações de informações de progresso
 */

// Adicionar ao StateBasedUIComponent.prototype

StateBasedUIComponent.prototype.renderSettlementInfo = function(contractData) {
    if (!contractData.settlementAmount || contractData.settlementAmount <= 0) {
        return '';
    }
    
    const progress = contractData.settlementApproved ? '2/2' : '1/2';
    const progressColor = contractData.settlementApproved ? '#10b981' : '#f59e0b';
    const statusText = contractData.settlementApproved ? 'Aprovado - Aguardando Execução' : 'Aguardando Aprovação do Payee';
    
    return `
        <div class="settlement-info-card" style="
            background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(37,99,235,0.1) 100%);
            border: 2px solid rgba(59,130,246,0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #3b82f6; margin: 0; font-size: 16px; font-weight: 700;">
                    🤝 Proposta de Acordo (Settlement)
                </h3>
                <span style="
                    background: ${progressColor}20;
                    color: ${progressColor};
                    padding: 6px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid ${progressColor};
                ">
                    ${progress} Aprovações
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: rgba(255,255,255,0.3); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">Valor Oferecido ao Payee</div>
                    <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">${contractData.settlementAmount} USDC</div>
                </div>
                <div style="background: rgba(255,255,255,0.3); padding: 12px; border-radius: 8px;">
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">Status</div>
                    <div style="font-size: 14px; font-weight: 600; color: #1c1c1e;">${statusText}</div>
                </div>
            </div>
            
            ${contractData.settlementApproved ? `
                <div style="
                    background: rgba(245,158,11,0.1);
                    border: 1px solid rgba(245,158,11,0.3);
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 15px;
                    font-size: 13px;
                    color: #d97706;
                    line-height: 1.5;
                ">
                    ⚠️ <strong>Acordo aprovado!</strong> Para executar, ambas as partes devem clicar em "Aprovar Cancelamento".
                </div>
            ` : ''}
        </div>
    `;
};

StateBasedUIComponent.prototype.renderCancelInfo = function(contractData) {
    const hasCancelProgress = contractData.cancelApprovedPayer || contractData.cancelApprovedPayee;
    
    if (!hasCancelProgress) {
        return '';
    }
    
    let approvalCount = 0;
    if (contractData.cancelApprovedPayer) approvalCount++;
    if (contractData.cancelApprovedPayee) approvalCount++;
    
    const progress = `${approvalCount}/2`;
    const progressColor = approvalCount === 2 ? '#10b981' : '#f59e0b';
    
    return `
        <div class="cancel-info-card" style="
            background: linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.1) 100%);
            border: 2px solid rgba(239,68,68,0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="color: #ef4444; margin: 0; font-size: 16px; font-weight: 700;">
                    Processo de Cancelamento
                </h3>
                <span style="
                    background: ${progressColor}20;
                    color: ${progressColor};
                    padding: 6px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    border: 1px solid ${progressColor};
                ">
                    ${progress} Aprovações
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: rgba(255,255,255,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">Payer</div>
                    <div style="font-size: 24px;">
                        ${contractData.cancelApprovedPayer ? 
                            '<div style="width: 20px; height: 20px; background: white; border-radius: 50%; margin: 0 auto; animation: pulse-dot 2s ease-in-out infinite;"></div>' : 
                            '<div style="width: 20px; height: 20px; border: 2px solid white; border-radius: 50%; margin: 0 auto;"></div>'
                        }
                    </div>
                </div>
                <div style="background: rgba(255,255,255,0.3); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">Payee</div>
                    <div style="font-size: 24px;">
                        ${contractData.cancelApprovedPayee ? 
                            '<div style="width: 20px; height: 20px; background: white; border-radius: 50%; margin: 0 auto; animation: pulse-dot 2s ease-in-out infinite;"></div>' : 
                            '<div style="width: 20px; height: 20px; border: 2px solid white; border-radius: 50%; margin: 0 auto;"></div>'
                        }
                    </div>
                </div>
            </div>
            
            ${approvalCount === 2 ? `
                <div style="
                    background: rgba(16,185,129,0.1);
                    border: 1px solid rgba(16,185,129,0.3);
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 15px;
                    font-size: 13px;
                    color: #059669;
                    text-align: center;
                    font-weight: 600;
                ">
                    ✅ Cancelamento aprovado por ambas as partes! Executando...
                </div>
            ` : `
                <div style="
                    background: rgba(245,158,11,0.1);
                    border: 1px solid rgba(245,158,11,0.3);
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 15px;
                    font-size: 13px;
                    color: #d97706;
                    line-height: 1.5;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <div style="width: 16px; height: 16px; border: 2px solid #d97706; border-radius: 50%;"></div>
                    Aguardando aprovação ${contractData.cancelApprovedPayer && !contractData.cancelApprovedPayee ? 'do Payee' : contractData.cancelApprovedPayee && !contractData.cancelApprovedPayer ? 'do Payer' : 'de ambas as partes'}
                </div>
            `}
        </div>
    `;
};

