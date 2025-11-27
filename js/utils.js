/**
 * js/utils.js
 * Funções de utilidade para o projeto T.R.A.C.E.
 */

/**
 * Calcula a distância euclidiana entre dois pontos geográficos (lat/lon).
 * NOTA: Esta é uma aproximação de 'distância simples' e ignora a curvatura da Terra
 * (diferente da fórmula de Haversine), conforme sugerido no requisito 5 para simplificação.
 * A distância resultante não está em km, mas sim em uma unidade de "proximidade".
 * @param {number} lat1 Latitude do ponto 1.
 * @param {number} lon1 Longitude do ponto 1.
 * @param {number} lat2 Latitude do ponto 2.
 * @param {number} lon2 Longitude do ponto 2.
 * @returns {number} Distância euclidiana (unidade de proximidade).
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    // Distância euclidiana simples: sqrt((x2-x1)^2 + (y2-y1)^2)
    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;
    
    // Não é necessário calcular a raiz quadrada (Math.sqrt), pois para fins de ordenação
    // (qual ponto é mais próximo), a comparação do quadrado da distância já é suficiente.
    // Isso economiza um cálculo caro.
    return deltaLat * deltaLat + deltaLon * deltaLon;
}

/**
 * Retorna o status de cor e texto formatado para a caixa coletora.
 * @param {string} status Status da caixa coletora ("sim", "nao", "nao informado").
 * @returns {{className: string, text: string}} Objeto com classe CSS e texto formatado.
 */
export function formatCaixaStatus(status) {
    switch (status.toLowerCase()) {
        case 'sim':
            return { className: 'status-sim', text: 'Sim (Caixa Coletora Disponível)' };
        case 'nao':
            return { className: 'status-nao', text: 'Não (Entregar no balcão)' };
        default:
            return { className: 'status-ni', text: 'Não Informado' };
    }
}

/**
 * Retorna uma função que cria o elemento Skeleton Card.
 * @returns {string} HTML do Skeleton Card.
 */
export function createSkeletonCard() {
    return `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-info">
                <div class="skeleton-line h3"></div>
                <div class="skeleton-line body1"></div>
                <div class="skeleton-line body2"></div>
            </div>
        </div>
    `;
}
