const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

app.get('/weather', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error_message: 'Faltan los parámetros de latitud y longitud' });
    }

    const meteoblueApiKey = "luFVoSZWqHd3Kxc7";
    
    // --- CAMBIO IMPORTANTE ---
    // Cambiamos 'basic-1h' por 'trend-1h' para que coincida con la nueva estructura de datos
    // que incluye 'dewpointtemperature'.
    const apiUrl = `https://my.meteoblue.com/packages/trendpro-1h?lat=${lat}&lon=${lon}&apikey=${meteoblueApiKey}`;

    try {
        const meteoblueResponse = await fetch(apiUrl);
        const data = await meteoblueResponse.json();

        if (data.error_message) {
            console.error('Error lógico recibido de Meteoblue:', data);
            return res.status(400).json(data);
        }
        
        res.status(200).json(data);

    } catch (error) {
        console.error('Error crítico en el proxy:', error);
        res.status(500).json({ error_message: 'No se pudo contactar o procesar la respuesta del servicio de Meteoblue' });
    }
});

app.listen(port, () => {
    console.log(`Servidor proxy escuchando en http://localhost:${port}`);
});