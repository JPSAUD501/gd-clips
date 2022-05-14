import { maxNameThumbnailLength } from '../../constants'
import { getClipObject, getClipObjectFolder } from '../clipObject'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const extractFrame = require('ffmpeg-extract-frame')
const storiesHtml = fs.readFileSync('./media/storiesIG.html', 'utf8')
// TODO: Video stories
export async function createFrameStoriesIG (clipObjectId: string, logMessage?: Message): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando IG stories!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)

  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const clipVideoPath = path.join(clipObjectFolder, 'clip.mp4')
  const previewImgPath = path.join(clipObjectFolder, 'preview.png')
  if (!clipObject.duration) return new Error(`Clip duration not found for: ${clipObjectId}`)
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Criando IG stories!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Criando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
  await extractFrame({
    input: clipVideoPath,
    output: previewImgPath,
    offset: Math.floor(clipObject.duration * 1000) / 2
  })
  if (!fs.existsSync(previewImgPath)) return new Error(`Preview image not found for: ${previewImgPath}`)
  const storiesPath = path.join(clipObjectFolder, 'stories.jpg')
  const sharerVisibility: string = clipObject.providerChannelName ? 'true' : 'false'
  const sharerNameString = clipObject.sharerDiscordName.substring(0, maxNameThumbnailLength)
  const authorNameString = clipObject.providerChannelName?.substring(0, maxNameThumbnailLength) || sharerNameString

  const previewImg = fs.readFileSync(previewImgPath)
  const base64PreviewImg = previewImg.toString('base64')
  const previewDataImgURI = 'data:image/png;base64,' + base64PreviewImg

  const stories = await HtmlToImg({
    output: storiesPath,
    html: storiesHtml,
    transparent: false,
    type: 'jpeg',
    content: { authorName: authorNameString, sharerVisibility, sharerName: sharerNameString, previewImg: previewDataImgURI }
  }).catch(err => { return new Error(`Error creating stories: ${err}`) })
  if (stories instanceof Error) return stories
  if (!fs.existsSync(storiesPath)) return new Error(`stories not found for: ${stories}`)

  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('IG stories criado!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
}
