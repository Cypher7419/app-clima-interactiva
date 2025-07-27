// Requerimos node-fetch para hacer la llamada a la API externa
const fetch = require('node-fetch');

// Esta es la función que Vercel ejecutará en cada llamada a /api/weather
module.exports = async (req, res) => {
    // Obtenemos latitud y longitud de los parámetros de la URL (?lat=...&lon=...)
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        // Si faltan parámetros, devolvemos un error
        return res.status(400).json({ error_message: 'Faltan los parámetros de latitud y longitud' });
    }

    // Leemos la API key secreta desde las Variables de Entorno de Vercel
    const meteoblueApiKey = process.env.METEOBLUE_API_KEY;
    const apiUrl = `https://my.meteoblue.com/packages/trend-1h?lat=${lat}&lon=${lon}&apikey=${meteoblueApiKey}`;

    try {
        const meteoblueResponse = await fetch(apiUrl);
        const data = await meteoblueResponse.json();

        if (data.error_message) {
            console.error('Error lógico recibido de Meteoblue:', data);
            return res.status(400).json(data);
        }
        
        // Si todo sale bien, enviamos los datos con un status 200 OK
        res.status(200).json(data);

    } catch (error) {
        console.error('Error crítico en la función de la API:', error);
        res.status(500).json({ error_message: 'No se pudo contactar al servicio de Meteoblue' });
    }
};