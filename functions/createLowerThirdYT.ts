import { maxNameLowerThirdLength } from '../constants'
import { getClipData } from './common'
import path from 'path'
import fs from 'fs'
import HtmlToImg from 'node-html-to-image'
import { Message, MessageEmbed } from 'discord.js'
const lowerThirdYTHtml = fs.readFileSync('./media/lowerThirdYT.html', 'utf8')

export async function createLowerThirdYT (gdClipId: string, authorName: string, logMessage?: Message): Promise<void | Error> {
  const obtainedClipData = getClipData(gdClipId)
  if (obtainedClipData instanceof Error) return new Error(`Clip data not found for: ${gdClipId}`)
  const { clipData, path: clipDataPath } = obtainedClipData[0]
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando LowerThird YT!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Iniciando...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }

  const lowerThirdYTPath = path.join(clipDataPath, 'lowerThirdYT.png')
  const authorNameString = authorName.substring(0, maxNameLowerThirdLength)
  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando LowerThird YT!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Criando...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
  const lowerThird = await HtmlToImg({
    output: lowerThirdYTPath,
    html: lowerThirdYTHtml,
    transparent: true,
    content: { name: authorNameString }
  }).catch(err => { return new Error(`Error creating lower third: ${err}`) })
  if (lowerThird instanceof Error) return lowerThird
  if (!fs.existsSync(lowerThirdYTPath)) return new Error(`Lower third YT not found for: ${lowerThirdYTPath}`)

  if (logMessage) {
    if (!clipData.clipDownloadUrl) return new Error(`Clip download url not found for: ${clipData.gdClipId}`)
    await logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Criando LowerThird YT!')
          .addField('Clipe ID:', `[${clipData.gdClipId}](${clipData.clipDownloadUrl})`)
          .addField('Progresso:', 'Finalizado!')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
}
