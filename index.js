#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
const axios = require('axios');
const ora = require('ora');
const { io } = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');

const API_URL = 'https://jandochat-backend.onrender.com/api';
const SOCKET_URL = 'https://jandochat-backend.onrender.com';

const configPath = path.join(os.homedir(), '.jandochat_cli.json');

function saveSession() {
  try {
    if (token && user) {
      fs.writeFileSync(configPath, JSON.stringify({ token, user }));
    }
  } catch (e) { }
}

function loadSession() {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      token = data.token;
      user = data.user;
    }
  } catch (e) { }
}

function clearSession() {
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  } catch (e) { }
}

let socket = null;
let token = null;
let user = null;

const BANNER = `
${chalk.cyan('       _   _    _   _ ____   ___   ____ _   _    _  _____ ')}
${chalk.cyan('      | | / \\  | \\ | |  _ \\ / _ \\ / ___| | | |  / \\|_   _|')}
${chalk.cyan('   _  | |/ _ \\ |  \\| | | | | | | | |   | |_| | / _ \\ | |  ')}
${chalk.cyan('  | |_| / ___ \\| |\\  | |_| | |_| | |___|  _  |/ ___ \\| |  ')}
${chalk.cyan('   \\___/_/   \\_\\_| \\_|____/ \\___/ \\____|_| |_/_/   \\_\\_|  ')}
`;

const BANNER_ADMIN = `
${chalk.cyan('╔════════════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                                                                    ${chalk.cyan('║')}
${chalk.cyan('║')}          ${chalk.bold.yellow('⚡')}  ${chalk.bold.white('SISTEMA DE ADMINISTRACIÓN TERMINAL v2.1')}  ${chalk.bold.yellow('⚡')}           ${chalk.cyan('║')}
${chalk.cyan('║')}    ${chalk.gray('[ Servidor: ')}${chalk.green('Connected')}${chalk.gray(' • Protocol: ')}${chalk.magenta('Encrypted')}${chalk.gray(' • Status: ')}${chalk.blue('Ready')}${chalk.gray(' ]')}    ${chalk.cyan('║')}
${chalk.cyan('║')}                                                                    ${chalk.cyan('║')}
${chalk.cyan('╚════════════════════════════════════════════════════════════════════╝')}
`;

const GATEWAY = `
${chalk.cyan(' 🛰️  PUERTA DE ENLACE JANDOSOFT')}
`;

function showBanner() {
  console.clear();
  console.log(BANNER);
  console.log(BANNER_ADMIN);
  console.log(GATEWAY);
  console.log();
}

function showError(msg) {
  console.log(chalk.red(`\n❌ Error: ${msg}\n`));
}

function showSuccess(msg) {
  console.log(chalk.green(`\n✅ ${msg}\n`));
}

async function apiRequest(method, endpoint, data = {}, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
    }

    if (method.toLowerCase() === 'get') {
      config.params = data;
    } else {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.msg || error.response.data?.mensaje || error.response.data?.message || 'Error del servidor');
    } else if (error.request) {
      throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
    } else {
      throw new Error(error.message || 'Error desconocido');
    }
  }
}

function connectSocket() {
  return new Promise((resolve) => {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      if (user) {
        socket.emit('join-user', user._id);
      }
      resolve();
    });

    socket.on('connect_error', () => {
      console.log(chalk.yellow('⚠️  Error de conexión en tiempo real, continuando sin sockets...'));
      resolve();
    });

    socket.on('disconnect', () => {
      console.log(chalk.yellow('🔌 Desconectado del servidor de tiempo real'));
    });
  });
}

async function login() {
  console.log(chalk.cyan('\n📝 INICIO DE SESIÓN\n'));

  const { email, password } = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      validate: (val) => val.includes('@') || 'Ingresa un email válido'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Contraseña:',
      mask: '*',
      validate: (val) => val.length >= 8 || 'La contraseña debe tener al menos 8 caracteres'
    }
  ]);

  const spinner = ora('Iniciando sesión...').start();

  try {
    const data = await apiRequest('POST', '/auth/login', { email, password });
    token = data.token;
    user = data.user || data.usuario;
    saveSession();
    if (socket && user) {
      socket.emit('join-user', user._id);
    }
    spinner.succeed();
    showSuccess('Sesión iniciada correctamente');
    return true;
  } catch (error) {
    spinner.fail();
    showError(error.message);
    return false;
  }
}

