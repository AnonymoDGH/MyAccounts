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
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY // Usamos la Service Key para tener permisos de escritura en la DB desde el bot
);

// Configuración de Express (API para recibir peticiones de la web)
const app = express();
app.use(cors());
app.use(express.json());

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
});

// Endpoint que la página web llamará cuando el usuario le dé a "Secure Checkout"
app.post('/api/checkout', async (req, res) => {
  try {
    const { userId, userEmail, items, totalUsd } = req.body;

    if (!userId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Faltan datos en la petición' });
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
      return res.status(500).json({ error: 'No se encontró el servidor de Discord' });
    }

    // 1. Crear el canal (Ticket) en la categoría especificada
    const channelName = `ticket-${userEmail ? userEmail.split('@')[0] : userId.substring(0, 6)}`;
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel], // Oculto para todos por defecto
        },
        // Aquí podrías añadir permisos para que los administradores vean el canal
      ],
    });

    // 2. Crear el Embed con los detalles del pedido
    const itemsList = items.map(item => `• **${item.qty}x** ${item.name}`).join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle('🛒 Nuevo Pedido Creado')
      .setDescription(`Un usuario ha iniciado un proceso de compra.\n\n**👤 Usuario:** ${userEmail || userId}\n**💰 Total a pagar:** $${totalUsd} USD\n\n**📦 Productos:**\n${itemsList}`)
      .setColor('#2ecc71')
      .setFooter({ text: `Order ID: ${userId.substring(0, 8)}` })
      .setTimestamp();

    // 3. Crear los botones
    const confirmBtn = new ButtonBuilder()
      .setCustomId(`confirm_${userId}`)
      .setLabel('Finalizar y Registrar Pago')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const cancelBtn = new ButtonBuilder()
      .setCustomId(`cancel_${userId}`)
      .setLabel('Cancelar Petición')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('✖️');

    const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

    // 4. Enviar el mensaje al nuevo canal
    await channel.send({ embeds: [embed], components: [row] });

    // 5. Registrar el pedido en la base de datos como "pendiente"
    const { error } = await supabase
      .from('orders')
      .insert([
        { 
          user_id: userId, 
          items: items, 
          total_usd: totalUsd, 
          status: 'pending',
          discord_channel_id: channel.id 
        }
      ]);

    if (error) {
      console.error('Error guardando en Supabase:', error);
    }

    // 6. Devolver la URL del canal a la página web
    const channelUrl = `https://discord.com/channels/${GUILD_ID}/${channel.id}`;
    res.json({ success: true, ticketUrl: channelUrl });

  } catch (error) {
    console.error('Error en el checkout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Manejar los clics en los botones del Embed
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const [action, userId] = interaction.customId.split('_');

  if (action === 'confirm') {
    // Actualizar el estado en la base de datos a "pagado"
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('discord_channel_id', interaction.channelId);

    const embed = new EmbedBuilder()
      .setTitle('✅ Pago Confirmado')
      .setDescription('El pago ha sido registrado en la base de datos. Por favor, procede a entregar las cuentas al cliente.')
      .setColor('#3498db');

    await interaction.update({ components: [] }); // Quitar los botones para que no se puedan volver a pulsar
    await interaction.followUp({ embeds: [embed] });
  } 
  else if (action === 'cancel') {
    // Actualizar el estado en la base de datos a "cancelado"
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('discord_channel_id', interaction.channelId);

    const embed = new EmbedBuilder()
      .setTitle('❌ Pedido Cancelado')
      .setDescription('Esta petición de compra ha sido cancelada.')
      .setColor('#e74c3c');

    await interaction.update({ components: [] });
    await interaction.followUp({ embeds: [embed] });
    
    // Opcional: Borrar el canal después de 10 segundos
    setTimeout(() => {
      interaction.channel.delete().catch(console.error);
    }, 10000);
  }
});

// Iniciar el servidor Express
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 API del Bot escuchando en el puerto ${PORT}`);
});

// Iniciar sesión en Discord
client.login(process.env.DISCORD_TOKEN);
