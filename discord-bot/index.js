require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const GUILD_ID = '1489432163077062786';
const CATEGORY_ID = '1489660356098789558';
const ADMIN_ROLE_ID = '1489660314671648859';
const PREFIX = '!';

// ══════════════════════════════════════════
//  ARCHIVO JSON LOCAL
// ══════════════════════════════════════════

const DATA_FILE = path.join(__dirname, 'tickets_cache.json');

function loadLocalData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error cargando JSON:', e);
  }
  return { tickets: {}, orders: {} };
}

function saveLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error guardando JSON:', e);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// ══════════════════════════════════════════
//  EMOJIS
// ══════════════════════════════════════════

const EMOJIS = {
  cart: '<:435031shoppingcart:1489159643199574136>',
  pay: '<:273651shopeepay:1489159640942907402>',
  member: '<:82628member:1489159638447427685>',
  close: '<:27756close:1489159633909059765>',
  shop: '<:43311shopbshop:1489159635293442078>',
  grocery: '<:435031shoppingcart:1489159643199574136>',
  shopcart: '<:17755shopcart:1489159629924728974>',
  booster: '<:21650booster:1489159631493267587>',
  giveaway: '<:771156giveaway:1489159644860383333>',
  robux: '<:79718robux:1489159637075755031>',
  crunchyroll: '<:CrunchyrollMangaprecioyfechaestr:1489159311476260975>',
  designer: '<:21408desginer:1489159632667676784>',
  img1: '<:688bbfec88fb6c55f8e87c0f_imgonli:1489159308489789512>',
  img2: '<:624057848f3f2:1489159307173040139>',
  ticket: '<:17755shopcart:1489159629924728974>',
  support: '<:82628member:1489159638447427685>',
};

// ══════════════════════════════════════════
//  ESTADÍSTICAS
// ══════════════════════════════════════════

let orderStats = { total: 0, pending: 0, paid: 0, cancelled: 0 };
let ticketStats = { open: 0, total: 0 };

async function fetchStats() {
  const localData = loadLocalData();
  const localTickets = Object.values(localData.tickets);
  const localOrders = Object.values(localData.orders);

  const localOpenTickets = localTickets.filter(t => t.status === 'open').length;
  const localPendingOrders = localOrders.filter(o => o.status === 'pending').length;

  const { data: dbOrders } = await supabase.from('orders').select('status');
  const { data: dbTickets } = await supabase.from('tickets').select('status');

  if (dbOrders) {
    orderStats.total = dbOrders.length + localOrders.length;
    orderStats.pending = localPendingOrders;
    orderStats.paid = dbOrders.filter(o => o.status === 'paid').length;
    orderStats.cancelled = dbOrders.filter(o => o.status === 'cancelled').length;
  }

  if (dbTickets) {
    ticketStats.total = dbTickets.length + localTickets.length;
    ticketStats.open = localOpenTickets;
  }
}

async function updatePresence() {
  await fetchStats();
  const totalPending = orderStats.pending + ticketStats.open;

  const statusMessages = [
    { type: ActivityType.Watching, name: `${orderStats.total + ticketStats.total} tickets` },
    { type: ActivityType.Playing, name: `${totalPending} pendientes` },
    { type: ActivityType.Watching, name: `${orderStats.paid} pagos` },
  ];

  const current = statusMessages[Math.floor(Date.now() / 15000) % statusMessages.length];

  client.user.setPresence({
    activities: [{ name: current.name, type: current.type }],
    status: totalPending > 0 ? 'dnd' : 'online',
  });
}

// ══════════════════════════════════════════
//  SLASH COMMANDS REGISTRATION
// ══════════════════════════════════════════