async function register() {
  console.log(chalk.cyan('\n📝 REGISTRO DE USUARIO\n'));

  const { nombre, email, password } = await inquirer.prompt([
    {
      type: 'input',
      name: 'nombre',
      message: 'Nombre de usuario:',
      validate: (val) => val.length >= 3 || 'El nombre debe tener al menos 3 caracteres'
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email:',
      validate: (val) => val.includes('@') || 'Ingresa un email válido'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Contraseña:',
      mask: '*',
      validate: (val) => val.length >= 8 || 'La contraseña debe tener al menos 8 caracteres'
    }
  ]);

  const spinner = ora('Registrando usuario...').start();

  try {
    const data = await apiRequest('POST', '/auth/register', { nombre, email, password });
    token = data.token;
    user = data.user || data.usuario;
    saveSession();
    if (socket && user) {
      socket.emit('join-user', user._id);
    }
    spinner.succeed();
    showSuccess('Usuario registrado correctamente');
    return true;
  } catch (error) {
    spinner.fail();
    showError(error.message);
    return false;
  }
}

async function viewPost(postId) {
  const spinner = ora('Cargando detalles de la publicación...').start();
  try {
    const post = await apiRequest('GET', `/posts/${postId}`);
    spinner.succeed();

    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.bold.cyan(`👤 ${post.usuario?.nombre || 'Usuario'}`));
    console.log(chalk.white(`\n${post.contenido || 'Sin contenido'}`));

    if (post.media && post.media.length > 0) {
      console.log(chalk.blue('\n📎 Multimedia:'));
      post.media.forEach(m => console.log(chalk.blue(`   - ${m.url}`)));
    }

    console.log(chalk.gray('\n' + '─'.repeat(40)));
    console.log(chalk.yellow(`❤️ Reacciones: ${post.reacciones?.length || 0}  💬 Comentarios: ${post.comentarios?.length || 0}`));

    if (post.comentarios && post.comentarios.length > 0) {
      console.log(chalk.bold('\n💬 Comentarios recientes:'));
      post.comentarios.slice(-3).forEach(c => {
        console.log(chalk.gray(`   - ${chalk.white(c.usuario?.nombre || 'Alguien')}: ${c.texto}`));
      });
    }

    console.log(chalk.gray.italic(`\n📅 ${new Date(post.createdAt).toLocaleString('es-ES')}`));
    console.log(chalk.gray('═'.repeat(60)));

    const { accion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'accion',
        message: '¿Qué deseas hacer?',
        choices: [
          'Volver al Feed',
          '🔥 Reaccionar (Brutal, etc.)',
          '✍️ Escribir un comentario',
          '👤 Ver Perfil del Autor'
        ]
      }
    ]);

    if (accion === '🔥 Reaccionar (Brutal, etc.)') {
      const { tipo } = await inquirer.prompt([{
        type: 'list',
        name: 'tipo',
        message: 'Elige tu reacción:',
        choices: ["brutal", "acuerdo", "blown", "mirando", "inteligente", "apoyo", "colaboro", "respeto"]
      }]);

      const rpSpinner = ora('Procesando reacción...').start();
      try {
        await apiRequest('POST', `/posts/${postId}/reaccionar`, { tipo });
        rpSpinner.succeed('¡Reacción registrada!');
        return viewPost(postId); // Refresh view
      } catch (e) {
        rpSpinner.fail(e.message);
      }
    } else if (accion === '✍️ Escribir un comentario') {
      const { texto } = await inquirer.prompt([{
        type: 'input',
        name: 'texto',
        message: 'Escribe tu comentario:'
      }]);
      if (texto.trim()) {
        const cSpinner = ora('Enviando comentario...').start();
        try {
          await apiRequest('POST', `/posts/${postId}/comentar`, { texto });
          cSpinner.succeed('¡Comentario publicado!');
          return viewPost(postId); // Refresh view
        } catch (e) {
          cSpinner.fail(e.message);
        }
      }
    } else if (accion === '👤 Ver Perfil del Autor') {
      if (post.usuario?._id) {
        await showPublicProfile(post.usuario._id);
        return viewPost(postId);
      }
    }
  } catch (error) {
    spinner.fail();
    showError(error.message);
  }
}

