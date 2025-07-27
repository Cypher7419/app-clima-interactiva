// Clave de API para Google Maps
const googleMapsApiKey = "AIzaSyBP2Jc-Gqy5Q6JTe0NCZcJlXJILl_GYMuI";

// --- Referencias a los elementos del DOM ---
const locationNameElement = document.getElementById('location-name');
const weatherIconElement = document.getElementById('weather-icon');
const weatherDescriptionElement = document.getElementById('weather-description');
const dateTimeElement = document.getElementById('date-time');
const temperatureElement = document.getElementById('temperature');
const dewPointElement = document.getElementById('dew-point');
const altitudeElement = document.getElementById('altitude');
const fogRiskElement = document.getElementById('fog-risk'); // <-- 1. AÑADIMOS LA REFERENCIA
const fetchWeatherBtn = document.getElementById('fetch-weather-btn');

let map, marker, currentLocation;

function initMap() { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(position => { const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude }; createMap(userLocation); updateLocationInfo(userLocation); }, () => { const defaultLocation = { lat: 40.416775, lng: -3.703790 }; createMap(defaultLocation); updateLocationInfo(defaultLocation); }); } else { const defaultLocation = { lat: 40.416775, lng: -3.703790 }; createMap(defaultLocation); updateLocationInfo(defaultLocation); } }
function createMap(location) { map = new google.maps.Map(document.getElementById('map'), { center: location, zoom: 12 }); marker = new google.maps.Marker({ position: location, map: map, draggable: true }); google.maps.event.addListener(marker, 'dragend', () => updateLocationInfo(marker.getPosition().toJSON())); google.maps.event.addListener(map, 'click', event => { marker.setPosition(event.latLng); updateLocationInfo(event.latLng.toJSON()); }); }
function updateLocationInfo(location) { currentLocation = location; clearWeatherData(); const geocoder = new google.maps.Geocoder(); geocoder.geocode({ 'location': location }, (results, status) => { if (status === 'OK') { locationNameElement.textContent = results[0] ? results[0].formatted_address : 'Ubicación no encontrada'; } else { locationNameElement.textContent = 'Buscando nombre...'; } }); }
function translatePictocode(code) {
    const iconUrlBase = "icons/";
    let description = "Condición desconocida";
    let iconFilename = "unknown.svg"; // <-- Valor de respaldo

    switch (code) {
        case 1: description = "Despejado"; iconFilename = "1.svg"; break;
        case 2: description = "Mayormente despejado"; iconFilename = "2.svg"; break;
        case 3: description = "Parcialmente nublado"; iconFilename = "3.svg"; break;
        case 4: description = "Nublado"; iconFilename = "4.svg"; break;
        case 5: description = "Neblina"; iconFilename = "5.svg"; break;
        case 6: case 9: description = "Lluvia ligera"; iconFilename = "9.svg"; break;
        case 7: case 10: description = "Lluvia"; iconFilename = "7.svg"; break;
        case 8: case 11: description = "Lluvia intensa"; iconFilename = "8.svg"; break;
        case 12: case 13: description = "Aguanieve"; iconFilename = "12.svg"; break;
        case 14: case 22: description = "Nieve ligera"; iconFilename = "14.svg"; break;
        case 15: case 23: description = "Nieve"; iconFilename = "14.svg"; break;
        case 16: description = "Tormenta con lluvia"; iconFilename = "16.svg"; break;
        case 17: description = "Tormenta con granizo"; iconFilename = "17.svg"; break;
        case 18: case 19: case 20: description = "Chubascos"; iconFilename = "18.svg"; break;
        case 21: description = "Chubasco ligero con sol"; iconFilename = "21.svg"; break;
        // Si el 'code' es 33 (o cualquier otro no listado), las variables description
        // y iconFilename mantendrán sus valores de respaldo.
    }

    return {
        description: description,
        // CORRECCIÓN CLAVE: Asegurarnos de usar siempre 'iconFilename'
        iconUrl: `${iconUrlBase}${iconFilename}`
    };
}


// ==============================================================================
// 2. FUNCIÓN DE CÁLCULO DEDICADA
// ==============================================================================
/**
 * Calcula el riesgo de niebla basándose en la temperatura y el punto de condensación.
 * @param {number} temperature - La temperatura en °C.
 * @param {number} dewPoint - El punto de condensación en °C.
 * @returns {string} - Devuelve "Sí", "No" o "Datos insuficientes".
 */