const slashCommands = [
  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Hace que el bot diga algo')
    .addStringOption(opt => 
      opt.setName('mensaje')
        .setDescription('El mensaje a enviar')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reply_to')
        .setDescription('ID del mensaje a responder (opcional)')
        .setRequired(false)
    ),
  
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),
  
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Muestra estadísticas de tickets y órdenes'),
  
  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Usuario del que ver el avatar')
        .setRequired(false)
    ),
  
  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra información del servidor'),
  
  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Muestra información de un usuario')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Usuario a consultar')
        .setRequired(false)
    ),
  
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Elimina mensajes del canal')
    .addIntegerOption(opt =>
      opt.setName('cantidad')
        .setDescription('Cantidad de mensajes (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  
  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Crea un embed personalizado')
    .addStringOption(opt =>
      opt.setName('titulo')
        .setDescription('Título del embed')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('descripcion')
        .setDescription('Descripción del embed')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('color')
        .setDescription('Color en hex (ej: ff0000)')
        .setRequired(false)
    ),
  
  new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Crea el panel de tickets'),

  new SlashCommandBuilder()
    .setName('steal')
    .setDescription('Roba un emoji o sticker')
    .addStringOption(opt =>
      opt.setName('emoji')
        .setDescription('El emoji a robar')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('nombre')
        .setDescription('Nombre para el emoji/sticker')
        .setRequired(false)
    ),
];

async function registerSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log('📝 Registrando slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, GUILD_ID),
      { body: slashCommands.map(cmd => cmd.toJSON()) }
    );
    console.log('✅ Slash commands registrados');
  } catch (error) {
    console.error('❌ Error registrando slash commands:', error);
  }
}

// ══════════════════════════════════════════
//  READY
// ══════════════════════════════════════════

client.on('ready', async () => {
  console.log(`✅ Bot conectado: ${client.user.tag}`);

  if (!fs.existsSync(DATA_FILE)) {
    saveLocalData({ tickets: {}, orders: {} });
    console.log('📁 Creado tickets_cache.json');
  }

  await registerSlashCommands();
  await updatePresence();
  setInterval(updatePresence, 15000);

  supabase
    .channel('orders-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
      async (payload) => {
        await handleNewOrder(payload.new);
        await updatePresence();
      }
    )
    .subscribe();
});

// ══════════════════════════════════════════
//  COMANDOS HÍBRIDOS (FUNCIONES)
// ══════════════════════════════════════════

async function cmdSay(context, args, replyTo = null) {
  const isSlash = context.isCommand?.();
  const texto = isSlash ? context.options.getString('mensaje') : args.join(' ');
  
  if (!texto) {
    const msg = `${EMOJIS.close} Debes escribir un mensaje.`;
    return isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }

  let targetMessage = null;
  
  if (isSlash) {
    const replyId = context.options.getString('reply_to');
    if (replyId) {
      try {
        targetMessage = await context.channel.messages.fetch(replyId);
      } catch (e) {}
    }
  } else {
    if (context.reference?.messageId) {
      try {
        targetMessage = await context.channel.messages.fetch(context.reference.messageId);
      } catch (e) {}
    }
    replyTo = targetMessage;
  }

  if (!isSlash) {
    await context.delete().catch(() => {});
  }

  if (targetMessage || replyTo) {
    await (targetMessage || replyTo).reply(texto);
  } else {
    await context.channel.send(texto);
  }

  if (isSlash) {
    await context.reply({ content: `${EMOJIS.shop} Mensaje enviado.`, ephemeral: true });
  }
}

async function cmdPing(context) {
  const isSlash = context.isCommand?.();
  const start = Date.now();
  
  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .setDescription(
      `> **Latencia:** \`${Date.now() - start}ms\`\n` +
      `> **API:** \`${Math.round(client.ws.ping)}ms\``
    )
    .setColor(0xf47521);

  if (isSlash) {
    await context.reply({ embeds: [embed] });
  } else {
    await context.reply({ embeds: [embed] });
  }
}