async function showPublicProfile(userId) {
  const spinner = ora('Cargando perfil...').start();
  try {
    const profile = await apiRequest('GET', `/users/usuarios/${userId}`);
    spinner.succeed();
    console.log(chalk.cyan('\n' + '╔' + '═'.repeat(40) + '╗'));
    console.log(chalk.cyan('║') + chalk.bold.white(` PERFIL: ${profile.nombre.padEnd(30)} `) + chalk.cyan('║'));
    console.log(chalk.cyan('╠' + '═'.repeat(40) + '╣'));
    console.log(chalk.cyan('║') + chalk.gray(` Email: ${profile.email.padEnd(31)} `) + chalk.cyan('║'));
    if (profile.bio) console.log(chalk.cyan('║') + chalk.white(` Bio: ${profile.bio.substring(0, 34).padEnd(34)} `) + chalk.cyan('║'));
    console.log(chalk.cyan('║') + chalk.gray(` Seguidores: ${(profile.seguidores?.length || 0).toString().padEnd(25)} `) + chalk.cyan('║'));
    console.log(chalk.cyan('╚' + '═'.repeat(40) + '╝\n'));

    await inquirer.prompt([{ type: 'list', name: 'ok', message: 'Presiona Enter para continuar', choices: ['Cerrar'] }]);
  } catch (e) {
    spinner.fail(e.message);
  }
}

async function getFeed() {
  console.clear();
  console.log(BANNER);
  console.log(chalk.cyan('\n📰 MURO DE PUBLICACIONES\n'));

  const spinner = ora('Cargando publicaciones...').start();

  try {
    const postsObj = await apiRequest('GET', '/posts/feed');
    const posts = postsObj.posts || postsObj;
    spinner.succeed();

    if (!posts || posts.length === 0) {
      console.log(chalk.yellow('No hay publicaciones aún.\n'));
      return;
    }

    const postChoices = posts.map(p => ({
      name: `${chalk.bold(p.usuario?.nombre || 'Usuario')}: ${p.contenido?.substring(0, 50).replace(/\n/g, ' ')}${p.contenido?.length > 50 ? '...' : ''}`,
      value: p._id
    }));

    postChoices.unshift({ name: chalk.yellow('⬅️ Volver al Menú Principal'), value: 'back' });

    const { selectedPostId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPostId',
        message: 'Selecciona una publicación para ver detalles o reaccionar:',
        choices: postChoices,
        pageSize: 15
      }
    ]);

    if (selectedPostId === 'back') return;

    await viewPost(selectedPostId);
    await getFeed(); // Stay in feed after viewing

  } catch (error) {
    spinner.fail();
    showError(error.message);
  }
}

async function createPost() {
  console.log(chalk.cyan('\n✏️  NUEVA PUBLICACIÓN\n'));

  const { contenido } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'contenido',
      message: 'Escribe tu publicación:',
      default: ''
    }
  ]);

  if (!contenido || contenido.trim() === '') {
    showError('El contenido no puede estar vacío');
    return;
  }

  const spinner = ora('Publicando...').start();

  try {
    await apiRequest('POST', '/posts', { contenido: contenido.trim() });
    spinner.succeed();
    showSuccess('Publicación creada');
  } catch (error) {
    spinner.fail();
    showError(error.message);
  }
}
async function getProfile() {
  console.log(chalk.cyan('\n👤 PERFIL DE USUARIO\n'));

  const spinner = ora('Cargando perfil...').start();

  try {
    let profileReq = await apiRequest('GET', '/users/me').catch(async () => {
      return await apiRequest('GET', '/users/perfil');
    });

    const profile = profileReq.user || profileReq.usuario || profileReq;
    spinner.succeed();

    console.log(chalk.bold(`\n📛 Nombre: ${profile.nombre}`));
    console.log(chalk.gray(`📧 Email: ${profile.email}`));
    if (profile.bio) console.log(chalk.gray(`📝 Bio: ${profile.bio}`));
    if (profile.ubicacion) console.log(chalk.gray(`📍 Ubicación: ${profile.ubicacion}`));
    if (profile.sitioWeb) console.log(chalk.gray(`🔗 Web: ${profile.sitioWeb}`));
    console.log(chalk.gray(`👥 Seguidores: ${profile.seguidores?.length || 0}`));
    console.log(chalk.gray(`👤 Siguiendo: ${profile.siguiendo?.length || 0}`));
    if (profile.createdAt) {
      console.log(chalk.gray(`📅 Miembro desde: ${new Date(profile.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`));
    }
    console.log();

    const { accion } = await inquirer.prompt([{
      type: 'list',
      name: 'accion',
      message: '¿Qué deseas ver?',
      choices: [
        '👥 Ver Seguidores',
        '👤 Ver Siguiendo',
        '🚫 Ver Usuarios Bloqueados',
        'Volver'
      ]
    }]);

    if (accion === '👥 Ver Seguidores') await showUserList('SEGUIDORES', '/users/seguidores');
    if (accion === '👤 Ver Siguiendo') await showUserList('SIGUIENDO', '/users/siguiendo');
    if (accion === '🚫 Ver Usuarios Bloqueados') await showUserList('USUARIOS BLOQUEADOS', '/users/bloqueados');

  } catch (error) {
    spinner.fail();
    showError(error.message);
  }
}

