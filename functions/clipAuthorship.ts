import { Message, MessageEmbed } from 'discord.js'
import { IClipObject } from '../interfaces'

export async function falseAuthorshipReply (message: Message, messageReply: Message, clipObject: IClipObject): Promise<void> {
  const authorUser = await messageReply.client.users.fetch(clipObject.authorDiscordId).catch(console.error)
  if (!authorUser) return console.error(`User ${clipObject.authorDiscordId} not found.`)
  const clipFalseAuthorshipEmbed = new MessageEmbed()
    .setTitle(`${message.author.username} você parece não ser o autor desse clipe!`)
    .addField('Autor registrado:', `${authorUser.username}`, true)
    .addField('Registrado em:', `${new Date(clipObject.firstApearDate).toLocaleString()}`, true)
    .setDescription('Em breve será possível fazer uma contestação de autoria do clipe.') // TODO: Add clip authorship contestation

  const falseAuthorshipReplyMessage = await messageReply.edit({ embeds: [clipFalseAuthorshipEmbed], components: [] }).catch(console.error)
  if (!falseAuthorshipReplyMessage) return console.error(`Could not send false authorship message to ${message.author.username}.`)
  setTimeout(() => {
    message.delete().catch(console.error)
  }, 5000)
  setTimeout(() => {
    falseAuthorshipReplyMessage?.delete().catch(console.error)
  }, 30000)
}
