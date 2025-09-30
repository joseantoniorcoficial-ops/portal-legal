// --- CONFIGURACIÓN DE NOTION ---
// Las claves ahora se leerán de las "Variables de Entorno" de Vercel.
// process.env.NOMBRE_DE_LA_VARIABLE es la forma de acceder a ellas.
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

// --- LISTA DE USUARIOS ---
// Esta lista también podría venir de una base de datos o de las variables de entorno.
const mockUsers = [
    { id: 'u-5', name: 'Mtro. José Antonio Ruiz de la Cruz', notionId: 'REPLACE_WITH_REAL_NOTION_USER_ID' },
    { id: 'u-6', name: 'Lic. Sandra Luz Miguel Carrasco', notionId: 'REPLACE_WITH_REAL_NOTION_USER_ID' },
    { id: 'u-7', name: 'Lic. Isabel Gómez Cruz', notionId: 'REPLACE_WITH_REAL_NOTION_USER_ID' },
];

// --- FUNCIÓN DEL SERVIDOR (HANDLER) ---
// Este es el código que se ejecuta en el backend. Recibe la solicitud del frontend,
// la procesa y llama a Notion de forma segura.
export default async function handler(req, res) {
    // 1. Solo aceptar solicitudes POST
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        const data = req.body;

        // 2. Mapear los IDs del formulario a los IDs de usuario de Notion
        const getNotionUserIds = (selectedIds) => {
            return (selectedIds || [])
                .map(id => mockUsers.find(u => u.id === id)?.notionId)
                .filter(notionId => notionId && notionId !== 'REPLACE_WITH_REAL_NOTION_USER_ID')
                .map(notionId => ({ id: notionId }));
        };

        const remitentePeople = getNotionUserIds(data.remitente);
        const destinatarioPeople = getNotionUserIds(data.destinatario);

        // 3. Construir el payload para la API de Notion
        const payload = {
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
                'Titulo': { title: [{ text: { content: data.titulo } }] },
                'Descripción': { rich_text: [{ text: { content: data.descripcion } }] },
                'Fecha de Registro': {
                    date: {
                        start: data.fechaRegistro,
                        end: data.fechaModo === 'range' && data.fechaRegistroEnd ? data.fechaRegistroEnd : null
                    }
                },
                'Remitente': { people: remitentePeople },
                'Destinatario': { people: destinatarioPeople },
            }
        };

        // 4. Llamar a la API de Notion desde el servidor
        const API_URL = 'https://api.notion.com/v1/pages';
        const notionResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_API_KEY}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
            },
            body: JSON.stringify(payload),
        });

        const notionData = await notionResponse.json();

        if (!notionResponse.ok) {
            console.error('Error de Notion:', notionData);
            throw new Error(notionData.message || 'Error al enviar a Notion.');
        }

        // 5. Enviar una respuesta exitosa al frontend
        res.status(200).json({
            id: notionData.id,
            last_edited_by: { name: "API" },
            last_edited_time: notionData.last_edited_time,
            url: notionData.url,
        });

    } catch (error) {
        console.error("Error en el handler de la API:", error);
        res.status(500).json({ message: `Error del servidor: ${error.message}` });
    }
}