async function cmdStats(context) {
  const isSlash = context.isCommand?.();
  await fetchStats();
  const totalPending = orderStats.pending + ticketStats.open;

  const embed = new EmbedBuilder()
    .setTitle('╭────── ⋆ ⋅ STATS ⋅ ⋆ ──────╮')
    .setDescription(
      `\n${EMOJIS.cart} **Órdenes**\n` +
      `┊ Totales: \`${orderStats.total}\`\n` +
      `┊ Pendientes: \`${orderStats.pending}\`\n` +
      `┊ Pagadas: \`${orderStats.paid}\`\n` +
      `┊ Canceladas: \`${orderStats.cancelled}\`\n\n` +
      `${EMOJIS.ticket} **Tickets**\n` +
      `┊ Totales: \`${ticketStats.total}\`\n` +
      `┊ Abiertos: \`${ticketStats.open}\`\n\n` +
      `${EMOJIS.booster} **Total pendientes:** \`${totalPending}\`\n` +
      `${EMOJIS.img2} **Tasa de éxito:** \`${orderStats.total > 0 ? ((orderStats.paid / orderStats.total) * 100).toFixed(1) : 0}%\`\n` +
      `╰──────────────────────────╯`
    )
    .setColor(0x5865f2)
    .setTimestamp();

  if (isSlash) {
    await context.reply({ embeds: [embed], ephemeral: true });
  } else {
    await context.reply({ embeds: [embed] });
  }
}

async function cmdAvatar(context, args) {
  const isSlash = context.isCommand?.();
  let user;
  
  if (isSlash) {
    user = context.options.getUser('usuario') || context.user;
  } else {
    user = context.mentions.users.first() || context.author;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.member} Avatar de ${user.username}`)
    .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setColor(0xf47521);

  if (isSlash) {
    await context.reply({ embeds: [embed] });
  } else {
    await context.reply({ embeds: [embed] });
  }
}

async function cmdServerInfo(context) {
  const isSlash = context.isCommand?.();
  const guild = context.guild;

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.shop} ${guild.name}`)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setDescription(
      `> **ID:** \`${guild.id}\`\n` +
      `> **Dueño:** <@${guild.ownerId}>\n` +
      `> **Miembros:** \`${guild.memberCount}\`\n` +
      `> **Canales:** \`${guild.channels.cache.size}\`\n` +
      `> **Roles:** \`${guild.roles.cache.size}\`\n` +
      `> **Creado:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
    )
    .setColor(0xf47521)
    .setTimestamp();

  if (isSlash) {
    await context.reply({ embeds: [embed] });
  } else {
    await context.reply({ embeds: [embed] });
  }
}

async function cmdUserInfo(context, args) {
  const isSlash = context.isCommand?.();
  let user, member;
  
  if (isSlash) {
    user = context.options.getUser('usuario') || context.user;
  } else {
    user = context.mentions.users.first() || context.author;
  }
  
  try {
    member = await context.guild.members.fetch(user.id);
  } catch (e) {
    member = null;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.member} ${user.username}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `> **ID:** \`${user.id}\`\n` +
      `> **Tag:** \`${user.tag}\`\n` +
      `> **Bot:** \`${user.bot ? 'Sí' : 'No'}\`\n` +
      `> **Cuenta creada:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>\n` +
      (member ? `> **Se unió:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : '')
    )
    .setColor(0xf47521)
    .setTimestamp();

  if (isSlash) {
    await context.reply({ embeds: [embed] });
  } else {
    await context.reply({ embeds: [embed] });
  }
}

async function cmdClear(context, args) {
  const isSlash = context.isCommand?.();
  const member = context.member;
  
  if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    const msg = `${EMOJIS.close} No tienes permiso para hacer esto.`;
    return isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }

  let cantidad;
  if (isSlash) {
    cantidad = context.options.getInteger('cantidad');
  } else {
    cantidad = parseInt(args[0]);
  }

  if (!cantidad || cantidad < 1 || cantidad > 100) {
    const msg = `${EMOJIS.close} Cantidad inválida (1-100).`;
    return isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }

  try {
    const deleted = await context.channel.bulkDelete(cantidad, true);
    const embed = new EmbedBuilder()
      .setDescription(`${EMOJIS.shop} **${deleted.size}** mensajes eliminados.`)
      .setColor(0x57f287);

    if (isSlash) {
      await context.reply({ embeds: [embed], ephemeral: true });
    } else {
      const msg = await context.channel.send({ embeds: [embed] });
      setTimeout(() => msg.delete().catch(() => {}), 3000);
    }
  } catch (e) {
    const msg = `${EMOJIS.close} Error al eliminar mensajes.`;
    isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }
}

async function cmdEmbed(context, args) {
  const isSlash = context.isCommand?.();
  const member = context.member;
  
  if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
    const msg = `${EMOJIS.close} No tienes permiso para hacer esto.`;
    return isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }

  let titulo, descripcion, color;
  
  if (isSlash) {
    titulo = context.options.getString('titulo');
    descripcion = context.options.getString('descripcion');
    color = context.options.getString('color') || 'f47521';
  } else {
    const matches = args.join(' ').match(/"([^"]+)"/g);
    if (!matches || matches.length < 2) {
      return context.reply(`${EMOJIS.close} Uso: \`!embed "titulo" "descripcion" color\``);
    }
    titulo = matches[0].replace(/"/g, '');
    descripcion = matches[1].replace(/"/g, '');
    color = args[args.length - 1].replace('#', '') || 'f47521';
  }

  const embed = new EmbedBuilder()
    .setTitle(titulo)
    .setDescription(descripcion)
    .setColor(parseInt(color, 16) || 0xf47521)
    .setTimestamp();

  await context.channel.send({ embeds: [embed] });
  
  if (isSlash) {
    await context.reply({ content: `${EMOJIS.shop} Embed creado.`, ephemeral: true });
  } else {
    await context.delete().catch(() => {});
  }
}

