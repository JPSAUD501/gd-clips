import { maxNameThumbnailLength } from '../constants'
import { getClipData } from './common'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const extractFrame = require('ffmpeg-extract-frame')
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
  const clipVideoPath = path.join(clipDataPath, 'clip.mp4')
  const previewImgPath = path.join(clipDataPath, 'preview.png')
  if (!clipData.clipDuration) return new Error(`Clip duration not found for: ${clipData.gdClipId}`)
  await extractFrame({
    input: clipVideoPath,
    output: previewImgPath,
    offset: Math.floor(clipData.clipDuration * 1000) / 2
  })
  console.log(previewImgPath)
  if (!fs.existsSync(previewImgPath)) return new Error(`Preview image not found for: ${previewImgPath}`)
  const thumbnailPath = path.join(clipDataPath, 'thumbnail.png')
  const authorNameString = authorName.substring(0, maxNameThumbnailLength)

  const previewImg = fs.readFileSync(previewImgPath)
  const base64PreviewImg = previewImg.toString('base64')
  const previewDataImgURI = 'data:image/png;base64,' + base64PreviewImg

  const thumbnail = await HtmlToImg({
    output: thumbnailPath,
    html: thumbnailHtml,
    transparent: false,
    content: { name: authorNameString, previewImg: previewDataImgURI }
  }).catch(err => { return new Error(`Error creating thumbnail: ${err}`) })
  if (thumbnail instanceof Error) return new Error(thumbnail.message)
  if (!fs.existsSync(thumbnailPath)) return new Error(`Thumbnail not found for: ${thumbnail}`)

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
