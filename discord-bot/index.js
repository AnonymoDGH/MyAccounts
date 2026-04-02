require('dotenv').config();
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
  ActivityType
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
  ],
  partials: [Partials.Channel],
});

const GUILD_ID = '1458518569061974100';
const CATEGORY_ID = '1489151772311289918';

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
};

let orderStats = {
  total: 0,
  pending: 0,
  paid: 0,
  cancelled: 0
};

async function fetchOrderStats() {
  const { data: allOrders } = await supabase
    .from('orders')
    .select('status');

  if (allOrders) {
    orderStats.total = allOrders.length;
    orderStats.pending = allOrders.filter(o => o.status === 'pending').length;
    orderStats.paid = allOrders.filter(o => o.status === 'paid').length;
    orderStats.cancelled = allOrders.filter(o => o.status === 'cancelled').length;
  }
}

async function updatePresence() {
  await fetchOrderStats();

  const statusMessages = [
    { type: ActivityType.Watching, name: `${orderStats.total} órdenes totales` },
    { type: ActivityType.Playing, name: `${orderStats.pending} órdenes pendientes` },
    { type: ActivityType.Watching, name: `${orderStats.paid} pagos confirmados` },
  ];

  const current = statusMessages[Math.floor(Date.now() / 15000) % statusMessages.length];

  client.user.setPresence({
    activities: [{
      name: current.name,
      type: current.type,
    }],
    status: orderStats.pending > 0 ? 'dnd' : 'online',
  });
}

client.on('ready', async () => {
  console.log(`Bot conectado como ${client.user.tag}`);

  await updatePresence();
  setInterval(updatePresence, 15000);

  supabase
    .channel('custom-insert-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      async (payload) => {
        await handleNewOrder(payload.new);
        await updatePresence();
      }
    )
    .subscribe();
});

async function handleNewOrder(order) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return;

    await fetchOrderStats();

    const discordId = order.discord_id;
    const discordName = order.discord_name || (order.user_email ? order.user_email.split('@')[0] : 'cliente');

    const permissionOverwrites = [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ];

    // Si tenemos el ID de Discord del usuario, le damos permiso para ver y escribir en el ticket
    if (discordId) {
      permissionOverwrites.push({
        id: discordId,
        allow: [
          PermissionsBitField.Flags.ViewChannel, 
          PermissionsBitField.Flags.SendMessages, 
          PermissionsBitField.Flags.ReadMessageHistory
        ],
      });
    }

    const channelName = `┊ticket-${discordName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15)}`;
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: permissionOverwrites,
    });

    const itemsList = order.items
      .map(item => `> ${EMOJIS.shop} **${item.qty}x** \`${item.name}\``)
      .join('\n');

    const divider = '─'.repeat(32);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'NUEVO PEDIDO RECIBIDO',
        iconURL: 'https://cdn.discordapp.com/emojis/1489159643199574136.webp',
      })
      .setDescription(
        `${EMOJIS.grocery} **Se ha generado una nueva orden de compra.**\n\n` +
        `${divider}\n\n` +
        `${EMOJIS.member} **Cliente**\n` +
        `> ${discordId ? `<@${discordId}> (\`${discordName}\`)` : `\`${discordName}\``}\n\n` +
        `${EMOJIS.pay} **Total**\n` +
        `> \`$${order.total_usd} USD\`\n\n` +
        `${EMOJIS.shopcart} **Productos**\n${itemsList}\n\n` +
        `${divider}\n\n` +
        `${EMOJIS.img1} **Estadísticas Globales**\n` +
        `> ${EMOJIS.cart} Totales: \`${orderStats.total}\`\n` +
        `> ${EMOJIS.booster} Pendientes: \`${orderStats.pending}\`\n` +
        `> ${EMOJIS.pay} Pagadas: \`${orderStats.paid}\`\n` +
        `> ${EMOJIS.close} Canceladas: \`${orderStats.cancelled}\``
      )
      .setColor(0x2b2d31)
      .setFooter({ text: `ID: ${order.id}  •  Orden #${orderStats.total}` })
      .setTimestamp()
      .setThumbnail('https://cdn.discordapp.com/emojis/1489159640942907402.webp');

    const confirmBtn = new ButtonBuilder()
      .setCustomId(`confirm_${order.id}`)
      .setLabel('Confirmar Pago')
      .setStyle(ButtonStyle.Success)
      .setEmoji('1489159640942907402');

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`cancel_${order.id}`)
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('1489159633909059765');

    const statsBtn = new ButtonBuilder()
      .setCustomId(`stats_${order.id}`)
      .setLabel('Ver Stats')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('1489159628481892443');

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn, statsBtn);

    await channel.send({ embeds: [embed], components: [row] });

    await supabase
      .from('orders')
      .update({ discord_channel_id: channel.id })
      .eq('id', order.id);

  } catch (error) {
    console.error(error);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, orderId] = interaction.customId.split('_');

  if (action === 'confirm') {
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    await fetchOrderStats();
    await updatePresence();

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'PAGO CONFIRMADO',
        iconURL: 'https://cdn.discordapp.com/emojis/1489159640942907402.webp',
      })
      .setDescription(
        `${EMOJIS.pay} **El pago ha sido registrado correctamente.**\n\n` +
        `> Procede a entregar los productos al cliente.\n` +
        `> Una vez entregado, puedes cerrar este ticket.\n\n` +
        `${EMOJIS.img1} Total pagadas hasta ahora: \`${orderStats.paid}\``
      )
      .setColor(0x57f287)
      .setTimestamp();

    const closeBtn = new ButtonBuilder()
      .setCustomId(`close_${orderId}`)
      .setLabel('Cerrar Ticket')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('1489159633909059765');

    const row = new ActionRowBuilder().addComponents(closeBtn);

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed], components: [row] });
  }
  else if (action === 'cancel') {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    await fetchOrderStats();
    await updatePresence();

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'PEDIDO CANCELADO',
        iconURL: 'https://cdn.discordapp.com/emojis/1489159633909059765.webp',
      })
      .setDescription(
        `${EMOJIS.close} **Esta orden ha sido cancelada.**\n\n` +
        `> El canal se eliminará en unos segundos.`
      )
      .setColor(0xed4245)
      .setTimestamp();

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 8000);
  }
  else if (action === 'close') {
    const embed = new EmbedBuilder()
      .setDescription(`${EMOJIS.close} **Ticket cerrado.** Eliminando canal...`)
      .setColor(0x2b2d31);

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }
  else if (action === 'stats') {
    await fetchOrderStats();

    const divider = '─'.repeat(32);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'ESTADÍSTICAS DE ÓRDENES',
        iconURL: 'https://cdn.discordapp.com/emojis/1489159628481892443.webp',
      })
      .setDescription(
        `${EMOJIS.grocery} **Resumen global actualizado**\n\n` +
        `${divider}\n\n` +
        `> ${EMOJIS.cart} **Órdenes Totales:** \`${orderStats.total}\`\n` +
        `> ${EMOJIS.booster} **Pendientes:** \`${orderStats.pending}\`\n` +
        `> ${EMOJIS.pay} **Pagadas:** \`${orderStats.paid}\`\n` +
        `> ${EMOJIS.close} **Canceladas:** \`${orderStats.cancelled}\`\n\n` +
        `${divider}\n\n` +
        `> ${EMOJIS.img2} Tasa de éxito: \`${orderStats.total > 0 ? ((orderStats.paid / orderStats.total) * 100).toFixed(1) : 0}%\``
      )
      .setColor(0x5865f2)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);