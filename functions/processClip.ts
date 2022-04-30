import { maxClipTime } from '../constants'
import { IClipData } from '../interfaces'
import { downloadClip, getClipData, saveClipData } from './common'
import { getDownloadData } from './providers'
import { Client, TextChannel } from 'discord.js'
import { editClip } from './editClip'
import YAML from 'yaml'
import fs from 'fs'
const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))

export async function processClip (clipData: IClipData, Client: Client): Promise<void | Error> {
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

  const logChannel = Client.channels.cache.get(config['BOT-LOG-CHANNEL-ID'])
  if (!logChannel) return new Error('Log channel not found!')
  if (!(logChannel instanceof TextChannel)) return new Error('Log channel is not a text channel!')
  const authorUser = await Client.users.fetch(latestClipData.clipAuthorDiscordId)
  if (!authorUser) return new Error(`Author not found for: ${latestClipData.clipAuthorDiscordId}`)
  const logMessage = await logChannel.send(`Baixando clipe do Outplayed: ${latestClipData.gdClipId} // Progresso: Iniciando...`).catch(console.error)
  if (!logMessage) return new Error('Log message not found!')
  const downloadedClip = await downloadClip(latestClipData.gdClipId, logMessage)
  if (downloadedClip instanceof Error) return new Error(downloadedClip.message)
  logChannel.send(`Iniciando edição do clipe: ${latestClipData.gdClipId}`)
  const editedClip = await editClip(latestClipData.gdClipId, Client)
  if (editedClip instanceof Error) return new Error(editedClip.message)
  logChannel.send(`Clipe editado com sucesso: ${latestClipData.gdClipId}`)
}
