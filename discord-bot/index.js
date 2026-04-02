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
  PermissionsBitField 
} = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY // Usamos la Service Key para tener permisos de escritura y saltar RLS
);

// Configuración del Bot de Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel],
});

const GUILD_ID = '1458518569061974100';
const CATEGORY_ID = '1489151772311289918';

client.on('ready', () => {
  console.log(`🤖 Bot conectado exitosamente como ${client.user.tag}`);

  // Suscribirse a nuevos pedidos en la base de datos usando Supabase Realtime
  supabase
    .channel('custom-insert-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      async (payload) => {
        console.log('🔔 Nuevo pedido detectado en la DB:', payload.new.id);
        await handleNewOrder(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('📡 Escuchando nuevos pedidos en tiempo real...');
      }
    });
});

async function handleNewOrder(order) {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      return console.error('❌ No se encontró el servidor de Discord');
    }

    // 1. Crear el canal (Ticket)
    const channelName = `ticket-${order.user_email ? order.user_email.split('@')[0] : order.user_id.substring(0, 6)}`;
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel], // Oculto para todos por defecto
        },
      ],
    });

    // 2. Crear el Embed con los detalles
    const itemsList = order.items.map(item => `• **${item.qty}x** ${item.name}`).join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle('🛒 Nuevo Pedido Creado')
      .setDescription(`Un usuario ha iniciado un proceso de compra.\n\n**👤 Usuario:** ${order.user_email || order.user_id}\n**💰 Total a pagar:** $${order.total_usd} USD\n\n**📦 Productos:**\n${itemsList}`)
      .setColor('#2ecc71')
      .setFooter({ text: `Order ID: ${order.id}` })
      .setTimestamp();

    // 3. Crear los botones
    const confirmBtn = new ButtonBuilder()
      .setCustomId(`confirm_${order.id}`)
      .setLabel('Finalizar y Registrar Pago')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`cancel_${order.id}`)
      .setLabel('Cancelar Petición')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('✖️');

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

    // 4. Enviar el mensaje al canal
    await channel.send({ embeds: [embed], components: [row] });

    // 5. Actualizar la base de datos con el ID del canal para que la web lo sepa
    const { error } = await supabase
      .from('orders')
      .update({ discord_channel_id: channel.id })
      .eq('id', order.id);

    if (error) {
      console.error('❌ Error actualizando el canal en Supabase:', error);
    } else {
      console.log(`✅ Ticket creado exitosamente para la orden ${order.id}`);
    }

  } catch (error) {
    console.error('❌ Error procesando la orden:', error);
  }
}

// Manejar los clics en los botones del Embed
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, orderId] = interaction.customId.split('_');

  if (action === 'confirm') {
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId);

    const embed = new EmbedBuilder()
      .setTitle('✅ Pago Confirmado')
      .setDescription('El pago ha sido registrado en la base de datos. Por favor, procede a entregar las cuentas al cliente.')
      .setColor('#3498db');

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });
  } 
  else if (action === 'cancel') {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    const embed = new EmbedBuilder()
      .setTitle('❌ Pedido Cancelado')
      .setDescription('Esta petición de compra ha sido cancelada.')
      .setColor('#e74c3c');

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });
    
    setTimeout(() => {
      interaction.channel.delete().catch(console.error);
    }, 10000);
  }
});

// Iniciar sesión en Discord
client.login(process.env.DISCORD_TOKEN);
