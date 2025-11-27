// --------------------------------------------------------
// 1. DADOS - (Simulando a importação do data/pontos.json)
// --------------------------------------------------------
const collectionPoints = [
    { "id": "trace-01", "nome": "Ecoponto Central Recicla", "endereco": "Rua das Flores, 123", "descricao": "Ecoponto municipal que aceita diversos tipos de lixo eletrônico, incluindo pilhas e baterias. Possui equipe para auxiliar no descarte correto.", "tipoInstituicao": "Prefeitura", "horarios": "Seg–Sex 09:00–17:00, Sáb 08:00–12:00", "caixaColetora": "sim", "bairro": "Centro", "cep": "01000-000", "tiposResiduos": ["pilhas", "baterias", "celulares", "cabos", "periféricos"], "imagem": "assets/images/exemplo1.jpg", "latitude": -23.550520, "longitude": -46.633300 },
    { "id": "trace-02", "nome": "ONG Tech Verde", "endereco": "Avenida Brasil, 456", "descricao": "Organização não governamental focada no recondicionamento e descarte de eletrônicos para doação e reciclagem.", "tipoInstituicao": "ONG", "horarios": "Seg–Sex 09:00–18:00", "caixaColetora": "nao", "bairro": "Vila Nova", "cep": "02000-000", "tiposResiduos": ["computadores", "notebooks", "monitores", "impressoras", "celulares"], "imagem": "assets/images/exemplo2.jpg", "latitude": -23.547780, "longitude": -46.640100 },
    { "id": "trace-03", "nome": "Eletro Store - Ponto de Coleta", "endereco": "Rua Augusta, 789", "descricao": "Loja de eletrônicos que oferece um ponto de coleta para descarte de pequenos e médios aparelhos. Ideal para itens comprados na rede.", "tipoInstituicao": "Loja", "horarios": "Seg–Sáb 10:00–22:00", "caixaColetora": "sim", "bairro": "Consolação", "cep": "03000-000", "tiposResiduos": ["celulares", "tablets", "cabos", "fones de ouvido"], "imagem": "assets/images/exemplo3.jpg", "latitude": -23.558300, "longitude": -46.657000 },
    { "id": "trace-04", "nome": "Centro Comunitário Alfa", "endereco": "Rua da Saúda, s/n", "descricao": "Ponto de coleta esporádico em parceria com a prefeitura. Verifique os dias de coleta especial.", "tipoInstituicao": "Posto de coleta", "horarios": "Conforme eventos (consultar site)", "caixaColetora": "nao informado", "bairro": "Vila Mariana", "cep": "04000-000", "tiposResiduos": ["todos"], "imagem": "assets/images/exemplo4.jpg", "latitude": -23.583000, "longitude": -46.638000 },
    { "id": "trace-05", "nome": "Ponto Verde Shopping", "endereco": "Avenida das Américas, 1000", "descricao": "Ponto de coleta permanente em shopping center. Acesso facilitado e segurança.", "tipoInstituicao": "Loja", "horarios": "Todos os dias 10:00–22:00", "caixaColetora": "sim", "bairro": "Barra Funda", "cep": "05000-000", "tiposResiduos": ["pilhas", "baterias", "celulares", "pequenos eletrodomésticos"], "imagem": "assets/images/exemplo5.jpg", "latitude": -23.525000, "longitude": -46.690000 }
];

// --------------------------------------------------------
// 2. VARIÁVEIS E UTILS GLOBAIS
// --------------------------------------------------------

