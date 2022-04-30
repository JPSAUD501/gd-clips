
import { newCustomId, readCustomId } from './common'
import { Client, ButtonInteraction, Message, MessageEmbed, MessageButton, MessageActionRow, TextChannel } from 'discord.js'
import { getFullUrl } from './providers'
import { IClipData } from '../interfaces'
import { processClip } from './processClip'
import YAML from 'yaml'
import fs from 'fs'
const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))

export async function clipApprovalResponse (interaction: ButtonInteraction, Client: Client): Promise<void | Error> {
  const interactionData = readCustomId(interaction.customId)
  if (interactionData.type !== 'MP') return
  const clipAuthor = await Client.users.fetch(interactionData.clipAuthorDiscordId).catch(console.error)
  if (!clipAuthor) return console.error(`Could not find discord user with id ${interactionData.clipAuthorDiscordId}`)
  const noApproval = async () => {
    await clipAuthor.send(`Olá ${clipAuthor.username}, seu clipe (ID: ${interactionData.gdClipId}) não será postado no YouTube pois ele foi negado pela equipe de moderação!`).catch(console.error)
    if (!(interaction.message instanceof Message)) return new Error('Invalid interaction message!')
    const embed = new MessageEmbed()
      .setTitle(`O clipe de ${clipAuthor.username} foi negado com sucesso por "${interaction.user.username}"!`)
      .addField('Autor:', `${clipAuthor.username}`, true)
      .addField('Clipe:', `[Clique aqui para ver](${getFullUrl(interactionData.clipProvider, interactionData.clipId)})`, true)
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
  }

  if (interactionData.modResponse === 'N') return noApproval()

  await clipAuthor.send(`Olá ${clipAuthor.username}, seu clipe (ID: ${interactionData.gdClipId}) passou na analise da moderação do GD! Agora nosso BOT irá fazer os procedimentos de download e edição!`).catch(console.error)
  if (!(interaction.message instanceof Message)) return new Error('Invalid interaction message!')
  const embed = new MessageEmbed()
    .setTitle(`O clipe de ${clipAuthor.username} foi autorizado com sucesso por "${interaction.user.username}"!`)
    .addField('Autor:', `${clipAuthor.username}`, true)
    .addField('Clipe:', `[Clique aqui para ver](${getFullUrl(interactionData.clipProvider, interactionData.clipId)})`, true)
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

  const msgReply = await interaction.reply({ content: 'Ok! Iniciando processo de download e edição do clipe...', fetchReply: true, ephemeral: false }).catch(console.error)
  if (msgReply) {
    if (!(msgReply instanceof Message)) return new Error('Invalid msgReply!')
  } else console.log(new Error('msgReply is null!'))

  setTimeout(async () => {
    if (msgReply) await msgReply.delete().catch(console.error)
  }, 10000)

  const clipData: IClipData = {
    gdClipId: interactionData.gdClipId,
    clipCategory: interactionData.clipCategory,
    clipAuthorDiscordId: interactionData.clipAuthorDiscordId,
    clipProvider: interactionData.clipProvider,
    clipId: interactionData.clipId,
    clipDate: new Date().toJSON()
  }

  // TODO: Sendo video to queue
  const savedClip = await processClip(clipData, Client)
  if (savedClip instanceof Error) {
    console.error(savedClip.message)
    const logChannel = Client.channels.cache.get(config['BOT-LOG-CHANNEL-ID'])
    if (!logChannel) return new Error(`Could not find log channel with id ${config['BOT-LOG-CHANNEL-ID']}`)
    if (!(logChannel instanceof TextChannel)) return new Error('Log channel is not a text channel!')
    logChannel.send(`Erro ao salvar clipe (ID: ${interactionData.gdClipId}): ${savedClip.message}`).catch(console.error)
    clipAuthor.send(`Ocorreu um erro ao salvar seu clipe (ID: ${interactionData.gdClipId}). Nossa equipe de moderação ja está sabendo do ocorrido e possivelmente você ira receber atualizações em breve.`).catch(console.error)
  }
  // TODO: Post on YouTube NON LISTED (postClip())
}