async function cmdTicketPanel(context) {
  const isSlash = context.isCommand?.();
  const member = context.member;
  
  if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    const msg = `${EMOJIS.close} No tienes permiso para hacer esto.`;
    return isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }

  const embed = new EmbedBuilder()
    .setAuthor({
      name: '✦ MYACCOUNTS STORE ✦',
      iconURL: 'https://cdn.discordapp.com/emojis/1489159640942907402.webp',
    })
    .setTitle(`${EMOJIS.grocery} Centro de Soporte`)
    .setDescription(
      `\n` +
      `> *¿Necesitas ayuda o quieres realizar una compra?*\n` +
      `> *Abre un ticket y te atenderemos lo antes posible.*\n\n` +
      `${EMOJIS.shop} **Servicios disponibles**\n` +
      `╰ Cuentas Premium\n` +
      `╰ Suscripciones\n` +
      `╰ Diseños personalizados\n` +
      `╰ Soporte técnico\n\n` +
      `${EMOJIS.pay} **Métodos de pago**\n` +
      `╰ PayPal・Transferencia・Crypto\n\n` +
      `─────────────────────────────────`
    )
    .setColor(0xf47521)
    .setFooter({ 
      text: '🕐 Respondemos en menos de 24h', 
      iconURL: 'https://cdn.discordapp.com/emojis/1489159629924728974.webp' 
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('Crear Ticket')
      .setStyle(ButtonStyle.Success)
      .setEmoji('1489159629924728974')
  );

  await context.channel.send({ embeds: [embed], components: [row] });
  
  if (isSlash) {
    await context.reply({ content: `${EMOJIS.shop} Panel creado.`, ephemeral: true });
  } else {
    await context.delete().catch(() => {});
  }
}

// ══════════════════════════════════════════
//  COMANDO STEAL
// ══════════════════════════════════════════

