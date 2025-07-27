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
const fogRiskContainer = document.getElementById('fog-risk-container');
const fogRiskElement = document.getElementById('fog-risk');
const internalStatsElement = document.getElementById('internal-stats');
const fetchWeatherBtn = document.getElementById('fetch-weather-btn');

let map, marker, currentLocation;

/**
 * Función principal que se llama cuando la API de Google Maps ha cargado.
 */
function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
            createMap(userLocation);
            updateLocationInfo(userLocation);
        }, () => {
            const defaultLocation = { lat: 40.416775, lng: -3.703790 };
            createMap(defaultLocation);
            updateLocationInfo(defaultLocation);
        });
    } else {
        const defaultLocation = { lat: 40.416775, lng: -3.703790 };
        createMap(defaultLocation);
        updateLocationInfo(defaultLocation);
    }
}

/**
 * Crea e inicializa el mapa de Google Maps y el marcador.
 */
function createMap(location) {
    map = new google.maps.Map(document.getElementById('map'), { center: location, zoom: 12 });
    marker = new google.maps.Marker({ position: location, map: map, draggable: true });
    google.maps.event.addListener(marker, 'dragend', () => updateLocationInfo(marker.getPosition().toJSON()));
    google.maps.event.addListener(map, 'click', event => {
        marker.setPosition(event.latLng);
        updateLocationInfo(event.latLng.toJSON());
    });
}

/**
 * Actualiza el nombre del lugar en la interfaz cada vez que se mueve el marcador.
 */
function updateLocationInfo(location) {
    currentLocation = location;
    clearWeatherData();
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'location': location }, (results, status) => {
        if (status === 'OK') {
            locationNameElement.textContent = results[0] ? results[0].formatted_address : 'Ubicación no encontrada';
        } else {
            locationNameElement.textContent = 'Buscando nombre...';
        }
    });
}

/**
 * Función auxiliar para traducir el pictocode a un icono y descripción.
 */
function translatePictocode(code) {
    const iconUrlBase = "icons/";
    let description = "Condición desconocida";
    let iconFilename = "unknown.svg";

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
    }

    return {
        description: description,
        iconUrl: `${iconUrlBase}${iconFilename}`
    };
}

/**
 * Calcula el riesgo de niebla basándose en la temperatura y el punto de condensación.
 */
function calculateFogRisk(temperature, dewPoint) {
    if (typeof temperature !== 'number' || typeof dewPoint !== 'number') {
        return "Datos insuficientes";
    }
    const spread = temperature - dewPoint;
    const SPREAD_THRESHOLD = 2.5;

    if (spread >= 0 && spread <= SPREAD_THRESHOLD) {
        return "Sí";
    } else {
        return "No";
    }
}

/**
 * Busca en el array de tiempos de la API el índice que mejor corresponde a la hora actual.
 */
function findClosestTimeIndex(timeArray) {
    if (!timeArray || timeArray.length === 0) {
        return 0;
    }
    const now = new Date();
    const bestIndex = timeArray.findIndex(timeString => {
        const forecastDate = new Date(timeString.replace(' ', 'T'));
        return forecastDate >= now;
    });
    return bestIndex === -1 ? timeArray.length - 1 : bestIndex;
}

/**
 * Obtiene y muestra las estadísticas de uso de Vercel.
 */
async function fetchUsageStats() {
    try {
        const response = await fetch('/api/usage');
        if (!response.ok) return;

        const stats = await response.json();
        
        const invocationsText = `Ejecuciones: ${stats.invocations.used} / ${stats.invocations.limit}`;
        const bandwidthText = `Ancho de banda: ${stats.bandwidth.used} / ${stats.bandwidth.limit}`;

        internalStatsElement.textContent = `${invocationsText} | ${bandwidthText}`;
    } catch (error) {
        console.warn("No se pudieron cargar las estadísticas de uso:", error);
        internalStatsElement.textContent = "Estadísticas de uso no disponibles.";
    }
}

/**
 * Llama al proxy para obtener los datos del clima y los muestra en la interfaz.
 */
function fetchWeatherData(lat, lon) {
    const apiUrl = `/api/weather?lat=${lat}&lon=${lon}`;
    fetchWeatherBtn.textContent = 'Obteniendo...';
    fetchWeatherBtn.disabled = true;

    fetch(apiUrl)
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
            if (!ok) throw new Error(data.error_message || 'Ocurrió un error desconocido.');

            if (data && data.trend_1h) {
                const latestData = data.trend_1h;
                const relevantIndex = findClosestTimeIndex(latestData.time);

                const time = latestData.time?.[relevantIndex];
                const temperature = latestData.temperature?.[relevantIndex];
                const dewpoint = latestData.dewpointtemperature?.[relevantIndex];
                const altitude = data.metadata?.height;
                const pictocode = latestData.pictocode?.[relevantIndex];

                // Actualizar icono y descripción del clima
                if (typeof pictocode !== 'undefined') {
                    const weatherInfo = translatePictocode(pictocode);
                    weatherDescriptionElement.textContent = weatherInfo.description;
                    weatherIconElement.src = weatherInfo.iconUrl;
                    weatherIconElement.style.display = 'inline-block';
                } else {
                    weatherDescriptionElement.textContent = '';
                    weatherIconElement.style.display = 'none';
                }

                // Actualizar datos secundarios
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
                
                // Calcular y mostrar el dato principal (Riesgo de Niebla)
                const fogRiskResult = calculateFogRisk(temperature, dewpoint);
                fogRiskElement.textContent = fogRiskResult;
                
                fogRiskContainer.classList.remove('risk-yes', 'risk-no');
                if (fogRiskResult === 'Sí') {
                    fogRiskContainer.classList.add('risk-yes');
                } else if (fogRiskResult === 'No') {
                    fogRiskContainer.classList.add('risk-no');
                }
                
                // Actualizar las estadísticas de uso al final
                fetchUsageStats();
                
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

/**
 * Limpia todos los campos de datos en la interfaz.
 */
function clearWeatherData() {
    weatherIconElement.style.display = 'none';
    weatherIconElement.src = '';
    weatherDescriptionElement.textContent = '--';
    dateTimeElement.textContent = '--';
    temperatureElement.textContent = '--';
    dewPointElement.textContent = '--';
    altitudeElement.textContent = '--';
    fogRiskContainer.classList.remove('risk-yes', 'risk-no');
    fogRiskElement.textContent = '--';
    internalStatsElement.textContent = ''; // Limpiar también las estadísticas
}

/**
 *  Event Listener para el botón principal
 */
fetchWeatherBtn.addEventListener('click', () => {
    if (currentLocation) {
        fetchWeatherData(currentLocation.lat, currentLocation.lng);
    } else {
        alert('Por favor, selecciona una ubicación en el mapa primero.');
    }
});

/**
 * Cargar estadísticas al iniciar la app por primera vez (opcional pero recomendable)
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchUsageStats();
});