import mysql from '../mysql.js'
import client from '../client.js'
import config from '../config.js'
import messages from '../messages.js'
const bot_table = config.ticket.table

client.on('guildMemberAdd', async (member) => {
    const welcome_channel = await client.channels.fetch(config.channels.welcome_channel).catch(() => {})
    if (welcome_channel) {
        welcome_channel.send({ 
            content: `<@${member.id}>`,
            embeds: [messages.useful.welcomeMessage]
        })
    }
})

client.on('guildMemberRemove', async (member) => {
    const guild = member.guild
    const table = config.liberation.table
    const column = config.liberation.column
    const exit_channel = await client.channels.fetch(config.channels.exit_channel).catch(() => {})
    if (exit_channel) {
        exit_channel.send({ 
            content: `<@${member.id}>`,
            embeds: [messages.useful.exitMessage(member)]
        })

        const [[ticket]] = await mysql.query(`SELECT * FROM ${bot_table} WHERE discord_id = ? AND is_finished = 0 AND type = 'ticket'`, [member.id])
        if (ticket) {
            guild.channels.delete(ticket.channel_id).catch(() => {})
        }
        
        if (table && column) {
            await mysql.query(`UPDATE ${table} SET ${column} = '0' WHERE discord = ?`, [member.id]).catch(() => {})
        }
    }
})

client.on('messageCreate', async (message) => {
    if (message.channel.id == config.liberation.rename) {
        const value = message.content.split(' ')

        if (!value.length < 3) {
            const member = await message.guild.members.fetch(value[0]).catch(() => {})
            if (member) {
                member.setNickname(`${value[1]} ${value[2]}`)
            }
        }
    }

    if (message.channel.id == config.liberation.channelRole) {
        const value = message.content.split(' ')

        if (!value.length < 3) {
            const member = await message.guild.members.fetch(value[0]).catch(() => {})
            if (member) {
                if (value[2] == 'Adicionar') {
                    member.roles.add(value[1]).catch(() => {})
                } else if (value[2] == 'Remover') {
                    member.roles.remove(value[1]).catch(() => {})
                }
            }
        }
    }

    if (message.channel.id == config.liberation.channel) {
        const id = Number(message.content.split(' ')[0])
        const member = await message.guild.members.fetch(message.author.id).catch(() => {})

        if (!member.user.bot) {
            if (id && id > 0) {
                const table = config.liberation.table
                const column = config.liberation.column
                const identifier = config.liberation.identifier
                
                message.delete()

                member.roles.add(config.liberation.addRole)
                member.roles.remove(config.liberation.removeRole)

                await mysql.query(`UPDATE ${table} SET ${column} = '1', discord = ${message.author.id} WHERE ${identifier} = ?`, [id]).catch(() => {})
            } else {
                message.delete()
                return message.channel.send({
                    content: `<@${message.author.id}>`,
                    embeds: [messages.useful.failLiberation]
                }).then(msg => { setTimeout(() => msg.delete(), 3000) }).catch(() => {})
            }
        }
    }
})

client.on('channelDelete', async (channel) => {
    const [[ticket]] = await mysql.query(`SELECT id FROM ${bot_table} WHERE channel_id = ? AND is_finished = 0 AND type = 'ticket'`, [channel.id])
    if (ticket) {
        await mysql.query(`DELETE FROM ${bot_table} WHERE channel_id = ? AND is_finished = 0`, [channel.id])
    }

    const [[whitelist]] = await mysql.query(`SELECT id FROM ${bot_table} WHERE channel_id = ? AND is_finished = 0 AND type = 'whitelist'`, [channel.id])
    if (whitelist) {
        await mysql.query(`DELETE FROM ${bot_table} WHERE channel_id = ? AND is_finished = 0`, [channel.id])
    }
})