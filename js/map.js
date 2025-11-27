/**
 * js/map.js
 * Funções de inicialização e manipulação do mapa (Leaflet/OpenStreetMap).
 */

// Importa funções úteis, se necessário
// import { calculateDistance } from './utils.js'; 

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

let mapInstance = null;
let currentMarker = null;

/**
 * Inicializa o mapa Leaflet em um container específico com uma localização central.
 * @param {string} containerId ID do elemento HTML onde o mapa será renderizado.
 * @param {number} lat Latitude central.
 * @param {number} lon Longitude central.
 * @param {number} zoom Nível de zoom inicial.
 * @returns {object} Instância do mapa Leaflet.
 */
export function initMap(containerId, lat, lon, zoom = 14) {
    // Se a instância já existe (ex: no modal), a remove para evitar conflitos
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Inicializa o mapa
    mapInstance = L.map(containerId, {
        zoomControl: true, // Garante que os controles de zoom estejam ativados
    }).setView([lat, lon], zoom);

    // Adiciona as tiles do OpenStreetMap
    L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution: ATTRIBUTION
    }).addTo(mapInstance);
    
    return mapInstance;
}

/**
 * Adiciona um marcador no mapa.
 * @param {object} map A instância do mapa Leaflet.
 * @param {number} lat Latitude do marcador.
 * @param {number} lon Longitude do marcador.
 * @param {string} iconUrl URL da imagem do ícone.
 * @param {function} onClick Função a ser executada ao clicar no marcador.
 * @returns {object} A instância do marcador Leaflet.
 */
export function addMarker(map, lat, lon, iconUrl, onClick = null) {
    const icon = L.icon({
        iconUrl: iconUrl,
        iconSize: [38, 38],   // Tamanho do ícone
        iconAnchor: [19, 38], // Ponto que representa a lat/lon
        popupAnchor: [0, -38]
    });

    const marker = L.marker([lat, lon], { icon: icon }).addTo(map);

    if (onClick) {
        marker.on('click', onClick);
    }
    
    return marker;
}

/**
 * Define um único marcador (para o modal de detalhes).
 * @param {number} lat Latitude.
 * @param {number} lon Longitude.
 * @param {string} iconUrl URL da imagem do ícone (ex: 'assets/images/marker-p500.png').
 */
export function setDetailMarker(lat, lon, iconUrl = 'assets/images/marker-p500.png') {
    if (!mapInstance) return;

    // Remove o marcador anterior, se houver
    if (currentMarker) {
        mapInstance.removeLayer(currentMarker);
    }

    // Adiciona o novo marcador
    currentMarker = addMarker(mapInstance, lat, lon, iconUrl);
    
    // Centraliza e ajusta o zoom
    mapInstance.setView([lat, lon], 16);
}

/**
 * Limpa todos os marcadores e a instância do mapa (usado ao fechar o modal).
 */
export function clearMap() {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
        currentMarker = null;
    }
}