async function cmdSteal(context, args) {
  const isSlash = context.isCommand?.();
  const member = context.member;

  // Verificar permisos
  if (!member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
    const msg = `${EMOJIS.close} No tienes permiso para hacer esto.`;
    return isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }

  let emojisToSteal = [];
  let stickersToSteal = [];
  let customName = isSlash ? context.options.getString('nombre') : null;

  // Si es slash command
  if (isSlash) {
    const emojiInput = context.options.getString('emoji');
    if (emojiInput) {
      const parsed = parseEmojis(emojiInput);
      emojisToSteal = parsed;
    }
  } else {
    // Si es reply a un mensaje
    if (context.reference?.messageId) {
      try {
        const referencedMsg = await context.channel.messages.fetch(context.reference.messageId);
        
        // Obtener stickers del mensaje
        if (referencedMsg.stickers.size > 0) {
          referencedMsg.stickers.forEach(sticker => {
            stickersToSteal.push(sticker);
          });
        }
        
        // Obtener emojis del mensaje
        const parsed = parseEmojis(referencedMsg.content);
        emojisToSteal = parsed;
        
      } catch (e) {
        console.error('Error fetching referenced message:', e);
      }
    }
    
    // También parsear emojis de los argumentos
    if (args.length > 0) {
      const argsText = args.join(' ');
      const parsed = parseEmojis(argsText);
      emojisToSteal = [...emojisToSteal, ...parsed];
      
      // Verificar si el último arg es un nombre personalizado (sin < >)
      const lastArg = args[args.length - 1];
      if (!lastArg.includes('<') && !lastArg.includes('>') && !lastArg.match(/^\d+$/)) {
        customName = lastArg;
        // Remover el último emoji si era el nombre
        const lastEmoji = emojisToSteal[emojisToSteal.length - 1];
        if (lastEmoji && !argsText.includes(lastEmoji.name)) {
          // No hacer nada, el nombre ya está separado
        }
      }
    }
  }

  // Si no hay nada que robar
  if (emojisToSteal.length === 0 && stickersToSteal.length === 0) {
    const msg = `${EMOJIS.close} No encontré emojis o stickers para robar.\n> Responde a un mensaje o escribe: \`!steal <emoji> [nombre]\``;
    return isSlash ? context.reply({ content: msg, ephemeral: true }) : context.reply(msg);
  }

  const results = [];

  // Robar emojis
  for (const emoji of emojisToSteal) {
    try {
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}?size=128`;
      const name = customName || emoji.name;
      
      const createdEmoji = await context.guild.emojis.create({
        attachment: emojiUrl,
        name: name.substring(0, 32).replace(/[^a-zA-Z0-9_]/g, '_'),
      });
      
      results.push({
        success: true,
        type: 'emoji',
        name: createdEmoji.name,
        emoji: createdEmoji.toString(),
      });
    } catch (e) {
      results.push({
        success: false,
        type: 'emoji',
        name: emoji.name,
        error: e.message,
      });
    }
  }

  // Robar stickers
  for (const sticker of stickersToSteal) {
    try {
      // Solo se pueden crear stickers de tipo GUILD
      if (sticker.format === 3) { // LOTTIE no soportado
        results.push({
          success: false,
          type: 'sticker',
          name: sticker.name,
          error: 'Stickers Lottie no soportados',
        });
        continue;
      }

      const stickerUrl = sticker.url;
      const name = customName || sticker.name;

      const createdSticker = await context.guild.stickers.create({
        file: stickerUrl,
        name: name.substring(0, 30),
        tags: sticker.tags || '🎉',
        description: sticker.description || 'Sticker robado',
      });

      results.push({
        success: true,
        type: 'sticker',
        name: createdSticker.name,
      });
    } catch (e) {
      results.push({
        success: false,
        type: 'sticker',
        name: sticker.name,
        error: e.message,
      });
    }
  }

  // Crear embed de resultados
  const successResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  let description = '';

  if (successResults.length > 0) {
    description += `**✅ Robados:**\n`;
    for (const r of successResults) {
      if (r.type === 'emoji') {
        description += `> ${r.emoji} \`${r.name}\`\n`;
      } else {
        description += `> 🎟️ Sticker: \`${r.name}\`\n`;
      }
    }
  }

  if (failedResults.length > 0) {
    description += `\n**❌ Fallidos:**\n`;
    for (const r of failedResults) {
      description += `> \`${r.name}\`: ${r.error}\n`;
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('╭────── ⋆ ⋅ STEAL ⋅ ⋆ ──────╮')
    .setDescription(description || 'No se procesó nada.')
    .setColor(successResults.length > 0 ? 0x57f287 : 0xed4245)
    .setFooter({ text: `Robados: ${successResults.length} | Fallidos: ${failedResults.length}` })
    .setTimestamp();

  if (isSlash) {
    await context.reply({ embeds: [embed] });
  } else {
    await context.reply({ embeds: [embed] });
  }
}

function parseEmojis(text) {
  const emojis = [];
  
  // Regex para emojis custom de Discord
  const emojiRegex = /<(a?):([a-zA-Z0-9_]+):(\d+)>/g;
  let match;
  
  while ((match = emojiRegex.exec(text)) !== null) {
    emojis.push({
      animated: match[1] === 'a',
      name: match[2],
      id: match[3],
    });
  }
  
  return emojis;
}

// ══════════════════════════════════════════
//  MESSAGE CREATE (PREFIX COMMANDS)
// ══════════════════════════════════════════

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'say':
      await cmdSay(message, args, message.reference ? await message.channel.messages.fetch(message.reference.messageId).catch(() => null) : null);
      break;
    case 'ping':
      await cmdPing(message);
      break;
    case 'stats':
      await cmdStats(message);
      break;
    case 'avatar':
      await cmdAvatar(message, args);
      break;
    case 'serverinfo':
      await cmdServerInfo(message);
      break;
    case 'userinfo':
      await cmdUserInfo(message, args);
      break;
    case 'clear':
      await cmdClear(message, args);
      break;
    case 'embed':
      await cmdEmbed(message, args);
      break;
    case 'ticketpanel':
      await cmdTicketPanel(message);
      break;
    case 'steal':
      await cmdSteal(message, args);
      break;
  }
});

