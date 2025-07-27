const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // Leemos el token secreto desde las variables de entorno que configuramos.
    const VERCEL_TOKEN = process.env.VERCEL_AUTH_TOKEN;

    // Si el token no está configurado, devolvemos un error.
    if (!VERCEL_TOKEN) {
        return res.status(500).json({ error: "El token de Vercel no está configurado en el servidor." });
    }
    
    // Esta es la URL de la API de Vercel para obtener el uso de la cuenta.
    const USAGE_API_URL = 'https://api.vercel.com/v2/usage';

    try {
        // Hacemos la llamada a la API de Vercel, pasando el token en la cabecera.
        const usageResponse = await fetch(USAGE_API_URL, {
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`
            }
        });

        if (!usageResponse.ok) {
            throw new Error(`Error al llamar a la API de Vercel: ${usageResponse.statusText}`);
        }
        
        const data = await usageResponse.json();

        // Extraemos los datos que nos interesan del JSON de Vercel.
        // Los límites están definidos en los datos que devuelve.
        const invocationsUsed = data.serverlessFunctionInvocations.count;
        const invocationsLimit = data.serverlessFunctionInvocations.limit;
        const bandwidthUsedGB = (data.bandwidth.total / 1024 / 1024 / 1024).toFixed(2); // Convertir bytes a GB con 2 decimales
        const bandwidthLimitGB = data.bandwidth.limit / 1024 / 1024 / 1024;
        
        // Creamos una respuesta limpia para nuestro frontend.
        const formattedData = {
            invocations: {
                used: invocationsUsed,
                limit: invocationsLimit,
                remaining: invocationsLimit - invocationsUsed
            },
            bandwidth: {
                used: `${bandwidthUsedGB} GB`,
                limit: `${bandwidthLimitGB} GB`,
                remaining: `${(bandwidthLimitGB - bandwidthUsedGB).toFixed(2)} GB`
            }
        };

        // Enviamos los datos procesados al frontend.
        res.status(200).json(formattedData);

    } catch (error) {
        console.error("Error en /api/usage:", error);
        res.status(500).json({ error: error.message });
    }
};