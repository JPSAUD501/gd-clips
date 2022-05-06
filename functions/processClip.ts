import { getClipData, updateClipData } from './common'
import { downloadClip, getDownloadData, getFullUrl } from './providers'
import { Message, MessageEmbed, User } from 'discord.js'
import { editClip } from './editClip'
import { createLowerThird } from './createLowerThird'
import { createThumbnail } from './createThumbnail'
import { updateClipObject } from './clipObject'
import { config } from '../constants'
import { uploadToYT } from './uploadToYTClip'

export async function processClip (gdClipId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void> {
  const process = async function (gdClipId: string, authorUser?: User, clipAuthorName?: string, logMessage?: Message): Promise<void | Error> {
    const savedDownloadData = await saveDownloadData(gdClipId)
    if (savedDownloadData instanceof Error) return savedDownloadData
    const checkedMaxClipTime = checkMaxClipTime(gdClipId)
    if (checkedMaxClipTime instanceof Error) return checkedMaxClipTime

    if (!authorUser && !clipAuthorName) return new Error('No author user or author name found!')
    const authorName = clipAuthorName || authorUser?.username
    if (!authorName) return new Error('No author name found!')

    // Download
    const downloadTimer: {
      start: number,
      end: number | undefined
    } = {
      start: Date.now(),
      end: undefined
    }
    const downloadedClip = await downloadClip(gdClipId, logMessage)
    if (downloadedClip instanceof Error) return downloadedClip
    downloadTimer.end = Date.now()
    const saveDownloadData2 = updateClipData(gdClipId, {
      downloadTime: downloadTimer.end - downloadTimer.start
    })
    if (saveDownloadData2 instanceof Error) return saveDownloadData2

    // Thumbnail
    const clipThumbnail = await createThumbnail(gdClipId, authorName, logMessage)
    if (clipThumbnail instanceof Error) return clipThumbnail

    // Lower third
    const createdLowerThird = await createLowerThird(gdClipId, authorName, logMessage)
    if (createdLowerThird instanceof Error) return createdLowerThird

    // Edit
    const editTimer: { start: number, end: number | undefined } = {
      start: Date.now(),
      end: undefined
    }
    const editedClip = await editClip(gdClipId, logMessage)
    if (editedClip instanceof Error) return editedClip
    editTimer.end = Date.now()
    const saveEditData = updateClipData(gdClipId, {
      editTime: editTimer.end - editTimer.start
    })
    if (saveEditData instanceof Error) return saveEditData

    // Upload to YT
    const uploadedClip = await uploadToYT(gdClipId, authorName, logMessage)
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

async function saveDownloadData (gdClipId: string): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData } = obtainedClipData[0]
  const downloadData = await getDownloadData(clipData.clipProvider, clipData.clipProviderId)
  if (downloadData instanceof Error) return downloadData
  const { downloadUrl, videoDuration } = downloadData
  const saveDownloadData1 = updateClipData(clipData.gdClipId, {
    clipDownloadUrl: downloadUrl,
    clipDuration: videoDuration
  })
  if (saveDownloadData1 instanceof Error) return saveDownloadData1
}

function checkMaxClipTime (gdClipId: string): void | Error {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData } = obtainedClipData[0]
  if (!clipData.clipDuration) return new Error('Clip duration not found!')
  if (clipData.clipDuration === 0) return new Error('Invalid video duration!')
  const maxClipTime: number = config['MAX-CLIP-TIME']
  if (!maxClipTime) return new Error('MAX-CLIP-TIME not found in config.yaml')
  if (maxClipTime < 1) return new Error('MAX-CLIP-TIME must be greater or equal to 1!')
  if (clipData.clipDuration >= maxClipTime) return new Error(`Video duration is too long! Max: ${maxClipTime}`)
}
