/**
 * js/app.js
 * Lógica principal da aplicação T.R.A.C.E.
 */
import { calculateDistance, formatCaixaStatus, createSkeletonCard } from './utils.js';
import { initMap, setDetailMarker, clearMap } from './map.js';

// Elementos do DOM
const $searchType = document.getElementById('search-type');
const $textSearchContainer = document.getElementById('text-search-container');
const $searchInput = document.getElementById('search-input');
const $searchButton = document.getElementById('search-button');
const $geolocationMessage = document.getElementById('geolocation-message');
const $resultsContainer = document.getElementById('results-container');
const $emptyState = document.getElementById('empty-state');
const $loadingSpinner = document.getElementById('loading-spinner');
const $modal = document.getElementById('details-modal');
const $modalBody = document.getElementById('modal-body');
const $closeModal = document.getElementById('close-modal');
const $menuToggle = document.getElementById('menu-toggle');
const $navMenu = document.getElementById('nav-menu');

let allPoints = [];
const DEFAULT_COORDS = { latitude: -23.549200, longitude: -46.632900 }; // Coordenadas padrão (São Paulo - Centro)

/**
 * Função principal para carregar os dados JSON.
 */
async function loadPoints() {
    $loadingSpinner.style.display = 'block';
    try {
        const response = await fetch('data/pontos.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar pontos: ${response.statusText}`);
        }
        allPoints = await response.json();
        
        // Exibe todos os pontos por padrão ao carregar
        displayResults(allPoints);
        
    } catch (error) {
        console.error("Falha ao carregar dados dos pontos:", error);
        $emptyState.innerHTML = `<p class="h3 error">Erro ao carregar dados!</p><p class="body1">Verifique se o servidor local está rodando.</p>`;
        $emptyState.style.display = 'block';
    } finally {
        $loadingSpinner.style.display = 'none';
    }
}

/**
 * Cria e insere o HTML do card de ponto de coleta.
 * @param {object} ponto Objeto do ponto de coleta.
 * @returns {string} HTML do card.
 */
function createPointCard(ponto) {
    return `
        <a href="#" class="result-card card" data-id="${ponto.id}" aria-label="Ver detalhes do ponto ${ponto.nome}">
            <div class="card-image-container">
                <img src="${ponto.imagem}" alt="Imagem do local de coleta ${ponto.nome}" class="card-image">
            </div>
            <div class="card-info">
                <h3>${ponto.nome}</h3>
                <p class="body1">${ponto.endereco}</p>
                <p class="caption">${ponto.tipoInstituicao}</p>
            </div>
        </a>
    `;
}

/**
 * Exibe a lista de resultados no DOM.
 * @param {Array<object>} results Lista de pontos de coleta.
 */
function displayResults(results) {
    $resultsContainer.innerHTML = '';
    $emptyState.style.display = 'none';

    if (results.length === 0) {
        $emptyState.style.display = 'block';
        return;
    }

    results.forEach(ponto => {
        $resultsContainer.innerHTML += createPointCard(ponto);
    });

    // Adiciona event listeners para abrir o modal de detalhes
    document.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const pointId = card.getAttribute('data-id');
            const ponto = allPoints.find(p => p.id === pointId);
            if (ponto) {
                openDetailsModal(ponto);
            }
        });
    });
}

/**
 * Lógica de busca e filtragem.
 */
function handleSearch() {
    $resultsContainer.innerHTML = createSkeletonCard().repeat(3); // Skeletons
    $emptyState.style.display = 'none';
    $loadingSpinner.style.display = 'block';

    const searchType = $searchType.value;
    const searchTerm = $searchInput.value.trim().toLowerCase();
    
    let filteredPoints = [];

    // Lógica síncrona/rápida para filtro por Bairro/CEP
    if (searchType === 'bairro' || searchType === 'cep') {
        if (!searchTerm) {
            filteredPoints = allPoints;
        } else {
            filteredPoints = allPoints.filter(ponto => 
                (searchType === 'bairro' && ponto.bairro.toLowerCase().includes(searchTerm)) ||
                (searchType === 'cep' && ponto.cep.replace('-', '').includes(searchTerm.replace('-', '')))
            );

            // Se não houver resultados exatos, mostra os 3 mais próximos da coordenada default (ponto 1)
            if (filteredPoints.length === 0) {
                const centerLat = allPoints[0].latitude; // Usando o primeiro ponto como "centro" para o cálculo
                const centerLon = allPoints[0].longitude;

                const sortedByProximity = allPoints
                    .map(ponto => ({
                        ...ponto,
                        distance: calculateDistance(centerLat, centerLon, ponto.latitude, ponto.longitude)
                    }))
                    .sort((a, b) => a.distance - b.distance)
                    .slice(0, 3); // Top 3
                
                // Marca que são resultados de proximidade
                if (sortedByProximity.length > 0) {
                    alert('Nenhum resultado exato encontrado. Mostrando os 3 pontos mais próximos do centro padrão.');
                    filteredPoints = sortedByProximity;
                }
            }
        }
        
        $loadingSpinner.style.display = 'none';
        displayResults(filteredPoints);
        return;

    } 
    
    // Lógica assíncrona para Geolocalização
    else if (searchType === 'geolocation') {
        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada por este navegador.');
            $loadingSpinner.style.display = 'none';
            displayResults([]);
            return;
        }

        // Simula o clique em buscar para iniciar a geolocalização
        $geolocationMessage.textContent = 'Aguardando permissão de localização...';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                $geolocationMessage.textContent = `Localização obtida: Lat ${latitude.toFixed(4)}, Lon ${longitude.toFixed(4)}.`;

                // Calcula a distância e ordena
                filteredPoints = allPoints
                    .map(ponto => ({
                        ...ponto,
                        // Usa a localização do usuário como referência
                        distance: calculateDistance(latitude, longitude, ponto.latitude, ponto.longitude)
                    }))
                    .sort((a, b) => a.distance - b.distance); // Ordena: mais próximo primeiro

                $loadingSpinner.style.display = 'none';
                displayResults(filteredPoints);
            },
            (error) => {
                console.error("Erro na geolocalização:", error);
                alert('Permissão de localização negada ou erro ao obter a posição. Tente uma busca por Bairro/CEP.');
                $geolocationMessage.textContent = 'Erro ao obter localização. Tente novamente.';
                $loadingSpinner.style.display = 'none';
                displayResults([]);
            }
        );
    }
}

