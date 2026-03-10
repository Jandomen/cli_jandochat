# 🛰️ JANDOCHAT CLI - Jandosoft

> **Social Terminal Environment** | *Connecting the Unconnected*
> **Repository:** [github.com/Jandomen/cli_jandochat](https://github.com/Jandomen/cli_jandochat.git)

Este es el cliente oficial de terminal para la red social JANDOCHAT. Diseñado para usuarios avanzados que prefieren la velocidad y potencia de la consola.

## 🚀 Instalación Automática (One-Command)

Si acabas de clonar el repositorio, simplemente ejecuta:

```bash
npm run setup
```

Esto instalará todas las dependencias y registrará el comando `jandochat` globalmente en tu sistema.

## 🛠️ Uso Manual

Si prefieres no instalarlo globalmente:

1. Instala las dependencias: `npm install`
2. Arranca la app: `node index.js` o `npm start`

### Comandos una vez instalada:

Simplemente escribe en cualquier terminal:

```bash
jandochat
```

## 💎 Características Premium

- **Real-Time Engine:** Chat instantáneo vía WebSockets con soporte para edición y eliminación de mensajes.
- **Global Feed Interactivo:** Explora el muro, ve detalles de posts, reacciona y comenta desde una interfaz navegable.
- **Centro de Notificaciones Inteligente:** Abre chats o publicaciones directamente desde tus alertas.
- **Jandosoft Encryption:** Conexiones seguras y encriptadas con banner de administración visual.
- **Gestión de Perfil:** Edita tu nombre, bio, ubicación y sitio web.
- **Multimedia Links:** Visualización de enlaces directos a imágenes y videos en el chat.
- **Búsqueda de Usuarios:** Encuentra amigos en la plataforma.

## 🎨 Banner de JANDOCHAT

```
   ____                                    ____   _   _      _              
  / ___| _   _ _ __   __ _  ___  ___  _ __ |  _ \| | | |    (_)_ __   __ _ 
  \___ \| | | | '_ \ / _` |/ _ \/ _ \| '_ \| |_) | |_| |____| | '_ \ / _` |
   ___) | |_| | | | | (_| |  __/ (_) | | | |  __/|  _  | |____| | | | | (_| |
  |____/ \__,_|_| |_|\__, |\___|\___/|_| |_|_|   |_| |_|      |_|_| |_|\__, |
                      |___/                                          |___/       
```

## ⚡ Sistema de Administración

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║          ⚡  SISTEMA DE ADMINISTRACIÓN TERMINAL v2.1  ⚡           ║
║    [ Servidor: Connected • Protocol: Encrypted • Status: Ready ]    ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝

 🛰️ PUERTA DE ENLACE JANDOSOFT
```

## 💬 Comandos de Chat

Dentro de una conversación, puedes usar los siguientes comandos:

- `salir`: Vuelve al menú anterior.
- `/edit <N> <texto>`: Edita el mensaje número **N** con el nuevo contenido.
- `/del <N>`: Elimina el mensaje número **N**.

Los mensajes muestran un índice `[N]` a la izquierda para facilitar estas acciones.

## 🌐 Servidor

El CLI se conecta a: **https://jandochat-backend.onrender.com**

## 📋 Requisitos

- Node.js v14 o superior
- npm o yarn

## 🛡️ Manejo de Errores

El CLI incluye manejo completo de errores:
- Errores de conexión al servidor
- Errores de autenticación
- Errores de red
- Validación de datos

## 📱 Menu Principal

Una vez logueado:
- 📰 **Ver Muro** - Feed interactivo con detalles y reacciones.
- ✏️  **Crear Publicación** - Nueva entrada en el muro.
- 👤 **Mi Perfil** - Ver tu perfil personal.
- ✏️  **Actualizar Perfil** - Editar información de cuenta.
- 🔍 **Buscar Usuarios** - Encontrar otros perfiles.
- 💬 **Mensajes** - Chat avanzado (Edición/Eliminación/Multimedia).
- 🔔 **Notificaciones** - Acceso rápido a eventos.
- 🚪 **Cerrar Sesión** - Salir de la cuenta.

---

© 2026 **Jandosoft** • *Digital Innovation Hub*