// ══════════════════════════════════════════
//  CREAR TICKET (GUARDA EN JSON)
// ══════════════════════════════════════════

async function createManualTicket(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  const localData = loadLocalData();
  const existingTicket = Object.values(localData.tickets).find(
    t => t.user_id === user.id && t.status === 'open'
  );

  if (existingTicket) {
    return interaction.reply({
      content: `${EMOJIS.close} Ya tienes un ticket abierto: <#${existingTicket.channel_id}>`,
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channelName = `┊ticket-${user.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15)}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles
          ]
        },
        {
          id: ADMIN_ROLE_ID,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ],
    });

    const ticketId = generateId();
    localData.tickets[ticketId] = {
      id: ticketId,
      user_id: user.id,
      user_name: user.username,
      channel_id: channel.id,
      status: 'open',
      buy_used: false, // <-- Nuevo: controlar si se usó el botón comprar
      created_at: new Date().toISOString()
    };
    saveLocalData(localData);

    await fetchStats();

    const embed = new EmbedBuilder()
      .setTitle('╭─────── ⋆ ⋅ TICKET ⋅ ⋆ ───────╮')
      .setDescription(
        `\n${EMOJIS.crunchyroll} **¡Bienvenido ${user}!**\n\n` +
        `┊ ${EMOJIS.member} **Cliente:** ${user.tag}\n` +
        `┊ ${EMOJIS.ticket} **Ticket:** #${ticketStats.total}\n\n` +
        `*¿En qué podemos ayudarte hoy?*\n\n` +
        `> ${EMOJIS.shop} Describe tu consulta o\n` +
        `> presiona **Comprar** si deseas adquirir algo.\n\n` +
        `╰──────────────────────────╯`
      )
      .setColor(0xf47521)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `ID: ${ticketId} • Un staff te atenderá pronto` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_${ticketId}`)
        .setLabel('🛒 Comprar')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`closeticket_${ticketId}`)
        .setLabel('Cerrar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1489159633909059765')
    );

    await channel.send({ content: `${user} <@&${ADMIN_ROLE_ID}>`, embeds: [embed], components: [row] });

    await interaction.editReply({
      content: `${EMOJIS.shop} Ticket creado: ${channel}`
    });

  } catch (error) {
    console.error('Error creando ticket:', error);
    await interaction.editReply({
      content: `${EMOJIS.close} Error al crear el ticket.`
    });
  }
}

// ══════════════════════════════════════════
//  ÓRDENES WEB (GUARDA EN JSON)
// ══════════════════════════════════════════

async function handleNewOrder(order) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    const discordId = order.discord_id;
    const discordName = order.discord_name || (order.user_email ? order.user_email.split('@')[0] : 'cliente');

    const permissionOverwrites = [
      { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: ADMIN_ROLE_ID,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ];

    if (discordId) {
      try {
        const member = await guild.members.fetch(discordId);
        if (member) {
          permissionOverwrites.push({
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ],
          });
        }
      } catch (e) {
        console.error(`Miembro ${discordId} no encontrado`);
      }
    }

    const channelName = `┊orden-${discordName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15)}`;
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites,
    });

    const localData = loadLocalData();
    const orderId = order.id || generateId();
    localData.orders[orderId] = {
      id: orderId,
      original_id: order.id,
      discord_id: discordId,
      discord_name: discordName,
      items: order.items,
      total_usd: order.total_usd,
      channel_id: channel.id,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    saveLocalData(localData);

    await fetchStats();

    const itemsList = order.items
      .map(item => `┊ ${EMOJIS.shop} **${item.qty}x** ${item.name}`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setTitle('╭─────── ⋆ ⋅ ORDEN ⋅ ⋆ ───────╮')
      .setDescription(
        `\n${EMOJIS.crunchyroll} **Nueva orden recibida**\n\n` +
        `┊ ${EMOJIS.member} **Cliente**\n` +
        `┊ ${discordId ? `<@${discordId}>` : `\`${discordName}\``}\n\n` +
        `┊ ${EMOJIS.pay} **Total:** \`$${order.total_usd} USD\`\n\n` +
        `┊ ${EMOJIS.shopcart} **Productos**\n` +
        `${itemsList}\n\n` +
        `╰──────────────────────────╯\n\n` +
        `${EMOJIS.img1} **Stats**\n` +
        `┊ Totales: \`${orderStats.total}\` ・ Pendientes: \`${orderStats.pending}\`\n` +
        `┊ Pagadas: \`${orderStats.paid}\` ・ Canceladas: \`${orderStats.cancelled}\``
      )
      .setColor(0xf47521)
      .setThumbnail('https://cdn.discordapp.com/emojis/1489159640942907402.webp')
      .setFooter({ text: `ID: ${orderId}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_${orderId}`)
        .setLabel('Confirmar Pago')
        .setStyle(ButtonStyle.Success)
        .setEmoji('1489159640942907402'),
      new ButtonBuilder()
        .setCustomId(`cancel_${orderId}`)
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1489159633909059765'),
      new ButtonBuilder()
        .setCustomId(`stats_${orderId}`)
        .setLabel('Stats')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1489159628481892443')
    );

    await channel.send({ content: `<@&${ADMIN_ROLE_ID}>`, embeds: [embed], components: [row] });

  } catch (error) {
    console.error('Error handleNewOrder:', error);
  }
}

