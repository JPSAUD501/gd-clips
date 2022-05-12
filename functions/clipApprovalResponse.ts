
import { newCustomId, readCustomId } from './common'
import { ButtonInteraction, Message, MessageEmbed, MessageButton, MessageActionRow, TextChannel } from 'discord.js'
import { addToQueue } from './clipProcessQueue'
import { client, config } from '../constants'
import { getClipObject, updateClipObject } from './clipObject'

export async function clipApprovalResponse (interaction: ButtonInteraction): Promise<void | Error> {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'MP') return
  const replyMessage = await interaction.reply({
    embeds: [
      new MessageEmbed()
        .setTitle(`Carregando ação de "${interaction.user.username}"...`)
    ],
    fetchReply: true
  }).catch(console.error)
  if (!replyMessage) return new Error('Could not reply to message!')
  if (!(replyMessage instanceof Message)) return new Error('Invalid replyMessage!')
  const clipSharer = await client.users.fetch(interactionData.clipSharerDiscordId).catch(console.error)
  if (!clipSharer) return console.error(`Could not find discord user with id ${interactionData.clipSharerDiscordId}`)
  const clipObject = getClipObject(interactionData.clipObjectId)
  if (clipObject instanceof Error) return clipObject
  const noApproval = async () => {
    await clipSharer.send({
      embeds: [
        new MessageEmbed()
          .setTitle('Seu clipe não passou na analise da moderação do GD!')
          .setDescription(`Olá ${clipSharer.username}, seu clipe não será postado no YouTube pois ele foi negado pela equipe de moderação!`)
          .addField('Clipe ID', `${interactionData.clipObjectId}`)
      ]
    })
    if (!(interaction.message instanceof Message)) return new Error('Invalid interaction message!')
    const embed = new MessageEmbed()
      .setTitle(`O clipe de ${clipSharer.username} foi negado com sucesso por "${interaction.user.username}"!`)
      .addField('Compartilhado por:', `${clipSharer.username}`, true)
      .addField('Clipe:', `[Clique aqui para ver](${clipObject.url})`, true)
      .addField('ID:', `${interactionData.clipObjectId}`, true)
      .setDescription('Caso queira enviar ao compartilhador o motivo da negativa do clipe, clique no botão verde abaixo!')
      .setFooter({ text: `Clipe negado de ${clipSharer.username} do ${clipObject.provider.toUpperCase()}.` })
    const actionRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setLabel('Enviar motivo da negativa!')
          .setStyle('PRIMARY')
          .setCustomId(newCustomId({
            type: 'MRQSAM',
            status: 'D',
            clipSharerDiscordId: interactionData.clipSharerDiscordId,
            clipObjectId: interactionData.clipObjectId
          })))
    await interaction.message.edit({
      embeds: [embed],
      components: [actionRow]
    }).catch(console.error)
    await replyMessage.delete().catch(console.error)
  }

  if (interactionData.modResponse === 'N') return noApproval()

  await clipSharer.send({
    embeds: [
      new MessageEmbed()
        .setTitle('Seu clipe passou na analise da moderação do GD!')
        .setDescription(`Olá ${clipSharer.username}, seu clipe passou na analise da moderação do GD! Agora nosso BOT irá fazer os procedimentos de download, edição e postagem!`)
        .addField('Clipe ID', `${interactionData.clipObjectId}`)
    ]
  })
  if (!(interaction.message instanceof Message)) return new Error('Invalid interaction message!')
  const embed = new MessageEmbed()
    .setTitle(`O clipe de ${clipSharer.username} foi autorizado com sucesso por "${interaction.user.username}"!`)
    .addField('Compartilhado por:', `${clipSharer.username}`, true)
    .addField('Clipe:', `[Clique aqui para ver](${clipObject.url})`, true)
    .addField('Categoria:', `${interactionData.clipCategory}`, true)
    .addField('ID:', `${interactionData.clipObjectId}`, true)
    .setDescription('Caso queira enviar ao compartilhador uma atualização especial, clique no botão verde abaixo!')
    .setFooter({ text: `Clipe de ${clipSharer.username} no ${clipObject.provider.toUpperCase()}.` })
  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Enviar atualização!')
        .setStyle('PRIMARY')
        .setCustomId(newCustomId({
          type: 'MRQSAM',
          status: 'A',
          clipSharerDiscordId: interactionData.clipSharerDiscordId,
          clipObjectId: interactionData.clipObjectId
        })))
  await interaction.message.edit({
    embeds: [embed],
    components: [actionRow]
  }).catch(console.error)

  replyMessage.edit({
    embeds: [
      new MessageEmbed()
        .setTitle(`O clipe de ${clipSharer.username} foi autorizado com sucesso por "${interaction.user.username}"!`)
        .addField('CLipe ID:', `${interactionData.clipObjectId}`, true)
        .setDescription('Ok! Iniciando processamento do clipe.')
    ]
  }).catch(console.error)

  const logMessageChannel = client.channels.cache.get(config['LOG-MESSAGE-CHANNEL-ID'])
  if (!logMessageChannel) return new Error('Could not find log message channel!')
  if (!(logMessageChannel instanceof TextChannel)) return new Error('Invalid logMessageChannel!')
  const logMessage = await logMessageChannel.send({
    embeds: [
      new MessageEmbed()
        .setTitle('Carregando...')
    ]
  }).catch(console.error)

  if (!logMessage) return new Error('Could not send log message!')
  const clipObjectCategory = updateClipObject(interactionData.clipObjectId, {
    category: interactionData.clipCategory
  })
  if (clipObjectCategory instanceof Error) return clipObjectCategory
  const addedToQueue = addToQueue(
    interactionData.clipObjectId,
    clipObject.url,
    logMessage,
    clipSharer,
    undefined
  )
  if (addedToQueue instanceof Error) return addedToQueue
}
