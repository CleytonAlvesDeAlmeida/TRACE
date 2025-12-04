// js/mapa-busca.js

// --------------------------------------------------------
// 1. VARIÁVEIS GLOBAIS
// --------------------------------------------------------
let collectionPoints = [];

const elements = {
    selectLinha: document.getElementById('selectLinha'),
    grupoLocalizacao: document.getElementById('grupoLocalizacao'),
    selectTipoBusca: document.getElementById('selectTipoBusca'),
    opcaoBairro: document.getElementById('opcaoBairro'),
    selectBairro: document.getElementById('selectBairro'),
    opcaoCep: document.getElementById('opcaoCep'),
    inputCep: document.getElementById('inputCep'),
    btnBuscarCep: document.getElementById('btnBuscarCep'),
    opcaoGeolocalizacao: document.getElementById('opcaoGeolocalizacao'),
    btnGeolocalizacao: document.getElementById('btnGeolocalizacao'),
    btnBuscar: document.getElementById('btnBuscar'),
    loadingResults: document.getElementById('loadingResults'),
    resultsArea: document.getElementById('resultsArea'),
    resultList: document.getElementById('resultList'),
    emptyState: document.getElementById('emptyState'),
    detailModal: document.getElementById('detailModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalConteudo: document.getElementById('modalConteudo'),
    appToast: document.getElementById('app-toast'),
};

let currentMapInstance = null;
let generalMapInstance = null;
let isSearchActive = false;
let bairros = [];
let currentToastTimeout = null;

/**
 * Exibe uma notificação Toast na tela.
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = elements.appToast;
    
    if (currentToastTimeout) {
        clearTimeout(currentToastTimeout);
        currentToastTimeout = null;
    }
    
    toast.className = 'toast';
    toast.textContent = message;
    toast.classList.add(type);
    
    void toast.offsetWidth;
    
    toast.classList.add('show');
    
    currentToastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        currentToastTimeout = null;
    }, duration);
}

/**
 * Calcula a distância Haversine entre dois pontos de coordenadas.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --------------------------------------------------------
// 2. FUNÇÕES DE MAPA (LEAFLET)
// --------------------------------------------------------

/**
 * Inicializa o mapa geral com todos os pontos de coleta.
 */
function initializeGeneralMap() {
    if (generalMapInstance) {
        generalMapInstance.remove();
        generalMapInstance = null;
    }

    const mapContainer = document.getElementById('mapaGeral');
    if (!mapContainer) return;

    generalMapInstance = L.map('mapaGeral').setView([-12.9714, -38.5014], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(generalMapInstance);

    collectionPoints.forEach(point => {
        const iconColor = getColorForLine(point.linha);
        
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 26]
        });

        const marker = L.marker([point.latitude, point.longitude], { icon: customIcon })
            .addTo(generalMapInstance)
            .bindPopup(`
                <div style="min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; color: #03264C;">${point.nome}</h3>
                    <p style="margin: 0 0 5px 0; font-size: 0.9rem;">${point.endereco}</p>
                    <p style="margin: 0 0 5px 0; font-size: 0.85rem; color: #666;">${point.tipoInstituicao}</p>
                    <p style="margin: 0; font-size: 0.8rem; color: #04C4D9; font-weight: bold;">${formatarLinha(point.linha)}</p>
                </div>
            `);
        
        marker.on('click', () => {
            openDetailModal(point);
        });
    });
}

/**
 * Retorna uma cor baseada na linha de resíduo.
 */
function getColorForLine(linha) {
    const colors = {
        'branca': '#FFFFFF',
        'azul': '#0455BF',
        'verde': '#2ECC71',
        'marrom': '#8B4513',
        'outros': '#FFA500'
    };
    return colors[linha] || '#04C4D9';
}

/**
 * Inicializa o mapa Leaflet no modal de detalhes.
 */
