<p align="center">
  <img src="docs/icon128.png" alt="SuperFav for Twitch" width="96" height="96" />
</p>

<h1 align="center">💎 SuperFav for Twitch</h1>

<p align="center">
  <strong>Tus streamers favoritos, siempre a un clic.</strong><br/>
  Marca canales, mira quién está en directo y recibe avisos en el escritorio — sin tener Twitch abierto.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-MV3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome MV3" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Gratis-100%25-success?style=for-the-badge" alt="Gratis" />
</p>

<p align="center">
  🌐 <a href="https://superfavtwitch.onrender.com/">Web oficial</a>
</p>

---

## ✨ ¿Qué es SuperFav?

**SuperFav** es una extensión gratuita para **Chrome** (y otros navegadores Chromium) que te permite marcar streamers de Twitch con un **botón de diamante** 💎 y enterarte al instante cuando entran en directo.

Olvídate de revisar manualmente cada canal: el **badge rojo** 🔴, el **popup** con la lista de directos y las **notificaciones de escritorio** 🖥️ hacen el trabajo por ti.

> 🔒 **Privado por diseño:** tus favoritos se guardan en *tu* navegador. No hay cuenta, no hay registro, no compartimos tu lista con nadie.

---

## 📸 Capturas

### Popup con directos y controles

Lista ordenada por espectadores, miniaturas, categoría y toggles para activar avisos.

<p align="center">
  <img src="docs/capture-popup.png" alt="Popup de SuperFav con lista de directos y toggles" width="720" />
</p>

### 🔔 Aviso de directo en el escritorio

Notificación del sistema cuando un SuperFav se conecta — aunque no tengas Twitch abierto.

<p align="center">
  <img src="docs/capture-notif-live.png" alt="Notificación de escritorio: streamer en directo" width="720" />
</p>

### 📝 Aviso de cambio de título

Te avisa si un streamer actualiza el título antes o durante el directo.

<p align="center">
  <img src="docs/capture-notif-title.png" alt="Notificación de escritorio: cambio de título" width="720" />
</p>

---

## 🚀 Funcionalidades

| | Feature | Descripción |
|---|---------|-------------|
| 💎 | **Un clic para marcar** | Pulsa el diamante en cualquier canal de Twitch para añadirlo a tus SuperFavs. |
| 🔴 | **Badge de directos** | Contador rojo en el icono: cuántos SuperFavs están en directo. Se actualiza **cada minuto**. |
| 🖥️ | **Avisos en el escritorio** | Notificación del sistema cuando un favorito empieza a emitir. Dura ~3 min y puedes cerrarla. |
| 📋 | **Cambio de título** | Detecta cuando un streamer cambia el título — ideal para saber cuándo va a empezar. |
| 📊 | **Popup al instante** | Quién emite, espectadores, categoría y miniatura en un solo vistazo. |
| 🌓 | **Tema claro y oscuro** | El botón del diamante se adapta al tema de Twitch. |
| ⚙️ | **Controles en el popup** | Activa o desactiva avisos de directo y de cambio de título con toggles. |
| 🔐 | **Local y seguro** | Favoritos en `chrome.storage` de tu perfil. Sin datos personales en servidores propios. |

---

## 🛠️ Instalación (modo desarrollador)

### Opción A — Desde el código fuente

```bash
git clone https://github.com/TU_USUARIO/superfav-extension.git
cd superfav-extension
npm install
npm run build
```

1. Abre `chrome://extensions`
2. Activa **Modo desarrollador**
3. **Cargar descomprimida** → selecciona la carpeta `dist/`

### Opción B — Desde un Release

1. Ve a **Releases** y descarga el ZIP
2. Descomprímelo
3. En `chrome://extensions` → **Cargar descomprimida** → carpeta descomprimida

> 🏪 **Próximamente en Chrome Web Store** — instalación en un clic para todos.

---

## 🧭 Cómo usarla

1. **Instala** la extensión en Chrome, Edge o Brave
2. **Visita** un canal de Twitch y pulsa el **diamante** 💎 en la barra del canal
3. **Consulta** el badge 🔴, abre el **popup** o deja activos los **avisos de escritorio**
4. **Ajusta** los toggles en el popup según prefieras recibir avisos de directo o de cambio de título

---

## 🏗️ Arquitectura (para curiosos)

```
Twitch (content script)  ──►  chrome.storage.sync  (tus SuperFavs, solo local)
                                    │
Popup / background  ──fetch──►  API pública  ──►  Twitch Helix
                                (sin secretos
                                 en la extensión)
```

La extensión **no incluye claves de Twitch**. Consulta directos y títulos a través de un proxy backend; tus favoritos **nunca salen de tu navegador** salvo los nombres de canal que envías en cada petición para saber quién está en directo.

---

## 🌍 Compatibilidad

✅ Google Chrome · ✅ Microsoft Edge · ✅ Brave · ✅ Otros Chromium

---

## 📄 Licencia

Proyecto personal / uso comunitario. Consulta con el autor antes de redistribuir modificaciones.

---

<p align="center">
  Hecho con 💜 para la comunidad de Twitch<br/>
  <sub>© 2026 SuperFav for Twitch</sub>
</p>
