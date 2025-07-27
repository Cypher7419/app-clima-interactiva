const fetch = require('node-fetch');

// Esta es la función que Vercel ejecutará en cada llamada a /api/weather
module.exports = async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error_message: 'Faltan los parámetros de latitud y longitud' });
    }

    const meteoblueApiKey = process.env.METEOBLUE_API_KEY;
    
    // ================================================================
    // CONSTANTE PARA GESTIONAR FÁCILMENTE EL PAQUETE DE METEOBLUE
    // Si necesitas cambiar a otro paquete, solo modifica esta línea.
    const METEOBLUE_PACKAGE = "trendpro-1h";
    // ================================================================

    const apiUrl = `https://my.meteoblue.com/packages/${METEOBLUE_PACKAGE}?lat=${lat}&lon=${lon}&apikey=${meteoblueApiKey}`;

    try {
        const meteoblueResponse = await fetch(apiUrl);
        const data = await meteoblueResponse.json();

        if (data.error_message) {
            console.error('Error lógico recibido de Meteoblue:', data);
            return res.status(400).json(data);
        }
        
        res.status(200).json(data);

    } catch (error) {
        console.error('Error crítico en la función de la API:', error);
        res.status(500).json({ error_message: 'No se pudo contactar al servicio de Meteoblue' });
    }
};