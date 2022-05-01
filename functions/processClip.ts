import { maxClipTime } from '../constants'
import { IClipData } from '../interfaces'
import { downloadClip, getClipData, saveClipData } from './common'
import { getDownloadData } from './providers'
import { Message, MessageEmbed, User } from 'discord.js'
import { editClip } from './editClip'
import { createLowerThird } from './createLowerThird'

export async function processClip (clipData: IClipData, logMessage: Message, authorUser: User): Promise<void | Error> {
  const save = saveClipData(clipData)
  if (save instanceof Error) return new Error(save.message)
  const downloadData = await getDownloadData(clipData.clipProvider, clipData.clipId)
  if (downloadData instanceof Error) return new Error(downloadData.message)
  const { downloadUrl, videoDuration } = downloadData
  if (videoDuration === 0) return new Error('Invalid video duration!')
  if (videoDuration >= maxClipTime) return new Error(`Video duration is too long! Max: ${maxClipTime}`)
  const saveDownloadData = saveClipData({
    ...clipData,
    clipDownloadUrl: downloadUrl,
    clipDuration: videoDuration
  })
  if (saveDownloadData instanceof Error) return new Error(saveDownloadData.message)

  const latestClipDataObj = getClipData(clipData.gdClipId)
  if (latestClipDataObj instanceof Error) return new Error(latestClipDataObj.message)
  const { clipData: latestClipData } = latestClipDataObj[0]
  if (!latestClipData.clipDownloadUrl) return new Error('No download url found!')
  await logMessage.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Baixando clipe do Outplayed!')
        .addField('Clipe ID:', `[${latestClipData.gdClipId}](${latestClipData.clipDownloadUrl})`)
        .addField('Progresso:', 'Iniciando...')
    ]
  }).catch(console.error)
  const downloadedClip = await downloadClip(latestClipData.gdClipId, logMessage)
  if (downloadedClip instanceof Error) return new Error(downloadedClip.message)
  // TODO: Create Thumbnail
  // const clipThumbnail = await createThumbnail()
  const createdLowerThird = await createLowerThird(latestClipData.gdClipId, authorUser.username, logMessage)
  if (createdLowerThird instanceof Error) return new Error(createdLowerThird.message)
  const editedClip = await editClip(latestClipData.gdClipId, logMessage)
  if (editedClip instanceof Error) return new Error(editedClip.message)
  authorUser.send(`Clipe baixado e editado com sucesso!\nClipe ID: [${latestClipData.gdClipId}](${latestClipData.clipDownloadUrl})`) // TODO: Remove this when post to YouTube is done
}
