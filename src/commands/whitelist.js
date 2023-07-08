const usersCache = {}
import mysql from '../mysql.js'
import config from '../config.js'
import messages from '../messages.js'
const bot_table = config.ticket.table
import client, { buttons, commands } from '../client.js'
import { ActionRowBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js'

commands['whitelist'] = async function(interaction) {    
    interaction.channel.send({
        embeds: [messages.whitelist.defaultMessage],
        components: [messages.whitelist.buttonCreateWhitelist]
    })
    interaction.reply({ content: 'Sistema criado.', ephemeral: true })
}

buttons['create_whitelist'] = async function(interaction) {
    interaction.message.edit({
        components: interaction.message.components
    })

    if (!config.whitelist.WhitelistIsOpen) {
        return interaction.reply(messages.whitelist.whitelistClosed)
    }

    if (Object.keys(usersCache).length >= config.whitelist.simultaneousWhitelist) {
        return interaction.reply(messages.whitelist.rateLimit)
    }

    const [[waiting_result]] = await mysql.query(`SELECT 1 FROM ${bot_table} WHERE discord_id = ? AND is_finished = 0 AND type = 'whitelist' `, [interaction.member.id])
    if (waiting_result) {
        return interaction.reply(messages.whitelist.waitResult)
    }
    
    await interaction.reply({
        content: 'Preparando formulario',
        ephemeral: true
    })

    const channel = await createWhitelist(
        config.whitelist.category,
        interaction.member
    )

    await interaction.editReply({
        content: `Formulario pronto para ser iniciado: <#${channel.id}>`,
        ephemeral: true
    })
}

async function createWhitelist(category, member) {
    const [whitelist] = await mysql.query(`INSERT INTO ${bot_table}(discord_id, type) VALUES(?, ?)`, [member.id, 'whitelist'])
    const guild = member.guild
    
    const channel = await guild.channels.create(messages.whitelist.createChannel(whitelist.insertId.toString().padStart(4,'0'), category, guild, member ))
    
    await mysql.query(`UPDATE ${bot_table} SET channel_id = ? WHERE id = ?`, [channel.id, whitelist.insertId])

    channel.send(messages.whitelist.initWhitelist(client, member))

    usersCache[member.id] = { firstTimeout: createFirstTimeout(channel, member) } 
    return channel
}

buttons['init_whitelist'] = async function(interaction) {
    clearTimeout(usersCache[interaction.member.id]?.firstTimeout)

    usersCache[interaction.member.id] = { quest: 0, timeout: createTimeout(config.whitelist.questions[0].time, interaction), answers: [] }
    const questNumber = usersCache[interaction.member.id].quest
    const question = config.whitelist.questions[questNumber]

    if (question) {
        interaction.reply({ content: `Aguarde, as perguntas estão sendo preparadas...` })

        setTimeout(() => {
            interaction.deleteReply()

            interaction.message.edit({
                content: `<@${interaction.member.id}>`,
                embeds: [messages.whitelist.questionBuilder(client,question)],
                components: [messages.whitelist.createButton('answer_quest', 'Responder pergunta', ButtonStyle.Success)]
            })
        }, 2000)
    }
}

buttons['answer_quest'] = async function(interaction) {
    let questNumber = usersCache[interaction.member.id].quest
    let question = config.whitelist.questions[questNumber]

    if (questNumber != null) {
        let [modal, modelQuestion] = messages.whitelist.createTextInput(question)
        let modelQuestionRow = new ActionRowBuilder().addComponents(modelQuestion)

        modal.addComponents(modelQuestionRow)
        await interaction.showModal(modal)
        const result = await interaction.awaitModalSubmit({ time: question.time * 60000 })
        if (result && usersCache[interaction.member.id].quest == questNumber) {
            clearTimeout(usersCache[interaction.member.id]?.timeout)

            if (!question.history) {
                usersCache[interaction.member.id].answers.push({ name: question.question, value: result.fields.getTextInputValue(`question-${question.id}`) })
            } else {
                usersCache[interaction.member.id].history = result.fields.getTextInputValue(`question-${question.id}`)
            }

            if (config.whitelist.questions[questNumber+1]) {
                usersCache[interaction.member.id].timeout = createTimeout(question.time, interaction)
                usersCache[interaction.member.id].quest++
                questNumber = usersCache[interaction.member.id].quest
                question = config.whitelist.questions[questNumber]

                result.reply({ content: 'Resposta coletada, estou preparando a proxima pergunta!' })
                result.deleteReply()

                interaction.editReply({
                    content: `<@${interaction.member.id}>`,
                    embeds: [messages.whitelist.questionBuilder(client, question)],
                    components: [messages.whitelist.createButton('answer_quest', 'Responder pergunta', ButtonStyle.Success)]
                })
                
            } else {
                await interaction.message.edit({ 
                    content: `<@${interaction.member.id}>`,
                    embeds: [messages.whitelist.finished],
                    components: []
                })

                result.reply({ content: 'Canal será encerrado dentro de 10 segundos', ephemeral: true })

                const guild = interaction.member.guild
                await guild.channels.fetch(config.whitelist.channel).then(async channel => {
                    const content = usersCache[interaction.member.id].history
                    const file = new AttachmentBuilder(Buffer.from(content), { name:'history.txt'})
                    
                    await interaction.member.roles.add(config.whitelist.waiting_role).catch(() => console.log(`Não tenho permissões para alterar os cargos do usuário ${interaction.member.id}`))
                    await channel.send({
                        content: `Formulario de <@${interaction.member.id}>`,
                        embeds: [messages.whitelist.formBody(usersCache[interaction.member.id], interaction.member.id)],
                        components: [
                            messages.whitelist.createResultButtons(interaction.member.id)
                        ],
                        files: [file]
                    })
                })

                setTimeout(() => {
                    interaction.channel.delete()
                    delete(usersCache[interaction.member.id])
                }, 10000)
            }
        }
    } else {
        await interaction.message.delete()
        await interaction.reply({ content: 'Houve um erro, inicie sua whitelist novamente', ephemeral: true })

        setTimeout(() => {
            interaction.channel.delete()
            cancelWhitelist(interaction.member.id)
        }, 3000)
    }
}

client.on('interactionCreate', async interaction => {
    const buttonValue = interaction.customId
    
    if (interaction.isButton() && (buttonValue.startsWith('approve-') || buttonValue.startsWith('fail-'))) {
        const guild = interaction.guild
        const discord_id = buttonValue.startsWith('approve-') ? buttonValue.replace('approve-', '') : buttonValue.replace('fail-', '')
        
        const staff = await guild.members.fetch(interaction.member.id).catch(() => {})
        const is_staff = staff.roles.cache.has(config.whitelist.staff)
        if (!is_staff) {
            return interaction.reply({
                content: 'Você não possui permissão!',
                ephemeral: true
            })
        }
        
        const channel = await guild.channels.fetch(config.whitelist.result).catch(() => {})
        if (channel != config.whitelist.result) {
            interaction.reply({
                content: 'Não foi possivel encontrar o canal para enviar os resultados da whitelist!',
                ephemeral: true,
            })
        }
        
        const [[whitelist]] = await mysql.query(`SELECT id, is_finished FROM ${bot_table} WHERE type = 'whitelist' AND discord_id = ?`, [discord_id])
        const [[whitelistAwait]] = await mysql.query(`SELECT 1, is_finished FROM ${bot_table} WHERE type = 'whitelist' AND discord_id = ? AND is_finished = 0`, [discord_id])
        if (whitelist?.is_finished && !whitelistAwait) {
            return interaction.reply({
                content: 'Whitelist deste usuário ja foi lida!',
                ephemeral: true,
            })
        }
        
        const member = await guild.members.fetch(discord_id).catch(() => {})
        if (!whitelist || !member) {
            interaction.message.delete()
            return interaction.reply({
                content: 'Usuário não se encontra disponivel, whitelist foi desconsiderada!',
                ephemeral: true
            })
        }
        
        const newEmbed = interaction.message.embeds[0]
        if (buttonValue.startsWith('approve-')) {
            channel.send({
                content: `<@${member.id}>`,
                embeds: [messages.whitelist.approveMessage]
            })

            interaction.message.edit({
                embeds: [
                    {
                        title: 'Whitelist foi aprovada!',
                        description: newEmbed.description,
                        fields: newEmbed.fields,
                        color: newEmbed.color,
                        footer: { text: `Usuário aprovado(a) por: ${interaction.member.user.username}#${interaction.member.user.discriminator}` },
                        timestamp: new Date().toISOString()
                    }
                ],
                components: []
            })
            
            member.roles.add(config.whitelist.approved_role)
            member.roles.remove(config.whitelist.waiting_role).catch(() => {})
            await mysql.query(`UPDATE ${bot_table} SET is_finished = 1 WHERE id = ?`, [whitelist.id])

            interaction.reply({
                content: 'Whitelist aprovada com sucesso!',
                ephemeral: true
            })
        } else if (buttonValue.startsWith('fail-')) {
            member.roles.remove(config.whitelist.waiting_role).catch(() => {})

            channel.send({
                content: `<@${member.id}>`,
                embeds: [messages.whitelist.failMessage]
            })

            interaction.message.edit({
                embeds: [
                    {
                        title: 'Whitelist foi reprovada!',
                        description: newEmbed.description,
                        fields: newEmbed.fields,
                        color: newEmbed.color,
                        footer: { text: `Usuário reprovado(a) por: ${interaction.member.user.username}#${interaction.member.user.discriminator}` },
                        timestamp: new Date().toISOString()
                    }
                ],
                components: []
            })

            await mysql.query(`DELETE FROM ${bot_table} WHERE id = ?`, [whitelist.id])
            interaction.reply({
                content: 'Whitelist reprovada com sucesso!',
                ephemeral: true
            })
        }
    }
})

function createTimeout(time, interaction) {
    return setTimeout(async () => {
        const guild = interaction.member.guild
        guild.channels.fetch(interaction.channel.id).then(channel => {
            interaction.message.edit({
                embeds: [messages.whitelist.timeout],
                components: []
            })

            setTimeout(() => {
                channel.delete()
            }, 15000)
        })
        cancelWhitelist(interaction.member.id)
    }, 60000 * time)
}

function createFirstTimeout(channel, member) {
    return setTimeout(async () => {
        const guild = member.guild
        guild.channels.fetch(channel.id).then(channel => {
            channel.delete()
            cancelWhitelist(member.id)
        }, () => {})
    }, 60000 * 3)
}

async function cancelWhitelist(member_id) {
    delete(usersCache[member_id])
    const [whitelist] = await mysql.query(`SELECT * FROM ${bot_table} WHERE type = 'whitelist' AND is_finished = 0 AND discord_id = ?`, [member_id])
    if (whitelist) {
        await mysql.query(`DELETE FROM ${bot_table} WHERE id = ?`, [whitelist.id])
    }
}