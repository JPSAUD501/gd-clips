import { ColorResolvable, MessageActionRow, MessageButton, MessageEmbed, Message } from 'discord.js'
import { falseSharerAuthorshipReply } from './checks/clipSharerAuthorship'
import { getClipObject, getClipObjectId, updateClipObject } from './clipObject'
import { newCustomId } from './common'
import { getUrlData } from './providers'
import { config } from '../constants'

export async function newClip (message: Message, url: string): Promise<void> {
  // Loading
  const embedLoading = new MessageEmbed()
    .setTitle('Carregando...')

  const msgReply = await message.reply({ embeds: [embedLoading] }).catch(console.error)
  if (!msgReply) return console.error(`Could not send message reply to ${message.author.username} in clips channel.`)

  const clipObjectId = await getClipObjectId(url)
  if (clipObjectId instanceof Error) throw clipObjectId
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return console.error(clipObject.message)

  // Discord clips info
  if (clipObject.provider === 'discord') {
    const embedDiscordInfo = new MessageEmbed()
      .setTitle('Atenção!')
      .setDescription('Infelizmente nosso sistema de autoria de clipe e de exclusão de duplicatas não se aplica aos videos hospedados no Discord! O Grupo Disparate usa e recomenda o Outplayed como aplicativo para salvar suas melhores jogadas!')
    const msgDiscordInfo = await message.reply({ embeds: [embedDiscordInfo] }).catch(console.error)
    if (!msgDiscordInfo) return console.error(`Could not send message reply to ${message.author.username} in clips channel.`)
    setTimeout(() => {
      msgDiscordInfo.delete().catch(console.error)
    }, config['MAX-TIME-INFO-MSG'] * 1000)
  }

  // Already posted in Discord channel
  if (clipObject.postedOnClipsChannel) {
    const embedAlreadyPosted = new MessageEmbed()
      .setTitle('Este clipe já foi postado nesse canal!')
      .setDescription('Sua mensagem sera apagada por conta disso mas você ainda pode optar por enviar esse video para o Instagram e YouTube respondendo a pergunta acima caso não tenha optado por isso antes.')
    const msgReplyAlreadyPosted = await message.reply({ embeds: [embedAlreadyPosted] }).catch(console.error)
    if (!msgReplyAlreadyPosted) return console.error(`Could not send message reply to ${message.author.username} in clips channel.`)
    setTimeout(() => {
      message.delete().catch(console.error)
    }, 5000)
    setTimeout(() => {
      msgReplyAlreadyPosted.delete().catch(console.error)
    }, config['MAX-TIME-INFO-MSG'] * 1000)
  }

  // New clip in clips Discord Channel (Save)
  const savedPostedOnClips = updateClipObject(clipObjectId, {
    postedOnClipsChannel: true,
    clipsChannelPostDate: new Date().toISOString()
  })
  if (savedPostedOnClips instanceof Error) return console.error(savedPostedOnClips.message)

  // Authorship check
  if (
    (clipObject.authorshipSystem) &&
    (clipObject.sharerDiscordId !== message.author.id)
  ) return await falseSharerAuthorshipReply(message, msgReply, clipObject)

  // Already opt to post on Internet
  const alreadyOptedToPostOnInternetReply = async () => {
    const embedAlreadyOptedToPostOnInternet = new MessageEmbed()
      .setTitle('A opção de postar esse clipe no YouTube e Instagram já foi selecionada!')
    await msgReply.edit({ embeds: [embedAlreadyOptedToPostOnInternet] }).catch(console.error)
    setTimeout(() => {
      msgReply.delete().catch()
    }, config['MAX-TIME-INFO-MSG'] * 1000)
  }
  if (clipObject.postOnInternetResponse === true) return await alreadyOptedToPostOnInternetReply()

  // Time before last question is too short
  const tryAgainLaterReply = async () => {
    const embedTryAgainLater = new MessageEmbed()
      .setTitle('Parece que um membro já está escolhendo uma opção para esse clipe!')
      .setDescription('Tente novamente mais tarde.')
    await msgReply.edit({ embeds: [embedTryAgainLater] }).catch(console.error)
    setTimeout(() => {
      msgReply.delete().catch()
    }, config['MAX-TIME-INFO-MSG'] * 1000)
  }
  const postOnInternetQuestionDatePlusMaxTimeToChoose = clipObject.postOnInternetQuestionDate
    ? new Date(
      (
        (new Date(clipObject.postOnInternetQuestionDate).getTime()) +
        ((config['MAX-TIME-TO-OPT-TO-POST-ON-INTERNET'] * 1000) * 1.25)
      )
    ).getTime()
    : undefined
  if (
    clipObject.postOnInternetQuestionDate &&
    postOnInternetQuestionDatePlusMaxTimeToChoose &&
    new Date().getTime() <= postOnInternetQuestionDatePlusMaxTimeToChoose
  ) return await tryAgainLaterReply()

  // Update clipObject to the last sharer
  const savedClipObject = updateClipObject(clipObjectId, {
    sharerDiscordId: message.author.id,
    sharerDiscordName: message.author.username,
    postOnInternetQuestionDate: new Date().toJSON()
  })
  if (savedClipObject instanceof Error) return console.error(savedClipObject.message)

  // Question to post on Internet
  const urlData = await getUrlData(url)
  const embedReply = new MessageEmbed()
    .setColor(`${urlData.providerColor}` as ColorResolvable)
    .setTitle(`${message.author.username} você deseja que esse seu clipe apareça no Instagram e canal do YouTube do Grupo Disparate?`)
    .addField('Compartilhado por:', `${message.author}`, true)
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
          clipSharerDiscordId: String(message.author.id),
          clipSharerResponse: 'Y'
        })),
      new MessageButton()
        .setLabel('NÃO')
        .setStyle('DANGER')
        .setCustomId(newCustomId({
          type: 'RP',
          clipObjectId: clipObject.objectId,
          clipSharerDiscordId: String(message.author.id),
          clipSharerResponse: 'N'
        }))
    )

  // Delete question after max time
  await msgReply.edit({ embeds: [embedReply], components: [actionRow] }).catch(console.error)
  setTimeout(() => {
    msgReply.delete().catch(() => { console.log('Maybe the message was already deleted. (Ok)') })
  }, config['MAX-TIME-TO-OPT-TO-POST-ON-INTERNET'] * 1000)
}