function initializeMap(lat, lon, name) {
    if (currentMapInstance) {
        currentMapInstance.remove();
        currentMapInstance = null;
    }

    const mapContainer = document.getElementById('detail-map');
    if (!mapContainer) {
        console.error('Container do mapa não encontrado');
        return;
    }

    mapContainer.style.height = '300px';
    mapContainer.style.width = '100%';

    try {
        currentMapInstance = L.map('detail-map').setView([lat, lon], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(currentMapInstance);

        const activeIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: var(--accent-color); width: 20px; height: 20px; border-radius: 50%; border: 4px solid var(--secondary-color);"></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28]
        });
        
        L.marker([lat, lon], { icon: activeIcon }).addTo(currentMapInstance)
            .bindPopup(name).openPopup();

        setTimeout(() => {
            if (currentMapInstance) {
                currentMapInstance.invalidateSize();
            }
        }, 200);

    } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
    }
}

// --------------------------------------------------------
// 3. LÓGICA DE RENDERIZAÇÃO E MODAL
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
        card.className = 'ponto-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Ponto de coleta: ${point.nome}`);

        const safeImage = point.imagem || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
        const imageAlt = `Imagem de ${point.nome}`;

        card.innerHTML = `
            <div class="ponto-imagem">
                <img src="${safeImage}" alt="${imageAlt}" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';" loading="lazy">
            </div>
            <div class="ponto-info">
                <h3>${point.nome}</h3>
                <div class="ponto-endereco">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${point.endereco}</span>
                </div>
                <div class="ponto-tipo">${point.tipoInstituicao}</div>
                <div class="ponto-linha">
                    <i class="fas fa-recycle"></i>
                    <span>Aceita: ${formatarLinha(point.linha)}</span>
                </div>
            </div>
        `;
        card.onclick = () => openDetailModal(point);
        card.onkeypress = (e) => {
             if (e.key === 'Enter') openDetailModal(point);
        };
        elements.resultList.appendChild(card);
    });
}

/**
 * Formatar nome da linha para exibição.
 */
function formatarLinha(linha) {
    const linhas = {
        'branca': 'Linha Branca',
        'azul': 'Linha Azul',
        'verde': 'Linha Verde',
        'marrom': 'Linha Marrom',
        'outros': 'Outros Componentes'
    };
    
    return linhas[linha] || linha;
}

/**
 * Abre o modal de detalhes do ponto de coleta.
 */
function openDetailModal(point) {
    const safeImage = point.imagem || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    
    elements.modalConteudo.innerHTML = `
        <div class="modal-imagem">
            <img src="${safeImage}" alt="Foto de ${point.nome}" id="detail-image">
        </div>
        <div class="modal-info">
            <h2 id="detail-name">${point.nome}</h2>
            <div class="modal-endereco">
                <i class="fas fa-map-marker-alt"></i>
                <span id="detail-address">${point.endereco}</span>
            </div>
            
            <div class="modal-detalhes">
                <div class="modal-detalhe">
                    <strong>Descrição:</strong>
                    <span id="detail-description">${point.descricao}</span>
                </div>
                <div class="modal-detalhe">
                    <strong>Tipo de Instituição:</strong>
                    <span id="detail-institution">${point.tipoInstituicao}</span>
                </div>
                <div class="modal-detalhe">
                    <strong>Horários de Funcionamento:</strong>
                    <span id="detail-hours">${point.horarios}</span>
                </div>
                <div class="modal-detalhe">
                    <strong>Caixa Coletora:</strong>
                    <span id="detail-caixa">${point.caixaColetora === 'sim' ? 'Sim' : point.caixaColetora === 'nao' ? 'Não' : 'Não informado'}</span>
                </div>
                <div class="modal-detalhe">
                    <strong>Bairro e CEP:</strong>
                    <span id="detail-bairro-cep">${point.bairro} | CEP: ${point.cep}</span>
                </div>
                <div class="modal-detalhe">
                    <strong>Linha/Categoria:</strong>
                    <span>${formatarLinha(point.linha)}</span>
                </div>
            </div>
            
            <div class="modal-residuos">
                <h3>Tipos de Resíduos Aceitos</h3>
                <div class="residuos-lista" id="residuos-list">
                    ${point.tiposResiduos.map(r => `<div class="residuo-tag">${r}</div>`).join('')}
                </div>
            </div>
        </div>
        <div class="modal-mapa">
            <div id="detail-map"></div>
            <a href="https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}" target="_blank" class="btn-google-maps">
                <i class="fab fa-google"></i>
                Ver no Google Maps
            </a>
        </div>
        <br>
        <br>
        <br>
        <br>
        <br>
    `;
    
    elements.detailModal.classList.add('open');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        initializeMap(point.latitude, point.longitude, point.nome);
    }, 100);
}

