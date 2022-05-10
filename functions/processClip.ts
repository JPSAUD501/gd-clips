import { checkMaxClipTime, saveDownloadData } from './common'
import { downloadClip } from './providers'
import { Message, MessageEmbed, User } from 'discord.js'
import { createCover } from './processes/createCover'
import { createLowerThirdIG } from './processes/createLowerThirdIG'
import { editClipIG } from './processes/editClipIG'
import { uploadToIGClip } from './processes/uploadToIGClip'
import { getClipObject } from './clipObject'

const defaultProcess = async function (clipObjectId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Iniciando processamento padrão!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  // Clip download data
  const savedDownloadData = await saveDownloadData(clipObjectId)
  if (savedDownloadData instanceof Error) return savedDownloadData
  // Check if clip is too long
  const checkedMaxClipTime = checkMaxClipTime(clipObjectId)
  if (checkedMaxClipTime instanceof Error) return checkedMaxClipTime
  // Set author name
  if (!authorUser && !clipAuthorName) return new Error('No author user or author name found!')
  const authorName = clipAuthorName || authorUser?.username
  if (!authorName) return new Error('No author name found!')
  // Download
  const downloadedClip = await downloadClip(clipObjectId, logMessage)
  if (downloadedClip instanceof Error) return downloadedClip
  // Create cover
  const createdCover = await createCover(clipObjectId, authorName, logMessage)
  if (createdCover instanceof Error) return createdCover
  // Create lower third IG
  const createdLowerThirdIG = await createLowerThirdIG(clipObjectId, authorName, logMessage)
  if (createdLowerThirdIG instanceof Error) return createdLowerThirdIG
  // Edit IG
  const editedClipIG = await editClipIG(clipObjectId, logMessage)
  if (editedClipIG instanceof Error) return editedClipIG
  // Upload to IG
  const uploadedClipIG = await uploadToIGClip(clipObjectId, authorName, logMessage)
  if (uploadedClipIG instanceof Error) return uploadedClipIG

  await authorUser?.send({
    embeds: [
      new MessageEmbed()
        .setTitle('Clipe postado com sucesso!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`, true)
        .addField('Link da postagem:', `${uploadedClipIG}`, true)
    ]
  }).catch(console.error)
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Processamento padrão do clipe concluído!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .addField('Link da postagem IG:', `${uploadedClipIG}`)
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
}

const processes = {
  defaultProcess
}

export async function processClip (clipObjectId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void> {
  const processed = await processes.defaultProcess(clipObjectId, authorUser, clipAuthorName, logMessage)
  if (processed instanceof Error) {
    console.error(processed.message)
    await logMessage?.edit({
      embeds: [
        new MessageEmbed()
          .setTitle(`Erro ao salvar clipe (ID: ${clipObjectId})`)
          .setDescription(`${processed.message}`)
      ]
    }).catch(console.error)
    await authorUser?.send({
      embeds: [
        new MessageEmbed()
          .setTitle('Erro ao processar clipe!')
          .addField('Clipe ID:', `${clipObjectId}`)
          .addField('Erro:', `${processed.message}`)
          .setDescription('Nossa equipe de moderação ja está sabendo do ocorrido e possivelmente você ira receber atualizações em breve.')
      ]
    }).catch(console.error)
  }
}
