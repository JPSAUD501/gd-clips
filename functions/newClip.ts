import { ColorResolvable, MessageActionRow, MessageButton, MessageEmbed, Message } from 'discord.js'
import { falseAuthorshipReply } from './checks/clipAuthorship'
import { getClipObject, saveClipObject, getClipObjectId } from './clipObject'
import { newCustomId } from './common'
import { getUrlData } from './providers'
import { config } from '../constants'

export async function newClip (message: Message, url: string): Promise<void> {
  const embedLoading = new MessageEmbed()
    .setTitle('Carregando...')

  const msgReply = await message.reply({ embeds: [embedLoading] }).catch(console.error)

  const clipObjectId = getClipObjectId(url)
  if (clipObjectId instanceof Error) throw clipObjectId
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return console.error(clipObject.message)
  if (!msgReply) return console.error(`Could not send message reply to ${message.author.username} in clips channel.`)
  if (clipObject.postedOnClipsChannel) {
    const embedAlreadyPosted = new MessageEmbed()
      .setTitle('Este clipe já foi postado nesse canal!')
      .setDescription('Sua mensagem sera apagada por conta disso mas você ainda pode optar por enviar esse video para o Instagram e YouTube respondendo a pergunta acima caso ainda não tenha optado por isso.')
    const msgReplyAlreadyPosted = await message.reply({ embeds: [embedAlreadyPosted] }).catch(console.error)
    if (!msgReplyAlreadyPosted) return console.error(`Could not send message reply to ${message.author.username} in clips channel.`)
    setTimeout(() => {
      message.delete().catch(console.error)
    }, 5000)
    setTimeout(() => {
      msgReplyAlreadyPosted.delete().catch(console.error)
    }, config['MAX-TIME-TO-OPT-TO-POST-ON-INTERNET'] * 1000)
  }
  const savedClipObject = saveClipObject({
    ...clipObject,
    postedOnClipsChannel: true,
    clipsChannelPostDate: new Date().toISOString()
  })
  if (savedClipObject instanceof Error) return console.error(savedClipObject.message)
  if (clipObject.authorDiscordId !== message.author.id) return await falseAuthorshipReply(message, msgReply, clipObject)

  const alreadyOptedToPostOnInternetReply = async () => {
    const embedAlreadyOptedToPostOnInternet = new MessageEmbed()
      .setTitle('Você já optou por postar esse clipe no YouTube e Instagram!')
    await msgReply.edit({ embeds: [embedAlreadyOptedToPostOnInternet] }).catch(console.error)
    setTimeout(() => {
      msgReply.delete().catch()
    }, config['MAX-TIME-TO-OPT-TO-POST-ON-INTERNET'] * 1000)
  }
  if (clipObject.postOnInternetResponse === true) return alreadyOptedToPostOnInternetReply()

  const urlData = getUrlData(url)
  const embedReply = new MessageEmbed()
    .setColor(`${urlData.providerColor}` as ColorResolvable)
    .setTitle(`${message.author.username} você deseja que esse seu clipe apareça no Instagram e canal do YouTube do Grupo Disparate?`)
    .addField('Autor:', `${message.author}`, true)
    .addField('Clipe:', `[Clique aqui para ver](${clipObject.url})`, true)
    .setFooter({ text: `Novo clipe de ${message.author.username} no ${urlData.provider.toUpperCase()}.` })

  const actionRow = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('SIM')
        .setStyle('SUCCESS')
        .setCustomId(newCustomId({
          type: 'RP',
          clipObjectId: clipObject.objectId,
          clipAuthorDiscordId: String(message.author.id),
          clipAuthorResponse: 'Y'
        })),
      new MessageButton()
        .setLabel('NÃO')
        .setStyle('DANGER')
        .setCustomId(newCustomId({
          type: 'RP',
          clipObjectId: clipObject.objectId,
          clipAuthorDiscordId: String(message.author.id),
          clipAuthorResponse: 'N'
        }))
    )

  const msgQuestion = await msgReply.edit({ embeds: [embedReply], components: [actionRow] }).catch(console.error)
  if (!msgQuestion) return console.error(`Could not send message question to ${message.author.username} in clips channel.`)
  setTimeout(() => {
    msgQuestion.delete().catch(console.error)
  }, config['MAX-TIME-TO-OPT-TO-POST-ON-INTERNET'] * 1000)
}
