export default async function handler(req, res) {
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado en Vercel.' });
    }

    // GET: Consultar el estado de la simulación por ID (Polling)
    if (req.method === 'GET') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Falta el ID de predicción' });

        try {
            const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            return res.status(200).json(data);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    // POST: Iniciar la simulación en Replicate
    if (req.method === 'POST') {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se recibió ninguna imagen' });

        try {
            const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    version: "89832385657753232fbafb15d5ed1ec15a96887713483984d72d24e1ae670f5e",
                    input: {
                        image: image,
                        prompt: "perfect straight white teeth, aligned dental arch, beautiful natural smile, high-end orthodontic outcome, hyperrealistic photorealism",
                        negative_prompt: "crooked teeth, yellow teeth, missing teeth, extra teeth, deformed lips, artificial look",
                        prompt_strength: 0.65
                    }
                })
            });

            const prediction = await startResponse.json();

            if (!startResponse.ok || prediction.error) {
                return res.status(500).json({ error: prediction.error || `Error en Replicate (HTTP ${startResponse.status})` });
            }

            // Retorna el ID de inmediato para no agotar el tiempo de espera de Vercel
            return res.status(200).json({ id: prediction.id });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
}
