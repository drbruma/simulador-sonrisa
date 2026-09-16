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
                    // Modelo oficial InstructPix2Pix (Edición de fotos por texto)
                    version: "30c1d0b916a6f8ef220d6db3f2c303865b101b5a967823ae452c1e458af42a26",
                    input: {
                        image: image,
                        prompt: "make the teeth perfectly straight, white, aligned, beautiful smile, high-end orthodontic result",
                        num_inference_steps: 30,
                        image_guidance_scale: 1.5,
                        guidance_scale: 7.5
                    }
                })
            });

            const prediction = await startResponse.json();

            if (!startResponse.ok) {
                // Captura el detalle exacto del error 422 de Replicate
                const detail = prediction.detail ? JSON.stringify(prediction.detail) : (prediction.error || `HTTP ${startResponse.status}`);
                return res.status(500).json({ error: `Replicate Error: ${detail}` });
            }

            return res.status(200).json({ id: prediction.id });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
}