async function showUserList(title, endpoint) {
  const spinner = ora(`Cargando ${title.toLowerCase()}...`).start();
  try {
    const list = await apiRequest('GET', endpoint);
    spinner.succeed();

    console.log(chalk.bold.cyan(`\n--- ${title} ---`));
    if (!list || list.length === 0) {
      console.log(chalk.yellow('Lista vacía.\n'));
    } else {
      list.forEach((u, i) => {
        console.log(chalk.white(`${i + 1}. ${u.nombre} ${chalk.gray('(@' + (u.username || 'usuario') + ')')}`));
      });
      console.log();
    }
    await inquirer.prompt([{ type: 'list', name: 'ok', message: 'Presiona Enter para volver', choices: ['Volver'] }]);
  } catch (e) {
    spinner.fail(e.message);
  }
}

async function updateProfile() {
  console.log(chalk.cyan('\n✏️  ACTUALIZAR PERFIL\n'));

  const { opcion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'opcion',
      message: '¿Qué deseas actualizar?',
      choices: [
        'Nombre',
        'Bio',
        'Ubicación',
        'Sitio Web',
        'Volver'
      ]
    }
  ]);

  if (opcion === 'Volver') return;

  const fieldMap = {
    'Nombre': 'nombre',
    'Bio': 'bio',
    'Ubicación': 'ubicacion',
    'Sitio Web': 'sitioWeb'
  };

  const field = fieldMap[opcion];

  const { valor } = await inquirer.prompt([
    {
      type: 'input',
      name: 'valor',
      message: `Nuevo ${opcion.toLowerCase()}:`
    }
  ]);

  const spinner = ora('Actualizando perfil...').start();

  try {
    await apiRequest('PUT', '/users/profile', { [field]: valor });
    spinner.succeed();
    showSuccess('Perfil actualizado');
  } catch (error) {
    spinner.fail();
    showError(error.message);
  }
}

async function searchUsers() {
  console.log(chalk.cyan('\n🔍 BUSCAR USUARIOS\n'));

  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: 'Buscar usuario:'
    }
  ]);

  if (!query) return;

  const spinner = ora('Buscando...').start();

  try {
    const res = await apiRequest('GET', '/users/buscar', { search: query });
    const users = res.usuarios || res;
    spinner.succeed();

    if (!users || users.length === 0) {
      console.log(chalk.yellow('No se encontraron usuarios.\n'));
      return;
    }

    console.log();
    users.forEach((u, index) => {
      console.log(chalk.bold(`${index + 1}. [ID: ${u._id}] ${u.nombre}`));
      console.log(chalk.gray(`   Email: ${u.email}`));
      if (u.bio) console.log(chalk.gray(`   Bio: ${u.bio}`));
      console.log();
    });
  } catch (error) {
    spinner.fail();
    showError(error.message);
  }
}



