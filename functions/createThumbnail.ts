import { maxNameThumbnailLength } from '../constants'
import { getClipData } from './common'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const thumbnailHtml = fs.readFileSync('./media/thumbnail.html', 'utf8')

export async function createThumbnail (gdClipId: string, authorName: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando Thumbnail!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Iniciando...')
      ]
    }).catch(console.error)
  }

  const thumbnailPath = path.join(clipDataPath, 'thumbnail.png')
  const authorNameString = authorName.substring(0, maxNameThumbnailLength)
  const thumbnail = await HtmlToImg({
    output: thumbnailPath,
    html: thumbnailHtml,
    transparent: true,
    content: { name: authorNameString }
  }).catch(err => { return new Error(`Error creating lower third: ${err}`) })
  if (thumbnail instanceof Error) return new Error(thumbnail.message)
  if (!fs.existsSync(thumbnailPath)) return new Error(`Lower third not found for: ${thumbnail}`)

  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando Thumbnail!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Finalizado!')
      ]
    }).catch(console.error)
  }
}
