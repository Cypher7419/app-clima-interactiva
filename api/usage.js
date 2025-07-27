const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // --- MODO DEPURACIÓN INICIO ---
    console.log("Iniciando ejecución de /api/usage...");

    const VERCEL_TOKEN = process.env.VERCEL_AUTH_TOKEN;

    // La prueba más importante: ¿Está la variable de entorno realmente llegando a la función?
    console.log("Valor de process.env.VERCEL_AUTH_TOKEN:", VERCEL_TOKEN);
    if (!VERCEL_TOKEN) {
        console.error("ERROR CRÍTICO: La variable de entorno VERCEL_AUTH_TOKEN no fue encontrada.");
        // Devolvemos un error claro para saber que este fue el problema.
        return res.status(500).json({ error: "Configuración del servidor incompleta: VERCEL_AUTH_TOKEN falta." });
    }
    console.log("Token de Vercel encontrado. Procediendo a llamar a la API de Vercel.");
    // --- MODO DEPURACIÓN FIN ---

    const USAGE_API_URL = 'https://api.vercel.com/v2/usage';

    try {
        const usageResponse = await fetch(USAGE_API_URL, {
            headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`
            }
        });
        
        console.log(`Respuesta de la API de Vercel recibida con estado: ${usageResponse.status} ${usageResponse.statusText}`);

        if (!usageResponse.ok) {
            const errorBody = await usageResponse.text();
            console.error("Cuerpo del error de la API de Vercel:", errorBody);
            throw new Error(`Error al llamar a la API de Vercel: ${usageResponse.statusText}`);
        }
        
        const data = await usageResponse.json();
        console.log("Datos de uso recibidos y procesados correctamente.");

        const invocationsUsed = data.serverlessFunctionInvocations.count;
        const invocationsLimit = data.serverlessFunctionInvocations.limit;
        const bandwidthUsedGB = (data.bandwidth.total / 1024 / 1024 / 1024).toFixed(2);
        const bandwidthLimitGB = data.bandwidth.limit / 1024 / 1024 / 1024;
        
        const formattedData = {
            invocations: { used: invocationsUsed, limit: invocationsLimit, remaining: invocationsLimit - invocationsUsed },
            bandwidth: { used: `${bandwidthUsedGB} GB`, limit: `${bandwidthLimitGB} GB`, remaining: `${(bandwidthLimitGB - bandwidthUsedGB).toFixed(2)} GB` }
        };

        res.status(200).json(formattedData);

    } catch (error) {
        console.error("Error DETALLADO dentro del bloque try/catch de /api/usage:", error);
        res.status(500).json({ error: error.message });
    }
};