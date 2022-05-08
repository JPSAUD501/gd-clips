import { Message, MessageEmbed } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { config, igClient } from '../constants'
import { updateClipObject } from './clipObject'
import { getClipData } from './common'
import { getFullUrl } from './providers'

export async function uploadToIGClip (gdClipId: string, authorName: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return obtainedClipData
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Iniciando envio ao Instagram do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Iniciando...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }

  const videoPath = path.join(clipDataPath, 'clipEditedIG.mp4')
  const coverPath = path.join(clipDataPath, 'cover.jpg')
  if (!fs.readFileSync(videoPath)) return new Error(`Clip edited IG not found for: ${gdClipId}`)
  if (!fs.readFileSync(coverPath)) return new Error(`Clip cover not found for: ${gdClipId}`)
  const clipDescription: string = config['IG-CLIP-DESCRIPTION']
  if (!clipDescription) return new Error('Default description not found')
  const publishResult = await igClient.publish.video({
    video: fs.readFileSync(videoPath),
    coverImage: fs.readFileSync(coverPath),
    caption: `${authorName} - ${clipData.clipCategory} // ${clipDescription}`
  }).catch(console.error)
  if (!publishResult) return new Error('Error publishing video')
  console.log(publishResult)
  const savedClipObject = updateClipObject(getFullUrl(clipData.clipProvider, clipData.clipProviderId), {
    instagramPostDate: new Date().toISOString()
  })
  if (savedClipObject instanceof Error) return savedClipObject
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Envio ao Instagram do clipe!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Finalizado...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
}
