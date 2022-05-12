import { Message, MessageEmbed } from 'discord.js'
import { IClipObject } from '../../interfaces'

export async function falseSharerAuthorshipReply (message: Message, messageReply: Message, clipObject: IClipObject): Promise<void> {
  const sharerUser = await messageReply.client.users.fetch(clipObject.sharerDiscordId).catch(console.error)
  if (!sharerUser) return console.error(`User ${clipObject.sharerDiscordId} not found.`)
  const clipFalseSharerAuthorshipEmbed = new MessageEmbed()
    .setTitle(`${message.author.username} você parece não ser o autor desse clipe!`)
    .addField('Autor registrado:', `${sharerUser.username}`, true)
    .addField('Registrado em:', `${new Date(clipObject.firstApearDate).toLocaleString()}`, true)
    .setDescription('Infelizmente você não pode autorizar a postagem dele na internet por conta disso. Em breve será possível fazer uma contestação de autoria do clipe.') // TODO: Add clip authorship contestation

  await messageReply.edit({ embeds: [clipFalseSharerAuthorshipEmbed], components: [] }).catch(console.error)
  setTimeout(() => {
    messageReply.delete().catch(console.error)
  }, 30000)
}