/**
 * Cria e exibe o conteúdo do modal de detalhes de um ponto.
 * @param {object} ponto Objeto do ponto de coleta.
 */
function openDetailsModal(ponto) {
    const status = formatCaixaStatus(ponto.caixaColetora);

    // HTML do Modal Body
    $modalBody.innerHTML = `
        <h2 class="h2">${ponto.nome}</h2>
        <div class="detail-image-container">
            <img src="${ponto.imagem}" alt="Vista do ponto de coleta: ${ponto.nome}" class="detail-image">
        </div>

        <p class="body1">${ponto.descricao}</p>
        
        <table class="detail-table body2">
            <tr>
                <td>Endereço Completo</td>
                <td>${ponto.endereco} - ${ponto.bairro}, CEP ${ponto.cep}</td>
            </tr>
            <tr>
                <td>Tipo de Instituição</td>
                <td>${ponto.tipoInstituicao}</td>
            </tr>
            <tr>
                <td>Horários de Funcionamento</td>
                <td>${ponto.horarios}</td>
            </tr>
            <tr>
                <td>Caixa Coletora</td>
                <td class="${status.className}">${status.text}</td>
            </tr>
        </table>
        
        <h3 style="margin-top: 1rem;">Resíduos Aceitos:</h3>
        <ul class="residuos-list">
            ${ponto.tiposResiduos.map(r => `<li>${r}</li>`).join('')}
        </ul>
        
        <div id="modal-map" aria-label="Mapa da localização do ponto de coleta"></div>
    `;
    
    // Exibe o modal
    $modal.classList.add('is-visible');
    $modal.setAttribute('aria-hidden', 'false');

    // Inicializa o mapa APÓS o modal ser visível (para garantir que o container #modal-map tenha tamanho)
    // Pequeno delay para garantir o repaint
    setTimeout(() => {
        initMap('modal-map', ponto.latitude, ponto.longitude);
        setDetailMarker(ponto.latitude, ponto.longitude);
    }, 100);
}

/**
 * Fecha o modal de detalhes.
 */
function closeDetailsModal() {
    $modal.classList.remove('is-visible');
    $modal.setAttribute('aria-hidden', 'true');
    clearMap(); // Limpa a instância do mapa
}

/**
 * Inicializa os Event Listeners.
 */
function initEventListeners() {
    // Menu Hambúrguer
    $menuToggle.addEventListener('click', () => {
        $navMenu.classList.toggle('active');
    });

    // Alterna entre inputs de busca
    $searchType.addEventListener('change', (e) => {
        const type = e.target.value;
        if (type === 'geolocation') {
            $textSearchContainer.style.display = 'none';
            $geolocationMessage.style.display = 'block';
            $searchButton.textContent = 'Buscar Localização';
            $searchInput.value = '';
        } else {
            $textSearchContainer.style.display = 'flex';
            $geolocationMessage.style.display = 'none';
            $searchButton.textContent = 'Buscar';
            $searchInput.placeholder = type === 'bairro' ? 'Digite o Bairro...' : 'Digite o CEP...';
        }
    });

    // Gatilho da busca
    $searchButton.addEventListener('click', handleSearch);
    $searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && $searchType.value !== 'geolocation') {
            handleSearch();
        }
    });

    // Fechar modal
    $closeModal.addEventListener('click', closeDetailsModal);
    $modal.addEventListener('click', (e) => {
        if (e.target === $modal) {
            closeDetailsModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $modal.classList.contains('is-visible')) {
            closeDetailsModal();
        }
    });
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadPoints();
});
