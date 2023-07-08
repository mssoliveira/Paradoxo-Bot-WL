import { AutocompleteInteraction, ButtonInteraction, Client, CommandInteraction, SelectMenuInteraction, ApplicationCommandOptionType, ActivityType, DMChannel } from 'discord.js'

const client = new Client({
    intents: [
        "GuildMessages",
        "DirectMessages",
        "Guilds",
        "GuildBans",
        "GuildMessages",
        "GuildMembers",
        "GuildIntegrations",
        "MessageContent",
        "GuildScheduledEvents",
    ]
})

export default client
export const commands = {}
export const selects = {}
export const buttons = {}
export const autocompletes = {}

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) {
        if (commands[interaction.commandName]) {
            commands[interaction.commandName](interaction)
        }
    } else if (interaction.isSelectMenu()) {
        if (selects[interaction.customId]) {
            selects[interaction.customId](interaction)
        }
    } else if (interaction.isButton()) {
        if (buttons[interaction.customId]) {
            buttons[interaction.customId](interaction)
        }
    } else if (interaction.isAutocomplete()) {
        if (autocompletes[interaction.commandName]) {
            autocompletes[interaction.commandName](interaction)
        }
    }
})

client.on('ready', async () => {
    client.application.commands.set([
        {
            name: 'ticket',
            description: 'enviar mensagem para abrir ticket',
            defaultMemberPermissions: 'Administrator',
            dmPermission: false
        },{
            name: 'whitelist',
            description: 'enviar mensagem para iniciar a whitelist',
            defaultMemberPermissions: 'Administrator',
            dmPermission: false
        },{
            name: 'embed',
            description: 'envie um embed com uma mensagem em um canal',
            defaultMemberPermissions: 'Administrator',
            options: [
                { description: 'Titulo do Embed', name: 'title', type: ApplicationCommandOptionType.String, required: true },
                { description: 'Descrição do Embed', name: 'description', type: ApplicationCommandOptionType.String, required: true },
                { description: 'Conteudo da mensagem', name: 'content', type: ApplicationCommandOptionType.String },
            ],
            dmPermission: false
        }
    ])

    client.user.setPresence({
        activities: [{ name: 'www.creative-rp.com', type: ActivityType.Watching }],
        status: 'online'
    })
})

process.on('uncaughtException', err => console.error(err))
client.login(process.env.TOKEN)