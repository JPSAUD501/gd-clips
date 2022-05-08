import { maxNameThumbnailLength } from '../constants'
import { getClipData } from './common'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const extractFrame = require('ffmpeg-extract-frame')
const coverHtml = fs.readFileSync('./media/cover.html', 'utf8')

export async function createCover (gdClipId: string, authorName: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando Capa!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Iniciando...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
  const clipVideoPath = path.join(clipDataPath, 'clip.mp4')
  const previewImgPath = path.join(clipDataPath, 'preview.png')
  if (!clipData.clipDuration) return new Error(`Clip duration not found for: ${clipData.gdClipId}`)
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando Capa!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Criando...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
  await extractFrame({
    input: clipVideoPath,
    output: previewImgPath,
    offset: Math.floor(clipData.clipDuration * 1000) / 2
  })
  if (!fs.existsSync(previewImgPath)) return new Error(`Preview image not found for: ${previewImgPath}`)
  const coverPath = path.join(clipDataPath, 'cover.jpg')
  const authorNameString = authorName.substring(0, maxNameThumbnailLength)

  const previewImg = fs.readFileSync(previewImgPath)
  const base64PreviewImg = previewImg.toString('base64')
  const previewDataImgURI = 'data:image/png;base64,' + base64PreviewImg

  const cover = await HtmlToImg({
    output: coverPath,
    html: coverHtml,
    transparent: false,
    type: 'jpeg',
    // quality: 40,
    content: { name: authorNameString, previewImg: previewDataImgURI }
  }).catch(err => { return new Error(`Error creating cover: ${err}`) })
  if (cover instanceof Error) return cover
  if (!fs.existsSync(coverPath)) return new Error(`Cover not found for: ${cover}`)

  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Capa criada!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Finalizado!')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
}
