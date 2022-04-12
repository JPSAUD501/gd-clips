import { ColorResolvable, MessageActionRow, MessageButton, MessageEmbed, Message } from 'discord.js'
import { newCustomId } from './common'
import { getProviderBaseUrl, getVideoData, isValidUrl } from './providers'

export async function newClipMessage (message: Message): Promise<void> {
  if (!isValidUrl(message.content)) return
  const videoData = getVideoData(message.content)

  const embed = new MessageEmbed()
    .setColor(`${videoData.providerColor}` as ColorResolvable)
    .setTitle(`${message.author.username} você deseja que esse seu clipe apareça no canal do YouTube do Grupo Disparate?`)
    .addField('Autor:', `${message.author}`, true)
    .addField('Clipe:', `[Clique aqui para ver](${getProviderBaseUrl(videoData.provider)}${videoData.id})`, true)
    .setFooter({ text: `Novo clipe de ${message.author.username} no ${videoData.provider.toUpperCase()}.` })

  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('SIM')
        .setStyle('SUCCESS')
        .setCustomId(newCustomId({
          type: 'RP',
          clipAuthorDiscordId: String(message.author.id),
          clipProvider: videoData.provider,
          clipId: videoData.id,
          clipAuthorResponse: 'Y'
        })),
      new MessageButton()
        .setLabel('NÃO')
        .setStyle('DANGER')
        .setCustomId(newCustomId({
          type: 'RP',
          clipAuthorDiscordId: String(message.author.id),
          clipProvider: videoData.provider,
          clipId: videoData.id,
          clipAuthorResponse: 'N'
        }))
    )

  await message.reply({ embeds: [embed], components: [actionRow] })
}