function calculateFogRisk(temperature, dewPoint) {
    // Primero, nos aseguramos de tener datos válidos para calcular.
    if (typeof temperature !== 'number' || typeof dewPoint !== 'number') {
        return "Datos insuficientes";
    }
    // --- ¡AQUÍ VA TU LÓGICA DE CÁLCULO! ---
    //
    // Como marcador de posición, usaremos una regla meteorológica común:
    // La niebla es muy probable cuando la diferencia (spread) entre la
    // temperatura y el punto de condensación es menor a 2.5°C.
    //
    // **CUANDO TENGAS TU FÓRMULA DEFINITIVA, REEMPLAZA ESTE BLOQUE 'IF'.**
    //
    const spread = temperature - dewPoint;
    const SPREAD_THRESHOLD = 2.5; // Umbral en °C

    if (spread >= 0 && spread <= SPREAD_THRESHOLD) {
        return "Sí";
    } else {
        return "No";
    }
}

/**
 * Llama al proxy para obtener los datos del clima y los muestra.
 */
function fetchWeatherData(lat, lon) {
	// ANTES:
	// const apiUrl = `http://localhost:3000/weather?lat=${lat}&lon=${lon}`;
	// AHORA:
	const apiUrl = `/api/weather?lat=${lat}&lon=${lon}`;

    fetchWeatherBtn.textContent = 'Obteniendo...';
    fetchWeatherBtn.disabled = true;

    fetch(apiUrl)
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
            if (!ok) throw new Error(data.error_message || 'Ocurrió un error desconocido.');

            if (data && data.trend_1h) {
                const latestData = data.trend_1h;
                const firstEntryIndex = 0;

                const time = latestData.time?.[firstEntryIndex];
                const temperature = latestData.temperature?.[firstEntryIndex];
                const dewpoint = latestData.dewpointtemperature?.[firstEntryIndex];
                const altitude = data.metadata?.height;
                const pictocode = latestData.pictocode?.[firstEntryIndex];

                if (time) {
                    const [datePart, timePart] = time.split(' ');
                    const [year, month, day] = datePart.split('-');
                    dateTimeElement.textContent = `${day}/${month}/${year} ${timePart}`;
                } else {
                    dateTimeElement.textContent = 'No disponible';
                }

                temperatureElement.textContent = (typeof temperature !== 'undefined') ? `${temperature} °C` : 'No disponible';
                dewPointElement.textContent = (typeof dewpoint !== 'undefined') ? `${dewpoint} °C` : 'No disponible';
                altitudeElement.textContent = (typeof altitude !== 'undefined') ? `${altitude} m` : 'No disponible';

                if (typeof pictocode !== 'undefined') {
                    const weatherInfo = translatePictocode(pictocode);
                    weatherDescriptionElement.textContent = weatherInfo.description;
                    weatherIconElement.src = weatherInfo.iconUrl;
                    weatherIconElement.style.display = 'inline-block';
                } else {
                    weatherDescriptionElement.textContent = '';
                    weatherIconElement.style.display = 'none';
                }

                // ==============================================================================
                // 3. LLAMAMOS A LA FUNCIÓN DE CÁLCULO Y MOSTRAMOS EL RESULTADO
                // ==============================================================================
                const fogRiskResult = calculateFogRisk(temperature, dewpoint);
                fogRiskElement.textContent = fogRiskResult;


            } else {
                throw new Error('La respuesta no contenía los datos del clima en el formato esperado (trend_1h).');
            }
        })
        .catch(error => {
            console.error('Error final al obtener datos del clima:', error);
            alert(`Error: ${error.message}`);
            clearWeatherData();
        })
        .finally(() => {
            fetchWeatherBtn.textContent = 'Obtener Datos del Clima';
            fetchWeatherBtn.disabled = false;
        });
}

function clearWeatherData() {
    weatherIconElement.style.display = 'none';
    weatherIconElement.src = '';
    weatherDescriptionElement.textContent = '--';
    dateTimeElement.textContent = '--';
    temperatureElement.textContent = '--';
    dewPointElement.textContent = '--';
    altitudeElement.textContent = '--';
    fogRiskElement.textContent = '--'; // <-- Limpiamos el nuevo campo    
}

fetchWeatherBtn.addEventListener('click', () => {
    if (currentLocation) {
        fetchWeatherData(currentLocation.lat, currentLocation.lng);
    } else {
        alert('Por favor, selecciona una ubicación en el mapa primero.');
    }
});