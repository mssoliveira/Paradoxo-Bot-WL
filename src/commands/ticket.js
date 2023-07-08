import mysql from '../mysql.js'
import config from '../config.js'
import messages from '../messages.js'
const bot_table = config.ticket.table
import client, { selects,commands } from '../client.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } from 'discord.js'

selects['create_ticket'] = async function(interaction) {
    interaction.message.edit({
        components: interaction.message.components
    })

    const ticket = interaction.values[0]
    const [[ticket_created]] = await mysql.query(`SELECT * FROM ${bot_table} WHERE discord_id = ? AND is_finished = 0 AND type = 'ticket' `, [interaction.member.id])
    if (ticket_created) {
        return interaction.reply({
            content: `Você ja possui um ticket criado: <#${ticket_created.channel_id}>`,
            ephemeral: true
        })
    }
    
    await interaction.reply({
        content: `Só um momentinho, estamos criado seu ticket...`,
        ephemeral: true
    })

    const channel = await createTicket(
        ticket,
        config.ticket.category,
        interaction.member
    )
    
    await interaction.editReply({
        content: `Ticket criado: <#${channel.id}>`,
        ephemeral: true
    })
}
    
async function createTicket(topic, category, member) {
    const [ticket] = await mysql.query(`INSERT INTO ${bot_table}(discord_id, type) VALUES(?, ?)`, [member.id, 'ticket'])
    const staff = config.ticket.staff
    const guild = member.guild
        
    const channel = await guild.channels.create({
        name: config.ticket.prefix + '-' + ticket.insertId.toString().padStart(4,'0'),
        parent: category,
        topic,
        reason: 'Criando ticket de atendimento',

        permissionOverwrites: [
            {
                id: member.id,
                allow: ['ViewChannel','SendMessages']
            },

            {
                id: guild.roles.everyone.id,
                deny: [ 'ViewChannel']
            },

            {
                id: staff,
                allow: ['ViewChannel','SendMessages']
            },
        ]
    })
    
    await mysql.query(`UPDATE ${bot_table} SET channel_id = ? WHERE id = ?`, [channel.id, ticket.insertId])

    channel.send({
        embeds: [messages.ticket.openMessage(topic)],
        components: [messages.ticket.closeButton()]
    })
    return channel
}

commands['ticket'] = async function(interaction) {
    interaction.channel.send({
        embeds: [messages.ticket.defaultMessage],
        components: [messages.ticket.createTicketButton()]
    })
    interaction.reply({ content: 'Mensagem de criação de ticket foi enviada!', ephemeral: true })
}