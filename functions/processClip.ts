import { checkMaxClipTime, saveDownloadData } from './common'
import { downloadClip } from './providers'
import { Message, MessageEmbed, User } from 'discord.js'
import { createCover } from './createCover'
import { createLowerThirdIG } from './createLowerThirdIG'
import { editClipIG } from './editClipIG'

const defaultProcess = async function (gdClipId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void | Error> {
  // Clip download data
  const savedDownloadData = await saveDownloadData(gdClipId)
  if (savedDownloadData instanceof Error) return savedDownloadData
  // Check if clip is too long
  const checkedMaxClipTime = checkMaxClipTime(gdClipId)
  if (checkedMaxClipTime instanceof Error) return checkedMaxClipTime
  // Set author name
  if (!authorUser && !clipAuthorName) return new Error('No author user or author name found!')
  const authorName = clipAuthorName || authorUser?.username
  if (!authorName) return new Error('No author name found!')
  // Download
  const downloadedClip = await downloadClip(gdClipId, logMessage)
  if (downloadedClip instanceof Error) return downloadedClip
  // Create cover
  const createdCover = await createCover(gdClipId, authorName, logMessage)
  if (createdCover instanceof Error) return createdCover
  // Create lower third IG
  const createdLowerThirdIG = await createLowerThirdIG(gdClipId, authorName, logMessage)
  if (createdLowerThirdIG instanceof Error) return createdLowerThirdIG
  // Edit IG
  const editedClipIG = await editClipIG(gdClipId, logMessage)
  if (editedClipIG instanceof Error) return editedClipIG
  // Upload to IG
  // const uploadedClipIG = await uploadToIGClip(gdClipId, authorName, logMessage)
  // if (uploadedClipIG instanceof Error) return uploadedClipIG

  authorUser?.send(`Clipe postado com sucesso! Link do nosso Instagram: https://www.instagram.com/grupodisparate !\nClipe ID: ${gdClipId}`)
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Processamento padrão do clipe concluído!')
        .addField('Clipe ID:', `${gdClipId}`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
}

const processes = {
  defaultProcess
}

export async function processClip (gdClipId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void> {
  const processed = await processes.defaultProcess(gdClipId, authorUser, clipAuthorName, logMessage)
  if (processed instanceof Error) {
    console.error(processed.message)
    await logMessage?.edit({
      embeds: [
        new MessageEmbed()
          .setTitle(`Erro ao salvar clipe (ID: ${gdClipId})`)
          .setDescription(`${processed.message}`)
      ]
    }).catch(console.error)
    authorUser?.send(`Ocorreu um erro ao processar seu clipe (ID: ${gdClipId}). Nossa equipe de moderação ja está sabendo do ocorrido e possivelmente você ira receber atualizações em breve dependendo do ocorrido.`).catch(console.error)
  }
}
