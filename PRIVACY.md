# Política de privacidad — SuperFav for Twitch

**Última actualización:** 18 de julio de 2026

También disponible en: [https://superfavtwitch.onrender.com/privacy](https://superfavtwitch.onrender.com/privacy)

## 1. Quiénes somos

SuperFav for Twitch (“SuperFav”, “nosotros”) es una extensión de navegador y un sitio web asociados al proyecto open source [superfav-extension](https://github.com/zLeGnDz3r0/superfav-extension). El sitio de información se encuentra en [superfavtwitch.onrender.com](https://superfavtwitch.onrender.com/).

## 2. Finalidad del producto

SuperFav permite marcar canales de Twitch como favoritos (“SuperFavs”), ver cuáles están en directo y recibir notificaciones de escritorio cuando un favorito empieza a emitir o cambia el título del canal.

## 3. Datos que tratamos

**No pedimos cuenta, email ni datos personales de identificación.**

- **Lista de SuperFavs:** nombres de usuario (logins) públicos de canales de Twitch que tú marcas. Se guardan en el almacenamiento del navegador (`chrome.storage`).
- **Preferencias de avisos:** si quieres notificaciones de directo o de cambio de título (globales y por canal). También en el navegador.
- **Estado técnico local:** por ejemplo, qué canales estaban en directo o qué títulos se detectaron, solo para evitar avisos duplicados.
- **Peticiones al servidor proxy:** al consultar directos o títulos, la extensión envía a nuestro backend (`superfavtwitch.onrender.com`) únicamente los logins de canales que has marcado, para consultar la API pública de Twitch (Helix). No enviamos tu nombre, email ni historial de navegación.

En páginas de Twitch, la extensión solo lee la ruta de la URL del canal para mostrar el botón de diamante e inyectar la interfaz. No recopilamos el contenido de otras webs ni hacemos seguimiento de tu historial.

## 4. Qué no hacemos

- No vendemos datos de usuarios.
- No usamos datos para publicidad dirigida ni scoring crediticio.
- No incluimos analytics de terceros en la extensión.
- No ejecutamos código remoto: todo el JavaScript de la extensión va en el paquete.

## 5. Dónde se guardan los datos

Los SuperFavs y preferencias viven en tu perfil de Chrome (sincronizados con tu cuenta de Google solo si tienes sync de Chrome activado; eso lo gestiona Google, no nosotros). El backend puede procesar de forma temporal los logins de canal en cada petición a Twitch; no mantenemos perfiles de usuario ni cuentas.

## 6. Sitio web

El sitio de marketing puede usar el almacenamiento local del navegador solo para recordar el idioma elegido (ES / EN / FR). No usamos cookies de publicidad.

## 7. Tus derechos y control

Puedes borrar todos los datos de la extensión desinstalándola o borrando los datos del sitio/extensión desde la configuración de Chrome. También puedes quitar SuperFavs uno a uno con el botón de diamante en Twitch.

## 8. Contacto

Para preguntas sobre privacidad, abre un issue en el repositorio: [github.com/zLeGnDz3r0/superfav-extension](https://github.com/zLeGnDz3r0/superfav-extension).

## 9. Cambios

Si actualizamos esta política, cambiaremos la fecha de “Última actualización” en este documento. El uso continuado de la extensión tras un cambio relevante implica la aceptación de la versión publicada aquí.
