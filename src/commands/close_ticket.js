import mysql from '../mysql.js'
import config from '../config.js'
const bot_table = config.ticket.table
import { TextChannel } from 'discord.js'
import { setTimeout } from 'timers/promises'
import client, { commands,buttons } from '../client.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

commands['close_ticket'] = async function (interaction) {
    const channel = interaction.channel

    await interaction.reply({
        content: 'Ticket será encerrado em 5 segundo(s)'
    })
    
    for (let index = 4; index >= 0; index--) {
        await setTimeout(1000)

        if (index > 0 ) {
            interaction.editReply({
                content: `Ticket será encerrado em ${index} segundo(s)`
            })
        } else if (channel instanceof TextChannel) {
            channel.delete()
        }        
    }
}

commands['request_close'] = async function (interaction) {
    const channel = interaction.channel
    const member = await interaction.guild.members.fetch(interaction.member.id)
    const is_staff = member.roles.cache.has(config.ticket.staff)

    const [[ticket]] = await mysql.query(`SELECT channel_id, discord_id FROM ${bot_table} WHERE channel_id = ?`, [channel.id])

    if (!ticket) {
        return await interaction.reply({
            content: 'Você não está em um ticket.',
            ephemeral: true
        })
    }

    if (!is_staff) {
        return await interaction.reply({
            content: 'Você não pode fechar o ticket, peça para a equipe de administração finalizar o atendimento.',
            ephemeral: true
        })
    }
    
    interaction.reply({
        embeds: [{
            title: 'Finalizar atendimento',
            color: 0x2f3136,
            fields: [{
                name: 'Atenção',
                value: 'Após o ticket ser finalizado o canal será deletado, realmente deseja finalizar o atendimento?'
            }],
            timestamp: new Date().toISOString(),
            footer: { iconURL: client.user.avatarURL(), text: client.user.username },
        }],
        components: [new ActionRowBuilder()
            .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setStyle(ButtonStyle.Danger)
                .setLabel('Fechar')
        )],
        ephemeral: true
    })
}

buttons['request_close'] = commands['request_close']
buttons['close_ticket'] = commands['close_ticket']