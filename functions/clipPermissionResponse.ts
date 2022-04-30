import fs from 'fs'
import YAML from 'yaml'
import { MessageActionRow, MessageButton, MessageEmbed, Client, ButtonInteraction, Message, TextChannel } from 'discord.js'

import { newCustomId, readCustomId } from './common'
import { getFullUrl } from './providers'

const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))

export async function clipPermissionResponse (interaction: ButtonInteraction, Client: Client): Promise<void | Error> {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'RP') return
  const gdClipId = interaction.message.id

  if (interactionData.clipAuthorDiscordId !== interaction.user.id) {
    interaction.user.send('Você não é o autor do clipe e por conta disso não pode autorizar ou negar sua postagem no YouTube!').catch(console.error)
    return new Error(`User ${interaction.user.id} is not the clip author of ${gdClipId}!`)
  }

  if (interactionData.clipProvider !== 'outplayed') throw new Error('Unknown clip provider!')

  if (!(interaction.message instanceof Message)) throw new Error('Invalid interaction message!')
  await interaction.message.delete().catch(console.error)

  if (interactionData.clipAuthorResponse !== 'Y') return

  const embed = new MessageEmbed()
    .setTitle(`Um novo clipe de ${interaction.user.username} aguarda aprovação!`)
    .addField('Autor:', `${interaction.user}`, true)
    .addField('Clipe:', `[Clique aqui para ver](${getFullUrl(interactionData.clipProvider, interactionData.clipId)})`, true)
    // TODO: .setDescription(`O clipe deve atender pelo menos os itens abaixo para ser autorizado por você:\n${getRequirementsString(config['REQUIREMENTS'])}`)
    .setFooter({ text: `Novo clipe de ${interaction.user.username} no ${interactionData.clipProvider.toUpperCase()}.` })

  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Aprovar clipe épico!')
        .setStyle('SUCCESS')
        .setCustomId(newCustomId({
          type: 'MP',
          gdClipId: gdClipId,
          clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
          clipProvider: interactionData.clipProvider,
          clipId: interactionData.clipId,
          modResponse: 'Y',
          clipCategory: 'EPIC'
        })),
      new MessageButton()
        .setLabel('Aprovar clipe engraçado!')
        .setStyle('SUCCESS')
        .setCustomId(newCustomId({
          type: 'MP',
          gdClipId: gdClipId,
          clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
          clipProvider: interactionData.clipProvider,
          clipId: interactionData.clipId,
          modResponse: 'Y',
          clipCategory: 'FUNNY'
        })),
      new MessageButton()
        .setLabel('Negar clipe!')
        .setStyle('DANGER')
        .setCustomId(newCustomId({
          type: 'MP',
          gdClipId: gdClipId,
          clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
          clipProvider: interactionData.clipProvider,
          clipId: interactionData.clipId,
          modResponse: 'N',
          clipCategory: 'TRASH'
        })),
      new MessageButton()
        .setLabel('Enviar mensagem para autor!')
        .setStyle('PRIMARY')
        .setCustomId(newCustomId({
          type: 'MRQSAM',
          status: 'STB',
          gdClipId: gdClipId,
          clipAuthorDiscordId: interactionData.clipAuthorDiscordId
        }))
    )

  const modChannel = Client.channels.cache.get(config['CLIPS-MODERATION-CHANNEL-ID'])
  if (!modChannel) throw new Error('Invalid moderation channel!')
  if (!(modChannel instanceof TextChannel)) throw new Error('Invalid moderation channel (No TextChannel)!')
  await modChannel.send({
    content: `<DELETE@&${config['MODERATION-ROLE-ID']}>`,
    embeds: [embed],
    components: [actionRow]
  }).catch(console.error)
  await interaction.user
    .send(`Olá ${interaction.user.username}, seu clipe foi para a analise do Grupo Disparate!\nEm breve você recebera uma confirmação se ele será ou nao postado no YouTube.\nID do clipe: ${gdClipId}\nLink do clipe: ${getFullUrl(interactionData.clipProvider, interactionData.clipId)}`)
    .catch(console.error)
}