// ══════════════════════════════════════════
//  SINCRONIZAR CON SUPABASE
// ══════════════════════════════════════════

async function syncToSupabase(type, id, status) {
  const localData = loadLocalData();

  if (type === 'ticket' && localData.tickets[id]) {
    const ticket = localData.tickets[id];

    await supabase.from('tickets').insert({
      user_id: ticket.user_id,
      user_name: ticket.user_name,
      channel_id: ticket.channel_id,
      status: status,
      created_at: ticket.created_at,
      closed_at: new Date().toISOString()
    });

    delete localData.tickets[id];
    saveLocalData(localData);
    console.log(`✅ Ticket ${id} → Supabase`);
  }

  if (type === 'order' && localData.orders[id]) {
    const order = localData.orders[id];

    if (order.original_id) {
      await supabase
        .from('orders')
        .update({ status: status, discord_channel_id: order.channel_id })
        .eq('id', order.original_id);
    }

    delete localData.orders[id];
    saveLocalData(localData);
    console.log(`✅ Orden ${id} → Supabase`);
  }
}

// ══════════════════════════════════════════
//  INTERACCIONES
// ══════════════════════════════════════════

client.on('interactionCreate', async (interaction) => {
  // ─── Slash Commands ───
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    switch (commandName) {
      case 'say':
        await cmdSay(interaction, []);
        break;
      case 'ping':
        await cmdPing(interaction);
        break;
      case 'stats':
        await cmdStats(interaction);
        break;
      case 'avatar':
        await cmdAvatar(interaction, []);
        break;
      case 'serverinfo':
        await cmdServerInfo(interaction);
        break;
      case 'userinfo':
        await cmdUserInfo(interaction, []);
        break;
      case 'clear':
        await cmdClear(interaction, []);
        break;
      case 'embed':
        await cmdEmbed(interaction, []);
        break;
      case 'ticketpanel':
        await cmdTicketPanel(interaction);
        break;
      case 'steal':
        await cmdSteal(interaction, []);
        break;
    }
    return;
  }

  // ─── Buttons ───
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  if (customId === 'open_ticket') {
    await createManualTicket(interaction);
    return;
  }

  const [action, id] = customId.split('_');

  // ─── Botón Comprar (solo una vez) ───
  if (action === 'buy') {
    const localData = loadLocalData();
    const ticket = localData.tickets[id];

    // Verificar si ya se usó el botón
    if (ticket && ticket.buy_used) {
      return interaction.reply({
        content: `${EMOJIS.close} El botón de comprar ya fue usado en este ticket.`,
        ephemeral: true
      });
    }

    // Marcar como usado
    if (ticket) {
      ticket.status = 'buying';
      ticket.buy_used = true;
      saveLocalData(localData);
    }

    const embed = new EmbedBuilder()
      .setTitle('╭────── ⋆ ⋅ COMPRA ⋅ ⋆ ──────╮')
      .setDescription(
        `\n${EMOJIS.grocery} **${interaction.user} desea comprar**\n\n` +
        `┊ Por favor indica:\n` +
        `┊ • ¿Qué producto te interesa?\n` +
        `┊ • ¿Qué cantidad necesitas?\n\n` +
        `*Un staff te atenderá en breve.*\n` +
        `╰──────────────────────────╯`
      )
      .setColor(0x57f287)
      .setTimestamp();

    // Actualizar el mensaje original con el botón deshabilitado
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_${id}`)
        .setLabel('🛒 Comprar')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true), // <-- Deshabilitar
      new ButtonBuilder()
        .setCustomId(`closeticket_${id}`)
        .setLabel('Cerrar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1489159633909059765')
    );

    await interaction.update({ components: [row] });
    await interaction.followUp({ embeds: [embed] });
    return;
  }

  if (action === 'closeticket') {
    await syncToSupabase('ticket', id, 'closed');
    await fetchStats();
    await updatePresence();

    const embed = new EmbedBuilder()
      .setDescription(
        `${EMOJIS.close} **Ticket cerrado**\n\n` +
        `> Gracias por contactarnos.\n` +
        `> Eliminando canal en 5 segundos...`
      )
      .setColor(0xed4245);

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });

    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    return;
  }

  if (action === 'confirm') {
    await syncToSupabase('order', id, 'paid');
    await fetchStats();
    await updatePresence();

    const embed = new EmbedBuilder()
      .setTitle('╭────── ⋆ ⋅ PAGADO ⋅ ⋆ ──────╮')
      .setDescription(
        `\n${EMOJIS.pay} **Pago confirmado**\n\n` +
        `┊ Entrega los productos al cliente.\n` +
        `┊ Luego cierra este ticket.\n\n` +
        `${EMOJIS.img1} Pagadas totales: \`${orderStats.paid}\`\n` +
        `╰──────────────────────────╯`
      )
      .setColor(0x57f287)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close_${id}`)
        .setLabel('Cerrar Ticket')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1489159633909059765')
    );

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed], components: [row] });
    return;
  }

  if (action === 'cancel') {
    await syncToSupabase('order', id, 'cancelled');
    await fetchStats();
    await updatePresence();

    const embed = new EmbedBuilder()
      .setTitle('╭───── ⋆ ⋅ CANCELADO ⋅ ⋆ ─────╮')
      .setDescription(
        `\n${EMOJIS.close} **Orden cancelada**\n\n` +
        `> Eliminando canal en 8 segundos...\n` +
        `╰──────────────────────────╯`
      )
      .setColor(0xed4245)
      .setTimestamp();

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });

    setTimeout(() => interaction.channel.delete().catch(() => {}), 8000);
    return;
  }

  if (action === 'close') {
    const embed = new EmbedBuilder()
      .setDescription(`${EMOJIS.close} **Eliminando canal...**`)
      .setColor(0x2b2d31);

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });

    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    return;
  }

  if (action === 'stats') {
    await cmdStats(interaction);
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);