async function enterChatRoom(conversacionId) {
  let conversacion;
  try {
    const res = await apiRequest('GET', `/conversaciones/${conversacionId}`);
    conversacion = res.conversacion || res;
  } catch (e) {
    showError(e.message);
    return;
  }

  const otherUser = conversacion.participantes?.find(p => p._id !== user._id);
  let sessionMessages = [];

  const formatMessageContent = (m) => {
    let content = m.contenido || '';
    if (m.media && m.media.length > 0) {
      m.media.forEach(med => {
        content += `\n   ${chalk.blue.underline('📎 Media: ' + med.url)}`;
      });
    }
    return content;
  };

  const printMessage = (m, index) => {
    const isMe = (m.emisor?._id === user._id || m.emisor === user._id);
    const emisorNombre = isMe ? chalk.green('Tú') : chalk.cyan(m.emisor?.nombre || otherUser?.nombre || 'Usuario');
    const idxStr = chalk.gray(`[${index}]`);
    console.log(`${idxStr} ${emisorNombre}: ${chalk.white(formatMessageContent(m))}`);
  };

  console.clear();
  console.log(BANNER);
  console.log(chalk.bgCyan.black(`\n  💬 CHAT CON: ${otherUser?.nombre || 'Desconocido'}  \n`));
  console.log(chalk.gray('--- Historial de mensajes ---'));

  try {
    const msgsRes = await apiRequest('GET', `/mensajes/conversacion/${conversacion._id}`);
    sessionMessages = msgsRes.mensajes || msgsRes;
    if (sessionMessages && sessionMessages.length > 0) {
      sessionMessages.forEach((m, i) => printMessage(m, i + 1));
    }
  } catch (e) {
    console.log(chalk.yellow('No se pudieron cargar mensajes previos.'));
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.italic.gray(`Comandos: 'salir' | '/edit <N> <texto>' | '/del <N>'`));

  const onMensajeRecibido = (msg) => {
    const msgConvId = msg.conversacion?._id || msg.conversacion;
    if (msgConvId === conversacion._id) {
      const emisorId = msg.emisor?._id || msg.emisor;
      const isMe = (emisorId === user._id);

      if (isMe) {
        // Encontrar el último mensaje 'pending' para actualizar su ID
        for (let i = sessionMessages.length - 1; i >= 0; i--) {
          if (sessionMessages[i]._id.toString().startsWith('pending-')) {
            sessionMessages[i]._id = msg._id;
            break;
          }
        }
      } else {
        sessionMessages.push(msg);
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        printMessage(msg, sessionMessages.length);
        process.stdout.write(chalk.green('? Tú: '));
      }
    }
  };

  const onMensajeEditado = (msg) => {
    if (msg.conversacion === conversacion._id || msg.conversacion?._id === conversacion._id) {
      const idx = sessionMessages.findIndex(m => m._id === msg._id);
      if (idx !== -1) {
        sessionMessages[idx].contenido = msg.contenido;
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        console.log(chalk.yellow(`\n📝 [INFO] El mensaje [${idx + 1}] ha sido editado:`));
        printMessage(sessionMessages[idx], idx + 1);
        process.stdout.write(chalk.green('? Tú: '));
      }
    }
  };

  const onMensajeEliminado = (data) => {
    const idx = sessionMessages.findIndex(m => m._id === data._id);
    if (idx !== -1) {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(chalk.red(`\n🗑️  [INFO] El mensaje [${idx + 1}] fue eliminado.`));
      sessionMessages[idx].contenido = chalk.red.italic('<Mensaje eliminado>');
      process.stdout.write(chalk.green('? Tú: '));
    }
  };

  if (socket) {
    socket.emit('viendo-conversacion', { userId: user._id, conversacionId: conversacion._id });
    socket.on('mensaje-recibido', onMensajeRecibido);
    socket.on('mensaje-editado', onMensajeEditado);
    socket.on('mensaje-eliminado', onMensajeEliminado);
  }

  while (true) {
    const { mensaje } = await inquirer.prompt([
      {
        type: 'input',
        name: 'mensaje',
        message: 'Tú:'
      }
    ]);

    if (mensaje.toLowerCase() === 'salir') {
      if (socket) {
        socket.off('mensaje-recibido', onMensajeRecibido);
        socket.off('mensaje-editado', onMensajeEditado);
        socket.off('mensaje-eliminado', onMensajeEliminado);
        socket.emit('viendo-conversacion', { userId: user._id, conversacionId: null });
      }
      break;
    }

    if (!mensaje.trim()) continue;

    // Handle Edit/Delete Commands
    if (mensaje.startsWith('/del ')) {
      const idx = parseInt(mensaje.split(' ')[1]) - 1;
      const msgToDelete = sessionMessages[idx];
      if (msgToDelete) {
        try {
          await apiRequest('DELETE', `/mensajes/${msgToDelete._id}`);
          showSuccess('Borrando...');
        } catch (e) {
          showError(e.message);
        }
      } else {
        showError('Índice inválido');
      }
      continue;
    }

    if (mensaje.startsWith('/edit ')) {
      const parts = mensaje.split(' ');
      const idx = parseInt(parts[1]) - 1;
      const nuevoTexto = parts.slice(2).join(' ');
      const msgToEdit = sessionMessages[idx];
      if (msgToEdit) {
        try {
          await apiRequest('PUT', `/mensajes/${msgToEdit._id}`, { contenido: nuevoTexto });
          showSuccess('Editando...');
        } catch (e) {
          showError(e.message);
        }
      } else {
        showError('Índice inválido');
      }
      continue;
    }

    try {
      if (socket && socket.connected) {
        socket.emit("mensaje", {
          contenido: mensaje,
          emisor: user._id,
          conversacion: conversacion._id
        });
        // Agregar localmente para el índice
        // Nota: El socket emit suele disparar un mensaje-recibido si el servidor lo retransmite al emisor,
        // pero a veces el servidor ignora al emisor. Para el CLI, lo agregaremos cuando lo "veamos" volver o si no vuelve.
        // En Jandochat backend, el emisor NO recibe su propio mensaje vía 'mensaje-recibido' por default.
        const localMsg = {
          _id: 'pending-' + Date.now(),
          contenido: mensaje,
          emisor: user._id,
          conversacion: conversacion._id,
          createdAt: new Date()
        };
        sessionMessages.push(localMsg);
        // Print with index
        process.stdout.write('\x1b[1A\x1b[2K'); // Subir una línea y borrarla (la del prompt de inquirer)
        printMessage(localMsg, sessionMessages.length);
      } else {
        const sent = await apiRequest('POST', '/mensajes/create', {
          contenido: mensaje,
          conversacion: conversacion._id
        });
        sessionMessages.push(sent);
        process.stdout.write('\x1b[1A\x1b[2K');
        printMessage(sent, sessionMessages.length);
      }
    } catch (error) {
      showError(error.message);
    }
  }
}

