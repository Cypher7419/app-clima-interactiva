// ... (el código inicial, las referencias al DOM y las funciones initMap, createMap, updateLocationInfo y translatePictocode no cambian)
// ... (Pega aquí las versiones completas de esas funciones)
const googleMapsApiKey="AIzaSyBP2Jc-Gqy5Q6JTe0NCZcJlXJILl_GYMuI";
const locationNameElement=document.getElementById("location-name"),weatherIconElement=document.getElementById("weather-icon"),weatherDescriptionElement=document.getElementById("weather-description"),dateTimeElement=document.getElementById("date-time"),temperatureElement=document.getElementById("temperature"),dewPointElement=document.getElementById("dew-point"),altitudeElement=document.getElementById("altitude"),fogRiskElement=document.getElementById("fog-risk"),fetchWeatherBtn=document.getElementById("fetch-weather-btn");let map,marker,currentLocation;function initMap(){navigator.geolocation?navigator.geolocation.getCurrentPosition(e=>{const o={lat:e.coords.latitude,lng:e.coords.longitude};createMap(o),updateLocationInfo(o)},()=>{const e={lat:40.416775,lng:-3.70379};createMap(e),updateLocationInfo(e)}):(()=>{const e={lat:40.416775,lng:-3.70379};createMap(e),updateLocationInfo(e)})()}function createMap(e){map=new google.maps.Map(document.getElementById("map"),{center:e,zoom:12}),marker=new google.maps.Marker({position:e,map:map,draggable:!0}),google.maps.event.addListener(marker,"dragend",()=>updateLocationInfo(marker.getPosition().toJSON())),google.maps.event.addListener(map,"click",e=>{marker.setPosition(e.latLng),updateLocationInfo(e.latLng.toJSON())})}function updateLocationInfo(e){currentLocation=e,clearWeatherData();const o=new google.maps.Geocoder;o.geocode({location:e},(e,o)=>{e&&"OK"===o?locationNameElement.textContent=e[0]?e[0].formatted_address:"Ubicación no encontrada":locationNameElement.textContent="Buscando nombre..."})}function translatePictocode(e){const o="icons/";let t="Condición desconocida",n="unknown.svg";switch(e){case 1:t="Despejado",n="1.svg";break;case 2:t="Mayormente despejado",n="2.svg";break;case 3:t="Parcialmente nublado",n="3.svg";break;case 4:t="Nublado",n="4.svg";break;case 5:t="Neblina",n="5.svg";break;case 6:case 9:t="Lluvia ligera",n="9.svg";break;case 7:case 10:t="Lluvia",n="7.svg";break;case 8:case 11:t="Lluvia intensa",n="8.svg";break;case 12:case 13:t="Aguanieve",n="12.svg";break;case 14:case 22:t="Nieve ligera",n="14.svg";break;case 15:case 23:t="Nieve",n="14.svg";break;case 16:t="Tormenta con lluvia",n="16.svg";break;case 17:t="Tormenta con granizo",n="17.svg";break;case 18:case 19:case 20:t="Chubascos",n="18.svg";break;case 21:t="Chubasco ligero con sol",n="21.svg"}return{description:t,iconUrl:`${o}${n}`}}
function calculateFogRisk(e,o){if("number"!=typeof e||"number"!=typeof o)return"Datos insuficientes";const t=e-o;return t>=0&&t<=2.5?"Sí":"No"}

// ==============================================================================
// FUNCIÓN NUEVA: Encontrar el índice de la hora más cercana
// ==============================================================================
/**
 * Busca en el array de tiempos de la API el índice que mejor corresponde a la hora actual.
 * @param {string[]} timeArray - El array de strings de fecha/hora de la API.
 * @returns {number} - El índice del pronóstico más relevante.
 */
function findClosestTimeIndex(timeArray) {
    if (!timeArray || timeArray.length === 0) {
        return 0; // Fallback por si no hay datos de tiempo
    }

    const now = new Date();

    // Buscamos la primera fecha en el array que sea MAYOR O IGUAL a la fecha/hora actual
    const bestIndex = timeArray.findIndex(timeString => {
        // Convertimos el string de la API a un objeto Date de JavaScript para poder comparar
        const forecastDate = new Date(timeString.replace(' ', 'T'));
        return forecastDate >= now;
    });

    // Si findIndex no encuentra ninguna fecha futura (devuelve -1),
    // significa que estamos al final del pronóstico. Usamos el último dato disponible.
    // Si no, usamos el índice encontrado.
    return bestIndex === -1 ? timeArray.length - 1 : bestIndex;
}


/**
 * Llama al proxy para obtener los datos del clima y los muestra.
 * ¡FUNCIÓN ACTUALIZADA CON LA NUEVA LÓGICA DE HORA!
 */
function fetchWeatherData(lat, lon) {
    const apiUrl = `/api/weather?lat=${lat}&lon=${lon}`; // URL para Vercel
    fetchWeatherBtn.textContent = 'Obteniendo...';
    fetchWeatherBtn.disabled = true;

    fetch(apiUrl)
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
            if (!ok) throw new Error(data.error_message || 'Ocurrió un error desconocido.');

            if (data && data.trend_1h) {
                const latestData = data.trend_1h;
                
                // --- ¡AQUÍ ESTÁ EL CAMBIO MÁGICO! ---
                // Ya no usamos [0]. Usamos la función para encontrar el mejor índice.
                const relevantIndex = findClosestTimeIndex(latestData.time);

                // Obtenemos todos los datos usando el nuevo 'relevantIndex'
                const time = latestData.time?.[relevantIndex];
                const temperature = latestData.temperature?.[relevantIndex];
                const dewpoint = latestData.dewpointtemperature?.[relevantIndex];
                const altitude = data.metadata?.height;
                const pictocode = latestData.pictocode?.[relevantIndex];

                // El resto del código para mostrar los datos no cambia,
                // solo se beneficia de usar las variables correctas.
                if (time) {
                    const [datePart, timePart] = time.split(' ');
                    const [year, month, day] = datePart.split('-');
                    dateTimeElement.textContent = `${day}/${month}/${year} ${timePart}`;
                } else { dateTimeElement.textContent = 'No disponible'; }
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
            fetchWeatherBtn.textContent = 'Obtener Datos';
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
    fogRiskElement.textContent = '--';
}


fetchWeatherBtn.addEventListener('click', () => {
    if (currentLocation) {
        fetchWeatherData(currentLocation.lat, currentLocation.lng);
    } else {
        alert('Por favor, selecciona una ubicación en el mapa primero.');
    }
});