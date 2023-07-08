import { commands } from '../client.js'
import messages from '../messages.js'

commands['embed'] = async function(interaction) {    
    const content = interaction.options?.get('content')?.value || ''
    const title = interaction.options.get('title').value 
    const description = interaction.options.get('description').value

    interaction.channel.send({
        content,
        embeds: [messages.useful.embedBuilder(title, description)]
    })

    interaction.reply({
        content: `Embed foi enviado!`,
        ephemeral: true
    })
}