async function chatWithUser() {
  console.log(chalk.cyan('\n💬 CONVERSACIONES ACTIVAS\n'));
  const spinner = ora('Cargando conversaciones...').start();
  let convs;
  try {
    const res = await apiRequest('GET', '/conversaciones');
    convs = res.conversaciones || res;
    spinner.succeed();
  } catch (error) {
    spinner.fail();
    showError(error.message);
    return;
  }

  if (!convs || convs.length === 0) {
    console.log(chalk.yellow('No tienes conversaciones aún.\n'));
    return;
  }

  const buildChoices = (list) => {
    return list.map(c => {
      const otherUser = c.participantes?.find(p => p._id !== user._id);
      return {
        name: `${chalk.bold(otherUser?.nombre || 'Usuario')} - ${chalk.gray(c.ultimoMensaje?.contenido?.substring(0, 30) || 'Sin mensajes...')}`,
        value: c._id
      };
    });
  };

  const choices = buildChoices(convs);
  choices.unshift({ name: 'Volver', value: 'volver' });
  choices.unshift({ name: '🔍 Buscar conversación...', value: 'buscar' });

  const { seleccion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'seleccion',
      message: 'Selecciona una conversación:',
      choices: choices,
      pageSize: 10
    }
  ]);

  if (seleccion === 'volver') return;

  if (seleccion === 'buscar') {
    const { query } = await inquirer.prompt([{
      type: 'input',
      name: 'query',
      message: 'Busca por nombre de usuario:'
    }]);

    const queryLower = query.toLowerCase();
    const filtered = convs.filter(c => {
      const otherUser = c.participantes?.find(p => p._id !== user._id);
      return otherUser?.nombre?.toLowerCase().includes(queryLower);
    });

    if (filtered.length === 0) {
      console.log(chalk.yellow('\nNo se encontraron conversaciones con ese nombre.\n'));
      return;
    }

    const filteredChoices = buildChoices(filtered);
    filteredChoices.unshift({ name: 'Volver', value: 'volver' });

    const { subSeleccion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'subSeleccion',
        message: 'Resultados de búsqueda:',
        choices: filteredChoices,
        pageSize: 10
      }
    ]);

    if (subSeleccion === 'volver') return;
    await enterChatRoom(subSeleccion);
    return;
  }

  await enterChatRoom(seleccion);
}

async function startNewChat() {
  const { userId } = await inquirer.prompt([{
    type: 'input',
    name: 'userId',
    message: 'Ingresa el ID del usuario con quien conversar:'
  }]);

  if (!userId) return;

  const sp = ora('Iniciando conversación...').start();
  try {
    const res = await apiRequest('POST', '/conversaciones', { participantes: [userId], esGrupo: false });
    const conv = res.conversacion || res;
    sp.succeed('¡Conversación lista!');
    await enterChatRoom(conv._id);
  } catch (error) {
    sp.fail();
    showError(error.message);
  }
}

async function messagesMenu() {
  console.log(chalk.cyan('\n✉️  SECCIÓN DE MENSAJES\n'));

  const { opcion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'opcion',
      message: '¿Qué deseas hacer?',
      choices: [
        '💬 Ver mis conversaciones activas',
        '➕ Iniciar nueva conversación (por ID de Usuario)',
        'Volver'
      ]
    }
  ]);

  if (opcion === '💬 Ver mis conversaciones activas') {
    await chatWithUser();
  } else if (opcion === '➕ Iniciar nueva conversación (por ID de Usuario)') {
    await startNewChat();
  }
}

