import { MessageActionRow, MessageButton, MessageEmbed, ButtonInteraction, Message, TextChannel } from 'discord.js'
import { newCustomId, readCustomId } from './common'
import { getClipObject, updateClipObject } from './clipObject'
import { client, config } from '../constants'
import { isValidProvider } from './providers'

export async function clipPermissionResponse (interaction: ButtonInteraction): Promise<void | Error> {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'RP') return
  const clipObjectId = interactionData.clipObjectId

  if (interactionData.clipSharerDiscordId !== interaction.user.id) {
    interaction.user.send({
      embeds: [
        new MessageEmbed()
          .setTitle('Você não é o autor do clipe!')
          .setDescription('Por conta disso não pode autorizar ou negar sua postagem no YouTube!')
      ]
    }).catch(console.error)
    return new Error(`User ${interaction.user.id} is not the clip sharer of ${clipObjectId}!`)
  }

  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) throw clipObject

  if (!isValidProvider(clipObject.provider)) throw new Error('Unknown clip provider!')

  if (!(interaction.message instanceof Message)) throw new Error('Invalid interaction message!')
  await interaction.message.delete().catch(console.error)

  if (interactionData.clipSharerResponse !== 'Y') return

  const savedClipObject = updateClipObject(clipObjectId, {
    postOnInternetResponse: true
  })
  if (savedClipObject instanceof Error) return savedClipObject

  const embed = new MessageEmbed()
    .setTitle(`Um novo clipe de ${interaction.user.username} aguarda aprovação!`)
    .addField('Autor:', `${interaction.user}`, true)
    .addField('Clipe:', `[Clique aqui para ver](${clipObject.url})`, true)
    .addField('Verifique se o clipe atende a todos os requisitos:', config['CLIP-REQUIREMENTS'].join('\n'))
    .setFooter({ text: `Novo clipe de ${interaction.user.username} no ${clipObject.provider.toUpperCase()}.` })

  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Aprovar clipe épico!')
        .setStyle('SUCCESS')
        .setCustomId(newCustomId({
          type: 'MP',
          clipObjectId: clipObjectId,
          clipSharerDiscordId: interactionData.clipSharerDiscordId,
          modResponse: 'Y',
          clipCategory: 'EPIC'
        })),
      new MessageButton()
        .setLabel('Aprovar clipe engraçado!')
        .setStyle('SUCCESS')
        .setCustomId(newCustomId({
          type: 'MP',
          clipObjectId: clipObjectId,
          clipSharerDiscordId: interactionData.clipSharerDiscordId,
          modResponse: 'Y',
          clipCategory: 'FUNNY'
        })),
      new MessageButton()
        .setLabel('Negar clipe!')
        .setStyle('DANGER')
        .setCustomId(newCustomId({
          type: 'MP',
          clipObjectId: clipObjectId,
          clipSharerDiscordId: interactionData.clipSharerDiscordId,
          modResponse: 'N',
          clipCategory: 'TRASH'
        })),
      new MessageButton()
        .setLabel('Enviar mensagem para autor!')
        .setStyle('PRIMARY')
        .setCustomId(newCustomId({
          type: 'MRQSAM',
          status: 'STB',
          clipObjectId: clipObjectId,
          clipSharerDiscordId: interactionData.clipSharerDiscordId
        }))
    )

  const modChannel = client.channels.cache.get(config['CLIPS-MODERATION-CHANNEL-ID'])
  if (!modChannel) throw new Error('Invalid moderation channel!')
  if (!(modChannel instanceof TextChannel)) throw new Error('Invalid moderation channel (No TextChannel)!')
  await modChannel.send({
    content: `<@&${config['MODERATION-ROLE-ID']}>`,
    embeds: [embed],
    components: [actionRow]
  }).catch(console.error)
  await interaction.user.send({
    embeds: [
      new MessageEmbed()
        .setTitle('Clipe enviado para analise!')
        .setDescription(`Olá ${interaction.user.username}, seu clipe foi para a analise do Grupo Disparate!\nEm breve você recebera uma confirmação se ele será ou nao postado no YouTube e Instagram.`)
        .addField('ID do clipe:', clipObjectId)
        .addField('Link do clipe:', clipObject.url)
    ]
  }).catch(console.error)
}
