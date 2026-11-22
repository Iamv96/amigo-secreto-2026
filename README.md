# 🎄 Amigo Secreto - Navidad 2026

Sitio web full-stack para el Amigo Secreto familiar de Navidad 2026, con catálogo de opciones de regalos para cada participante, extracción automática de fotos de productos (Falabella, Mercado Libre, Paris, Ripley, IKEA, Cruz Verde, etc.) y panel de administración protegido.

---

## 👥 Participantes (11)
1. **Pamela**
2. **Cote**
3. **Joaquín**
4. **Nacho**
5. **Coni**
6. **Ale**
7. **Carla**
8. **Mindy**
9. **Mauri**
10. **Tonka**
11. **Monse**

---

## 🚀 Características
- **Público y Responsivo**: Optimizado para teléfonos móviles (WhatsApp, iOS, Android) y pantallas de escritorio.
- **Estética Navideña "Liquid Glass"**: Interfaz sofisticada con desenfoque de cristal traslúcido, temática festiva esmeralda y nieve flotante interactiva.
- **Extracción Automática de Imágenes & Precios**: Al pegar el link de la tienda, el backend de Node.js analiza automáticamente el producto (usando las heurísticas avanzadas del proyecto WealthPulse) para traer la foto oficial en alta resolución, el título y el precio aproximado en CLP.
- **Panel de Administración**: Solo el administrador puede agregar, editar o eliminar opciones mediante una contraseña secreta.
- **Render Free PostgreSQL + Respaldo Automático**:
  - Conectado a la base de datos PostgreSQL en Render.
  - Genera y actualiza automáticamente un archivo de respaldo `data/backup_gifts.json` con cada cambio, evitando cualquier pérdida de datos si la base de datos gratuita de Render expira a los 30 días.
  - Permite descargar el JSON completo con un solo clic desde el pie de página.

---

## 💻 Desarrollo Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear archivo `.env` (puedes copiar de `.env.example`):
   ```env
   PORT=3000
   NODE_ENV=development
   ADMIN_PASSWORD=navidad2026
   ```
3. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ☁️ Despliegue en Render

El repositorio incluye el archivo `render.yaml`.
1. Sube este proyecto a tu GitHub en un repositorio (ej. `amigo-secreto-2026`).
2. En Render, dentro del workspace **"Amigo Secreto"**, crea un nuevo **Blueprint** o conecta el repositorio como **Web Service**.
3. Configura la variable de entorno `ADMIN_PASSWORD` con tu clave secreta de administración.