async function getNotifications() {
  console.log(chalk.cyan('\n🔔 CENTRO DE NOTIFICACIONES\n'));
  const spinner = ora('Sincronizando notificaciones...').start();
  try {
    const res = await apiRequest('GET', '/notificaciones');
    const notis = res.notificaciones || res;
    spinner.succeed();
    if (!notis || notis.length === 0) {
      console.log(chalk.yellow('No tienes notificaciones nuevas.\n'));
      return;
    }

    const notiChoices = notis.map(n => ({
      name: `${n.leido ? chalk.gray('•') : chalk.bold.green('•')} ${n.mensaje} ${chalk.gray('- ' + new Date(n.createdAt).toLocaleDateString())}`,
      value: n
    }));

    notiChoices.unshift({ name: chalk.yellow('⬅️ Volver'), value: 'back' });

    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: 'Selecciona una notificación para abrirla:',
        choices: notiChoices,
        pageSize: 12
      }
    ]);

    if (selection === 'back') return;

    // Abrir según el tipo
    if (selection.tipo === 'mensaje' && selection.conversacion) {
      await enterChatRoom(selection.conversacion);
    } else if (selection.publicacion) {
      const pId = typeof selection.publicacion === 'object' ? selection.publicacion._id : selection.publicacion;
      await viewPost(pId);
    } else {
      console.log(chalk.cyan(`\nℹ️ Detalle: ${selection.mensaje}`));
      await inquirer.prompt([{ type: 'list', name: 'ok', message: 'Presiona Enter para continuar', choices: ['Cerrar'] }]);
    }

    // Marcar como leída si no lo estaba (opcional, dependiendo de si el backend tiene esa ruta automática)
    await getNotifications(); // Refresh list

  } catch (err) {
    spinner.fail();
    showError(err.message);
  }
}

async function configAccount() {
  console.log(chalk.cyan('\n⚙️  CONFIGURACIÓN DE CUENTA\n'));
  const { opcion } = await inquirer.prompt([
    {
      type: 'list',
      name: 'opcion',
      message: '¿Qué deseas hacer?',
      choices: [
        '🗑️  Borrar TODAS mis publicaciones',
        '❌ Eliminar mi cuenta permanentemente',
        'Volver'
      ]
    }
  ]);

  if (opcion === 'Volver') return;

  if (opcion === '❌ Eliminar mi cuenta permanentemente') {
    const { confirmAction } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmAction',
      message: chalk.red.bold('⚠ ¿ESTÁS SEGURO? Esta acción no se puede deshacer y perderás TODO.'),
      default: false
    }]);

    if (confirmAction) {
      const { password } = await inquirer.prompt([{
        type: 'password',
        name: 'password',
        message: 'Por seguridad, ingresa tu contraseña para confirmar:',
        mask: '*'
      }]);

      const sp = ora('Eliminando cuenta...').start();
      try {
        await apiRequest('DELETE', '/users/me', { password });
        sp.succeed('Tu cuenta ha sido eliminada. Lamentamos verte partir.');
        token = null;
        user = null;
        clearSession();
        process.exit(0);
      } catch (e) {
        sp.fail(e.message);
      }
    }
    return;
  }

  if (opcion === '🗑️  Borrar TODAS mis publicaciones') {
    const { confirmar } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmar',
      message: '¿Estás completamente seguro de borrar TODO tu muro?',
      default: false
    }]);
    if (confirmar) {
      const sp = ora('Borrando publicaciones...').start();
      try {
        await apiRequest('DELETE', '/posts/todas/mias');
        sp.succeed('Todas tus publicaciones han sido eliminadas.');
      } catch (e) {
        sp.fail();
        showError(e.message);
      }
    }
  }
}

