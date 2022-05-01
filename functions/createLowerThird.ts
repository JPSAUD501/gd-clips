import { maxNameLowerThirdLength } from '../constants'
import { getClipData } from './common'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const lowerThirdHtml = fs.readFileSync('./media/lowerThird.html', 'utf8')

export async function createLowerThird (gdClipId: string, authorName: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando LowerThird!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Iniciando...')
      ]
    }).catch(console.error)
  }

  const lowerThirdPath = path.join(clipDataPath, 'lowerThird.png')
  const authorNameString = authorName.substring(0, maxNameLowerThirdLength)
  const lowerThird = await HtmlToImg({
    output: lowerThirdPath,
    html: lowerThirdHtml,
    transparent: true,
    content: { name: authorNameString }
  }).catch(err => { return new Error(`Error creating lower third: ${err}`) })
  if (lowerThird instanceof Error) return new Error(lowerThird.message)
  if (!fs.existsSync(lowerThirdPath)) return new Error(`Lower third not found for: ${lowerThirdPath}`)

  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando LowerThird!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Finalizado!')
      ]
    }).catch(console.error)
  }
}
