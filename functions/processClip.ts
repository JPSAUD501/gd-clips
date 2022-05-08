import { checkMaxClipTime, getClipData, saveDownloadData } from './common'
import { downloadClip, getFullUrl } from './providers'
import { Message, MessageEmbed, User } from 'discord.js'
import { editClipYT } from './editClipYT'
import { createLowerThirdYT } from './createLowerThirdYT'
import { createThumbnail } from './createThumbnail'
import { updateClipObject } from './clipObject'
import { uploadToYTClip } from './uploadToYTClip'

export async function processClip (gdClipId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void> {
  const process = async function (gdClipId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void | Error> {
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

    // Thumbnail
    const clipThumbnail = await createThumbnail(gdClipId, authorName, logMessage)
    if (clipThumbnail instanceof Error) return clipThumbnail

    // Lower third
    const createdLowerThirdYT = await createLowerThirdYT(gdClipId, authorName, logMessage)
    if (createdLowerThirdYT instanceof Error) return createdLowerThirdYT

    // Edit
    const editedClip = await editClipYT(gdClipId, logMessage)
    if (editedClip instanceof Error) return editedClip

    // Upload to YT
    const uploadedClip = await uploadToYTClip(gdClipId, authorName, logMessage)
    if (uploadedClip instanceof Error) return uploadedClip
    const obtainedClipData = getClipData(gdClipId)
    if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
    const { clipData } = obtainedClipData[0]
    const savedClipObject = updateClipObject(getFullUrl(clipData.clipProvider, clipData.clipProviderId), {
      youtubePostDate: new Date().toISOString()
    })
    if (savedClipObject instanceof Error) return savedClipObject

    authorUser?.send(`Clipe postado com sucesso!\nLink do video no YouTube: ${uploadedClip}\nClipe ID: ${gdClipId}`)
  }

  const processed = await process(gdClipId, authorUser, clipAuthorName, logMessage)
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