async function manageStories() {
  console.log(chalk.cyan('\n📚 MIS HISTORIAS (ARCHIVO Y ACTIVAS)\n'));
  const spinner = ora('Cargando historias...').start();

  try {
    const resActive = await apiRequest('GET', '/stories/mine');
    const resArchive = await apiRequest('GET', '/stories/archive');
    spinner.succeed();

    const active = resActive || [];
    const archived = resArchive || [];

    if (active.length === 0 && archived.length === 0) {
      console.log(chalk.yellow('No tienes contenido aquí, no has publicado ninguna historia aún.\n'));
      return;
    }

    console.log(chalk.bold('--- Historias Activas ---'));
    if (active.length === 0) console.log(chalk.gray('No tienes contenido aquí.'));
    active.forEach((s) => {
      console.log(chalk.white(`📝 [ID: ${s._id}] Tipo: ${s.tipo} - Vistas: ${s.viewers?.length || 0}`));
    });

    console.log(chalk.bold('\n--- Archivo de Historias (Expiradas) ---'));
    if (archived.length === 0) console.log(chalk.gray('No tienes historias archivadas.'));
    archived.forEach((s) => {
      console.log(chalk.gray(`🗃️  [ID: ${s._id}] Tipo: ${s.tipo} - Creada: ${new Date(s.createdAt).toLocaleDateString()}`));
    });
    console.log();

    const { opcion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'opcion',
        message: '¿Qué deseas hacer?',
        choices: [
          '🗑️  Borrar una historia por ID',
          '💥 Borrar TODAS mis historias (Archivo y Activas)',
          'Volver'
        ]
      }
    ]);

    if (opcion === '🗑️  Borrar una historia por ID') {
      const { idHistoria } = await inquirer.prompt([{
        type: 'input',
        name: 'idHistoria',
        message: 'Ingresa el ID de la historia a borrar:'
      }]);

      if (!idHistoria) return;
      const sp = ora('Eliminando...').start();
      try {
        await apiRequest('DELETE', `/stories/${idHistoria}`);
        sp.succeed('Historia eliminada correctamente.');
      } catch (e) {
        sp.fail();
        showError(e.message);
      }
    } else if (opcion === '💥 Borrar TODAS mis historias (Archivo y Activas)') {
      const { confirmar } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmar',
        message: '¿Estás completamente seguro de borrar TODO tu historial de historias?',
        default: false
      }]);
      if (confirmar) {
        const sp = ora('Borrando historias...').start();
        try {
          await apiRequest('DELETE', '/stories/all/mine');
          sp.succeed('Todas tus historias han sido eliminadas.');
        } catch (e) {
          sp.fail();
          showError(e.message);
        }
      }
    }

  } catch (err) {
    spinner.fail();
    showError(err.message);
  }
}

async function mainMenu() {
  while (true) {
    const { opcion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'opcion',
        message: chalk.bold(' Menú Principal '),
        choices: [
          '📰 Ver Muro',
          '✏️  Crear Publicación',
          '👤 Mi Perfil',
          '✏️  Actualizar Perfil',
          '📚 Mis Historias',
          '🔍 Buscar Usuarios',
          '💬 Mensajes',
          '🔔 Notificaciones',
          '⚙️  Configurar Cuenta',
          '🚪 Cerrar Sesión',
          '❌ Salir'
        ]
      }
    ]);

    switch (opcion) {
      case '📰 Ver Muro':
        await getFeed();
        break;
      case '✏️  Crear Publicación':
        await createPost();
        break;
      case '👤 Mi Perfil':
        await getProfile();
        break;
      case '✏️  Actualizar Perfil':
        await updateProfile();
        break;
      case '📚 Mis Historias':
        await manageStories();
        break;
      case '🔍 Buscar Usuarios':
        await searchUsers();
        break;
      case '💬 Mensajes':
        await messagesMenu();
        break;
      case '🔔 Notificaciones':
        await getNotifications();
        break;
      case '⚙️  Configurar Cuenta':
        await configAccount();
        break;
      case '🚪 Cerrar Sesión':
        token = null;
        user = null;
        clearSession();
        console.log(chalk.yellow('\n👋 Sesión cerrada\n'));
        return;
      case '❌ Salir':
        console.log(chalk.cyan('\n👋 ¡Gracias por usar JANDOCHAT! Hasta luego.\n'));
        process.exit(0);
    }
  }
}

async function main() {
  loadSession();
  showBanner();

  console.log(chalk.cyan('🌐 Conectando al servidor...\n'));
  await connectSocket();

  while (true) {
    if (!token) {
      const { authOpcion } = await inquirer.prompt([
        {
          type: 'list',
          name: 'authOpcion',
          message: chalk.bold(' Bienvenido a JANDOCHAT '),
          choices: [
            '🔑 Iniciar Sesión',
            '📝 Registrarse',
            '❌ Salir'
          ]
        }
      ]);

      if (authOpcion === '🔑 Iniciar Sesión') {
        const success = await login();
      } else if (authOpcion === '📝 Registrarse') {
        const success = await register();
      } else {
        process.exit(0);
      }
    } else {
      await mainMenu();
    }
  }
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Error crítico:'), error.message);
  process.exit(1);
});