/**
 * Fecha o modal de detalhes.
 */
function closeDetailModal() {
    elements.detailModal.classList.remove('open');
    document.body.style.overflow = '';
    if (currentMapInstance) {
        currentMapInstance.remove();
        currentMapInstance = null;
    }
}

// --------------------------------------------------------
// 4. LÓGICA DE BUSCA PRINCIPAL
// --------------------------------------------------------

/**
 * Lógica principal de busca.
 */
function handleSearch() {
    if (isSearchActive) return;

    const searchType = elements.selectTipoBusca.value;
    const searchTerm = elements.inputCep.value.trim().toLowerCase();
    const linhaSelecionada = elements.selectLinha.value;
    isSearchActive = true;
    renderLoadingState();

    setTimeout(() => {
        try {
            let pontosFiltrados = collectionPoints.filter(ponto => 
                ponto.linha === linhaSelecionada
            );

            if (searchType === 'geolocation') {
                handleGeolocationSearch(pontosFiltrados);
            } else {
                if (!searchTerm) {
                    showToast('Digite um Bairro ou CEP válido.', 'error', 3000);
                    renderResults([]);
                    isSearchActive = false;
                    return;
                }
                
                const query = searchTerm.replace(/-/g, '').replace(/\s+/g, '');

                let exactMatches = pontosFiltrados.filter(p => 
                    p.bairro.toLowerCase().replace(/\s+/g, '') === query || 
                    p.cep.replace(/-/g, '') === query
                );

                if (exactMatches.length > 0) {
                    renderResults(exactMatches);
                    showToast(`${exactMatches.length} ponto(s) encontrado(s) por correspondência exata.`, 'success', 3000);
                } else {
                    const referencePoint = pontosFiltrados.length > 0 ? pontosFiltrados[0] : null; 

                    if (referencePoint) {
                        const nearestPoints = pontosFiltrados
                            .map(p => ({
                                ...p,
                                distance: calculateDistance(referencePoint.latitude, referencePoint.longitude, p.latitude, p.longitude)
                            }))
                            .sort((a, b) => a.distance - b.distance)
                            .slice(0, 3);
                        
                        showToast('Nenhum resultado exato. Mostrando os 3 pontos mais próximos da área de referência.', 'warning', 5000);
                        renderResults(nearestPoints);
                    } else {
                        renderResults([]);
                    }
                }
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            showToast('Ocorreu um erro interno durante a busca.', 'error', 3000);
            renderResults([]);
        } finally {
            isSearchActive = false;
        }
    }, 500);
}

/**
 * Lógica de busca por geolocalização.
 */
function handleGeolocationSearch(pontosFiltrados) {
    if (!navigator.geolocation) {
        showToast('Seu dispositivo não suporta geolocalização.', 'error', 3000);
        renderResults([]);
        isSearchActive = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;
            
            const pointsWithDistance = pontosFiltrados.map(point => ({
                ...point,
                distance: calculateDistance(userLat, userLon, point.latitude, point.longitude)
            }));

            pointsWithDistance.sort((a, b) => a.distance - b.distance);

            const resultsForDisplay = pointsWithDistance.map(p => ({
                ...p,
                nome: `${p.nome} (${p.distance.toFixed(1)} km)`
            }));

            renderResults(resultsForDisplay);
            showToast('Pontos listados por proximidade à sua localização.', 'success', 3000);
            isSearchActive = false;
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
            showToast(msg, 'error', 5000);
            renderResults([]);
            isSearchActive = false;
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

// --------------------------------------------------------
// 5. CARREGAMENTO DE DADOS DOS ARQUIVOS JSON
// --------------------------------------------------------

/**
 * Carrega os bairros do arquivo JSON.
 */
async function carregarBairros() {
    try {
        const response = await fetch('./data/bairros.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.bairros)) {
            bairros = data.bairros;
            
            elements.selectBairro.innerHTML = '<option value="">Selecione um bairro</option>';
            
            bairros.sort((a, b) => a.localeCompare(b));
            
            bairros.forEach(bairro => {
                const option = document.createElement('option');
                option.value = bairro.toLowerCase().replace(/\s+/g, '');
                option.textContent = bairro;
                elements.selectBairro.appendChild(option);
            });
            
            console.log(`${bairros.length} bairros carregados com sucesso do arquivo JSON.`);
        } else {
            throw new Error('Formato de arquivo JSON inválido');
        }
    } catch (error) {
        console.error('Erro ao carregar bairros do JSON:', error);
        
        const fallbackBairros = [
            "Acupe de Brotas", "Alto do Cabrito", "Alto das Pombas", "Amaralina", "Bairro da Paz",
            "Baixa do Bonfim", "Baixa dos Sapateiros", "Barbalho", "Barra", "Barris",
            "Boca do Rio", "Brotas", "Cabula", "Cajazeiras", "Calabar", "Calçada",
            "Centro", "Chapada do Rio Vermelho", "Cidade Nova", "Cosme de Farias",
            "Costa Azul", "Curuzu", "Engenho Velho de Brotas", "Federação", "Garcia",
            "Graça", "Itaigara", "Itapuã", "Jardim Armação", "Liberdade", "Lobato",
            "Nazaré", "Ondina", "Paripe", "Pau Miúdo", "Pernambués", "Piatã", "Pituba",
            "Pirajá", "Plataforma", "Ribeira", "Rio Vermelho", "Santa Cruz", "Santo Antônio",
            "São Caetano", "São Gonçalo", "Sussuarana", "Tancredo Neves", "Uruguai",
            "Valéria", "Vila Canária", "Vila Laura", "Vitória"
        ];
        
        bairros = fallbackBairros;
        
        elements.selectBairro.innerHTML = '<option value="">Selecione um bairro</option>';
        
        fallbackBairros.forEach(bairro => {
            const option = document.createElement('option');
            option.value = bairro.toLowerCase().replace(/\s+/g, '');
            option.textContent = bairro;
            elements.selectBairro.appendChild(option);
        });
    }
}

/**
 * Carrega os pontos de coleta do arquivo JSON.
 */
async function carregarPontosDeColeta() {
    try {
        const response = await fetch('../data/pontos-coleta.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data.pontos)) {
            collectionPoints = data.pontos;
            console.log(`${collectionPoints.length} pontos de coleta carregados com sucesso.`);
            
            initializeGeneralMap();
        } else {
            throw new Error('Formato de arquivo JSON inválido');
        }
    } catch (error) {
        console.error('Erro ao carregar pontos de coleta:', error);
        showToast('Erro ao carregar os pontos de coleta. Verifique o arquivo JSON.', 'error', 5000);
        
        // Fallback: usar dados padrão
        collectionPoints = [
            { "id": "trace-01", "nome": "Ecoponto Central Recicla", "endereco": "Rua das Flores, 123", "descricao": "Ecoponto municipal que aceita diversos tipos de lixo eletrônico, incluindo pilhas e baterias. Possui equipe para auxiliar no descarte correto.", "tipoInstituicao": "Prefeitura", "horarios": "Seg–Sex 09:00–17:00, Sáb 08:00–12:00", "caixaColetora": "sim", "bairro": "Centro", "cep": "01000-000", "tiposResiduos": ["pilhas", "baterias", "celulares", "cabos", "periféricos"], "imagem": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", "latitude": -12.9714, "longitude": -38.5014, "linha": "verde" },
            { "id": "trace-02", "nome": "ONG Tech Verde", "endereco": "Avenida Brasil, 456", "descricao": "Organização não governamental focada no recondicionamento e descarte de eletrônicos para doação e reciclagem.", "tipoInstituicao": "ONG", "horarios": "Seg–Sex 09:00–18:00", "caixaColetora": "nao", "bairro": "Vila Nova", "cep": "02000-000", "tiposResiduos": ["computadores", "notebooks", "monitores", "impressoras", "celulares"], "imagem": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", "latitude": -12.9780, "longitude": -38.5045, "linha": "verde" }
        ];
        
        initializeGeneralMap();
    }
}

// --------------------------------------------------------
// 6. EVENT LISTENERS E INICIALIZAÇÃO
// --------------------------------------------------------

/**
 * Função para alternar entre os estados de busca.
 */
function handleSearchTypeChange(e) {
    const type = e.target.value;
    elements.inputCep.value = '';
    elements.resultsArea.classList.add('hidden');
    elements.opcaoBairro.classList.add('hidden');
    elements.opcaoCep.classList.add('hidden');
    elements.opcaoGeolocalizacao.classList.add('hidden');
    elements.btnBuscar.disabled = false;
    
    if (type === 'geolocation') {
        elements.opcaoGeolocalizacao.classList.remove('hidden');
        elements.btnBuscar.textContent = 'Buscar Localização';
    } else if (type === 'bairro') {
        elements.opcaoBairro.classList.remove('hidden');
        elements.btnBuscar.textContent = 'Buscar';
    } else if (type === 'cep') {
        elements.opcaoCep.classList.remove('hidden');
        elements.btnBuscar.textContent = 'Buscar';
        elements.btnBuscar.disabled = true;
    }
}

// Eventos de Busca
if (elements.selectLinha) {
    elements.selectLinha.addEventListener('change', function() {
        const linhaSelecionada = this.value;
        
        if (linhaSelecionada) {
            elements.grupoLocalizacao.style.display = 'block';
            elements.btnBuscar.disabled = true;
        } else {
            elements.grupoLocalizacao.style.display = 'none';
            elements.btnBuscar.disabled = true;
        }
        
        elements.selectTipoBusca.value = '';
        elements.opcaoBairro.classList.add('hidden');
        elements.opcaoCep.classList.add('hidden');
        elements.opcaoGeolocalizacao.classList.add('hidden');
    });
}

if (elements.selectTipoBusca) {
    elements.selectTipoBusca.addEventListener('change', handleSearchTypeChange);
}

if (elements.inputCep) {
    elements.inputCep.addEventListener('input', function() {
        let cep = this.value.replace(/\D/g, '');
        cep = cep.replace(/(\d{5})(\d)/, '$1-$2');
        this.value = cep;
        
        elements.btnBuscar.disabled = cep.length !== 9;
    });
}

if (elements.btnBuscarCep) {
    elements.btnBuscarCep.addEventListener('click', function() {
        if (elements.inputCep.value.length === 9) {
            elements.btnBuscar.disabled = false;
        }
    });
}

if (elements.btnGeolocalizacao) {
    elements.btnGeolocalizacao.addEventListener('click', function() {
        handleSearch();
    });
}

if (elements.btnBuscar) {
    elements.btnBuscar.addEventListener('click', handleSearch);
}

if (elements.selectBairro) {
    elements.selectBairro.addEventListener('change', function() {
        if (this.value) {
            elements.inputCep.value = this.options[this.selectedIndex].text;
            elements.btnBuscar.disabled = false;
        }
    });
}

// Eventos do Modal
if (elements.closeModalBtn) {
    elements.closeModalBtn.addEventListener('click', closeDetailModal);
}

if (elements.detailModal) {
    elements.detailModal.addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') {
            closeDetailModal();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.detailModal && elements.detailModal.classList.contains('open')) {
        closeDetailModal();
    }
});

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    // Carregar bairros e pontos de coleta
    carregarBairros();
    carregarPontosDeColeta();
});