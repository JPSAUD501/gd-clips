
import { newCustomId, readCustomId, saveClipData } from './common'
import { ButtonInteraction, Message, MessageEmbed, MessageButton, MessageActionRow } from 'discord.js'
import { getFullUrl } from './providers'
import { IClipData } from '../interfaces'
import { addToQueue } from './clipProcessQueue'
import { client } from '../constants'

export async function clipApprovalResponse (interaction: ButtonInteraction): Promise<void | Error> {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'MP') return
  const logMessage = await interaction.reply({
    embeds: [
      new MessageEmbed()
        .setTitle(`Carregando ação de "${interaction.user.username}"...`)
    ],
    fetchReply: true
  }).catch(console.error)
  if (!logMessage) return new Error('Could not reply to message!')
  if (!(logMessage instanceof Message)) return new Error('Invalid logMessage!')
  const clipAuthor = await client.users.fetch(interactionData.clipAuthorDiscordId).catch(console.error)
  if (!clipAuthor) return console.error(`Could not find discord user with id ${interactionData.clipAuthorDiscordId}`)
  const noApproval = async () => {
    await clipAuthor.send(`Olá ${clipAuthor.username}, seu clipe (ID: ${interactionData.gdClipId}) não será postado no YouTube pois ele foi negado pela equipe de moderação!`).catch(console.error)
    if (!(interaction.message instanceof Message)) return new Error('Invalid interaction message!')
    const embed = new MessageEmbed()
      .setTitle(`O clipe de ${clipAuthor.username} foi negado com sucesso por "${interaction.user.username}"!`)
      .addField('Autor:', `${clipAuthor.username}`, true)
      .addField('Clipe:', `[Clique aqui para ver](${getFullUrl(interactionData.clipProvider, interactionData.clipProviderId)})`, true)
      .addField('ID:', `${interactionData.gdClipId}`, true)
      .setDescription('Caso queira enviar ao autor o motivo da negativa do clipe, clique no botão verde abaixo!')
      .setFooter({ text: `Clipe negado de ${clipAuthor.username} do ${interactionData.clipProvider.toUpperCase()}.` })
    const actionRow = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setLabel('Enviar motivo da negativa!')
          .setStyle('PRIMARY')
          .setCustomId(newCustomId({
            type: 'MRQSAM',
            status: 'D',
            clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
            gdClipId: interactionData.gdClipId
          })))
    await interaction.message.edit({
      embeds: [embed],
      components: [actionRow]
    }).catch(console.error)
    await logMessage.delete().catch(console.error)
  }

  if (interactionData.modResponse === 'N') return noApproval()

  await clipAuthor.send(`Olá ${clipAuthor.username}, seu clipe (ID: ${interactionData.gdClipId}) passou na analise da moderação do GD! Agora nosso BOT irá fazer os procedimentos de download e edição!`).catch(console.error)
  if (!(interaction.message instanceof Message)) return new Error('Invalid interaction message!')
  const embed = new MessageEmbed()
    .setTitle(`O clipe de ${clipAuthor.username} foi autorizado com sucesso por "${interaction.user.username}"!`)
    .addField('Autor:', `${clipAuthor.username}`, true)
    .addField('Clipe:', `[Clique aqui para ver](${getFullUrl(interactionData.clipProvider, interactionData.clipProviderId)})`, true)
    .addField('Categoria:', `${interactionData.clipCategory}`, true)
    .addField('ID:', `${interactionData.gdClipId}`, true)
    .setDescription('Caso queira enviar ao autor uma atualização especial, clique no botão verde abaixo!')
    .setFooter({ text: `Clipe de ${clipAuthor.username} no ${interactionData.clipProvider.toUpperCase()}.` })
  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('Enviar atualização!')
        .setStyle('PRIMARY')
        .setCustomId(newCustomId({
          type: 'MRQSAM',
          status: 'A',
          clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
          gdClipId: interactionData.gdClipId
        })))
  await interaction.message.edit({
    embeds: [embed],
    components: [actionRow]
  }).catch(console.error)

  await logMessage.edit({
    embeds: [
      new MessageEmbed()
        .setTitle(`O clipe de ${clipAuthor.username} foi autorizado com sucesso por "${interaction.user.username}"!`)
        .setDescription('Ok! Iniciando processamento do clipe...')
    ]
  }).catch(console.error)

  const clipData: IClipData = {
    gdClipId: interactionData.gdClipId,
    clipCategory: interactionData.clipCategory,
    clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
    clipProvider: interactionData.clipProvider,
    clipProviderId: interactionData.clipProviderId,
    clipDate: new Date().toJSON()
  }
  const save = saveClipData(clipData)
  if (save instanceof Error) return save
  const addedToQueue = addToQueue(interactionData.gdClipId, logMessage, clipAuthor, undefined)
  if (addedToQueue instanceof Error) return addedToQueue
}
