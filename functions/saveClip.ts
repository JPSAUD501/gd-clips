import { maxClipTime } from '../constants'
import { IClipData } from '../interfaces'
import { downloadClip, saveClipData } from './common'
import { getDownloadData } from './providers'
import { Client } from 'discord.js'

export async function saveClip (clipData: IClipData, Client: Client): Promise<void | Error> {
  const save = saveClipData(clipData)
  if (save instanceof Error) throw new Error(`Error saving clip data!: ${save}`)
  const downloadData = await getDownloadData(clipData.clipProvider, clipData.clipId)
  if (downloadData instanceof Error) throw new Error(`Error getting download data!: ${downloadData}`)
  const { downloadUrl, videoDuration } = downloadData
  if (videoDuration === 0) throw new Error('Invalid video duration!')
  if (videoDuration >= maxClipTime) throw new Error(`Video duration is too long! Max: ${maxClipTime}`)
  const saveDownloadData = saveClipData({
    ...clipData,
    clipDownloadUrl: downloadUrl,
    clipDuration: videoDuration
  })
  if (saveDownloadData instanceof Error) throw new Error(`Error saving download data!: ${saveDownloadData}`)
  const downloadedClip = downloadClip(clipData.gdClipId, Client)
  if (downloadedClip instanceof Error) throw new Error(downloadedClip.message)
  // TODO: Edit
}