const elements = {
    searchType: document.getElementById('search-type'),
    searchInput: document.getElementById('search-input'),
    searchButton: document.getElementById('search-button'),
    searchFeedback: document.getElementById('search-feedback'),
    resultsArea: document.getElementById('results-area'),
    resultList: document.getElementById('result-list'),
    emptyState: document.getElementById('empty-state'),
    loadingResults: document.getElementById('loading-results'),
    detailModal: document.getElementById('detail-modal-overlay'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    openSidebarBtn: document.getElementById('open-sidebar-btn'),
    closeSidebarBtn: document.getElementById('close-sidebar-btn'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
};

let currentMapInstance = null;
let isSearchActive = false; // Flag para prevenir cliques duplicados

/**
 * Calcula a distância Haversine entre dois pontos de coordenadas (lat, lon).
 * @param {number} lat1 Latitude do Ponto 1
 * @param {number} lon1 Longitude do Ponto 1
 * @param {number} lat2 Latitude do Ponto 2
 * @param {number} lon2 Longitude do Ponto 2
 * @returns {number} Distância em quilômetros (km).
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

/**
 * Exibe uma notificação Toast na tela.
 * @param {string} message Mensagem a ser exibida.
 * @param {string} type Tipo de toast ('success', 'error', 'warning').
 * @param {number} duration Duração em milissegundos.
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('app-toast');
    toast.textContent = message;
    // Remove todas as classes de tipo antes de adicionar a nova
    toast.className = 'toast'; 
    toast.classList.add('show', type);
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// --------------------------------------------------------
// 3. FUNÇÕES DE MAPA (LEAFLET)
// --------------------------------------------------------

/**
 * Inicializa o mapa Leaflet no modal de detalhes.
 * @param {number} lat Latitude do ponto.
 * @param {number} lon Longitude do ponto.
 * @param {string} name Nome do ponto para o popup.
 */
function initializeMap(lat, lon, name) {
    // Limpa a instância anterior do mapa
    if (currentMapInstance) {
        currentMapInstance.remove();
        currentMapInstance = null;
    }

    const mapContainer = document.getElementById('detail-map');
    if (!mapContainer) return;

    // Inicializa mapa e centraliza no ponto
    currentMapInstance = L.map('detail-map').setView([lat, lon], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(currentMapInstance);

    // Icone personalizado para o ponto de coleta
    const activeIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: var(--p-500); width: 20px; height: 20px; border-radius: 50%; border: 4px solid var(--p-900);"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
    });
    
    // Adiciona o marcador ativo
    L.marker([lat, lon], { icon: activeIcon }).addTo(currentMapInstance)
        .bindPopup(name).openPopup();

    // Corrige visualização do mapa dentro de um modal após a transição
    setTimeout(() => {
        if (currentMapInstance) {
            currentMapInstance.invalidateSize();
        }
    }, 350); 
}


// --------------------------------------------------------
// 4. LÓGICA DE RENDERIZAÇÃO E MODAL
// --------------------------------------------------------

/**
 * Renderiza os skeletons de carregamento.
 */
function renderLoadingState() {
    elements.resultList.innerHTML = '';
    elements.resultsArea.classList.remove('hidden');
    elements.loadingResults.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
}

/**
 * Renderiza a lista de cards de resultado.
 * @param {Array<Object>} points Pontos de coleta para exibir.
 */
function renderResults(points) {
    elements.loadingResults.classList.add('hidden');
    elements.resultsArea.classList.remove('hidden');
    elements.resultList.innerHTML = '';
    
    if (points.length === 0) {
        elements.emptyState.classList.remove('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');

    points.forEach(point => {
        const card = document.createElement('div');
        card.className = 'card cursor-pointer p-4 flex gap-4 items-center';
        card.setAttribute('tabindex', '0'); 
        card.setAttribute('aria-label', `Ponto de coleta: ${point.nome}`);

        // A imagem "assets/images/placeholder.png" deve existir ou o onerror será acionado
        const safeImage = point.imagem || 'assets/images/placeholder.png';
        const imageAlt = `Imagem de ${point.nome}`;

        card.innerHTML = `
            <img src="${safeImage}" alt="${imageAlt}" onerror="this.onerror=null;this.src='assets/images/placeholder.png';" 
                 class="w-20 h-20 object-cover rounded-md flex-shrink-0" loading="lazy">
            <div class="flex-grow">
                <h3 style="margin: 0 0 4px 0;">${point.nome}</h3>
                <p class="text-sm" style="color: var(--n-700); margin: 0;">${point.endereco}</p>
                <p class="text-xs font-semibold" style="color: var(--a-600); margin: 4px 0 0 0;">${point.tipoInstituicao}</p>
            </div>
        `;
        card.onclick = () => openDetailModal(point);
        // Adiciona evento para acessibilidade (Enter)
        card.onkeypress = (e) => {
             if (e.key === 'Enter') openDetailModal(point);
        };
        elements.resultList.appendChild(card);
    });
}

/**
 * Abre o modal de detalhes do ponto de coleta.
 * @param {Object} point Objeto do ponto de coleta.
 */
function openDetailModal(point) {
    document.getElementById('detail-name').textContent = point.nome;
    document.getElementById('detail-institution').textContent = point.tipoInstituicao;
    document.getElementById('detail-address').textContent = point.endereco;
    document.getElementById('detail-bairro-cep').textContent = `${point.bairro} | CEP: ${point.cep}`;
    document.getElementById('detail-hours').textContent = point.horarios;
    document.getElementById('detail-description').textContent = point.descricao;
    
    // Caixa Coletora (Muda a cor conforme o status)
    const caixaElement = document.getElementById('detail-caixa');
    caixaElement.textContent = point.caixaColetora.toUpperCase();
    caixaElement.style.color = point.caixaColetora.toLowerCase() === 'sim' ? 'var(--a-600)' :
                               point.caixaColetora.toLowerCase() === 'nao' ? 'var(--e-600)' : 'var(--w-600)';

    // Imagem 
    const detailImage = document.getElementById('detail-image');
    detailImage.src = point.imagem || 'assets/images/placeholder.png';
    detailImage.alt = `Foto de ${point.nome}`;

    // Tipos de Resíduos (Cria os "chips")
    const residuosList = document.getElementById('residuos-list');
    residuosList.innerHTML = point.tiposResiduos.map(r => `<li>${r.toUpperCase()}</li>`).join('');

    // Mapa
    initializeMap(point.latitude, point.longitude, point.nome);

    elements.detailModal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Evita scroll da página principal
}

/**
 * Fecha o modal de detalhes.
 */
function closeDetailModal() {
    elements.detailModal.classList.remove('open');
    document.body.style.overflow = '';
    // Destrói a instância do mapa para evitar erros do Leaflet
    if (currentMapInstance) {
        currentMapInstance.remove();
        currentMapInstance = null;
    }
}


// --------------------------------------------------------
// 5. LÓGICA DE BUSCA PRINCIPAL
// --------------------------------------------------------

/**
 * Lógica principal de busca.
 */
function handleSearch() {
    if (isSearchActive) return;

    const searchType = elements.searchType.value;
    const searchTerm = elements.searchInput.value.trim().toLowerCase();
    elements.searchFeedback.textContent = '';
    isSearchActive = true;
    renderLoadingState();

    setTimeout(() => { // Simula um pequeno delay de rede para UX
        try {
            if (searchType === 'geolocation') {
                handleGeolocationSearch();
            } else { // Bairro ou CEP
                if (!searchTerm) {
                    showToast('Digite um Bairro ou CEP válido.', 'error');
                    renderResults([]);
                    return;
                }
                
                // Normaliza o termo de busca (remove hífens do CEP)
                const query = searchTerm.replace(/-/g, '').replace(/\s+/g, '');

                let exactMatches = collectionPoints.filter(p => 
                    p.bairro.toLowerCase().replace(/\s+/g, '') === query || 
                    p.cep.replace(/-/g, '') === query
                );

                if (exactMatches.length > 0) {
                    renderResults(exactMatches);
                    showToast(`${exactMatches.length} ponto(s) encontrado(s) por correspondência exata.`, 'success');
                } else {
                    // Fallback: Se não houver resultados exatos
                    // Simula uma busca por proximidade usando um ponto central de referência.
                    const referencePoint = collectionPoints.length > 0 ? collectionPoints[0] : null; 

                    if (referencePoint) {
                        const nearestPoints = collectionPoints
                            .map(p => ({
                                ...p,
                                distance: calculateDistance(referencePoint.latitude, referencePoint.longitude, p.latitude, p.longitude)
                            }))
                            .sort((a, b) => a.distance - b.distance)
                            .slice(0, 3);
                        
                        showToast('Nenhum resultado exato. Mostrando os 3 pontos mais próximos da área de referência.', 'warning', 5000);
                        renderResults(nearestPoints);
                    } else {
                        // Não há pontos no JSON
                        renderResults([]);
                    }
                }
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            elements.searchFeedback.textContent = 'Erro ao processar a busca: ' + error.message;
            showToast('Ocorreu um erro interno durante a busca.', 'error');
            renderResults([]);
        } finally {
            isSearchActive = false;
        }
    }, 500);
}

/**
 * Lógica de busca por geolocalização.
 */
function handleGeolocationSearch() {
    elements.searchFeedback.textContent = 'Solicitando permissão de localização...';
    elements.searchButton.disabled = true;

    if (!navigator.geolocation) {
        elements.searchFeedback.textContent = 'Geolocalização não é suportada pelo seu navegador.';
        showToast('Seu dispositivo não suporta geolocalização.', 'error');
        renderResults([]);
        elements.searchButton.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            elements.searchFeedback.textContent = 'Localização obtida. Calculando proximidade...';
            
            // Calcula a distância usando a Fórmula de Haversine
            const pointsWithDistance = collectionPoints.map(point => ({
                ...point,
                distance: calculateDistance(userLat, userLon, point.latitude, point.longitude)
            }));

            // Ordena por distância (mais próximo primeiro)
            pointsWithDistance.sort((a, b) => a.distance - b.distance);

            // Formata o nome para incluir a distância
            const resultsForDisplay = pointsWithDistance.map(p => ({
                ...p,
                nome: `${p.nome} (${p.distance.toFixed(1)} km)`
            }));

            renderResults(resultsForDisplay);
            showToast('Pontos listados por proximidade à sua localização.', 'success');
            elements.searchButton.disabled = false;
            elements.searchFeedback.textContent = '';
        },
        (error) => {
            let msg = 'Erro de Geolocalização: ';
            if (error.code === error.PERMISSION_DENIED) {
                msg += 'Permissão negada. Verifique as configurações do seu navegador.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                msg += 'Localização indisponível.';
            } else {
                msg += 'Ocorreu um erro desconhecido.';
            }
            console.error('Erro de Geolocalização:', error);
            elements.searchFeedback.textContent = msg;
            showToast(msg, 'error', 5000);
            renderResults([]);
            elements.searchButton.disabled = false;
        },
        { timeout: 10000, enableHighAccuracy: true } // Opções de alta precisão
    );
}


// --------------------------------------------------------
// 6. EVENT LISTENERS E INICIALIZAÇÃO
// --------------------------------------------------------

/**
 * Função para alternar entre os estados de busca (CEP/Bairro/Geolocation).
 */
function handleSearchTypeChange(e) {
    const type = e.target.value;
    elements.searchInput.value = '';
    elements.searchFeedback.textContent = '';
    elements.resultsArea.classList.add('hidden');
    elements.searchInput.classList.remove('hidden');
    elements.searchButton.disabled = false;
    
    if (type === 'geolocation') {
        elements.searchInput.classList.add('hidden');
        elements.searchButton.textContent = 'Buscar Localização';
    } else {
        elements.searchButton.textContent = 'Buscar';
        elements.searchInput.placeholder = type === 'bairro' ? 'Digite o nome do Bairro' : 'Digite o CEP (00000-000)';
    }
}

// Eventos do Menu Hambúrguer (Responsividade)
const closeMenu = () => {
    elements.sidebar.classList.remove('open');
    elements.overlay.classList.remove('active');
    document.body.style.overflow = '';
};
elements.openSidebarBtn.addEventListener('click', () => {
    elements.sidebar.classList.add('open');
    elements.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
});
elements.closeSidebarBtn.addEventListener('click', closeMenu);
elements.overlay.addEventListener('click', closeMenu);

// Eventos de Busca
elements.searchType.addEventListener('change', handleSearchTypeChange);
elements.searchButton.addEventListener('click', handleSearch);
elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
    }
});

// Eventos do Modal
elements.closeModalBtn.addEventListener('click', closeDetailModal);
elements.detailModal.addEventListener('click', (e) => {
    // Fecha o modal se o clique ocorrer no overlay
    if (e.target.id === 'detail-modal-overlay') {
        closeDetailModal();
    }
});
document.addEventListener('keydown', (e) => {
    // Fecha o modal ao pressionar ESC
    if (e.key === 'Escape' && elements.detailModal.classList.contains('open')) {
        closeDetailModal();
    }
});

// Inicialização: Carrega os resultados iniciais no DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Configura o estado inicial da busca (ex: Busca por Bairro 'Centro')
    elements.searchType.value = 'bairro';
    elements.searchInput.value = 'Centro'; 
    elements.searchInput.placeholder = 'Digite o nome do Bairro';
    handleSearch();
});
