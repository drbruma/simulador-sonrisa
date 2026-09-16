export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { image } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        return res.status(500).json({ error: 'REPLICATE_API_TOKEN no configurado en Vercel' });
    }

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
        
        if (prediction.error) {
            return res.status(500).json({ error: prediction.error });
        }

        let result = prediction;
        while (result.status !== "succeeded" && result.status !== "failed") {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const checkResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            result = await checkResponse.json();
        }

        if (result.status === "failed") {
            return res.status(500).json({ error: "Fallo en el procesamiento de la IA" });
        }

        return res.status(200).json({ outputUrl: result.output[0] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
