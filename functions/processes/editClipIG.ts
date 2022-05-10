import editly, { Config } from 'editly'
import fs from 'fs'
import path from 'path'
import { Message, MessageEmbed } from 'discord.js'
import { getClipObject, getClipObjectFolder } from '../clipObject'

export async function editClipIG (clipObjectId: string, logMessage?: Message): Promise<void | Error> {
  const clipObject = getClipObject(clipObjectId)
  if (clipObject instanceof Error) return clipObject
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Iniciando edição do clipe IG!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Iniciando...')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)

  const clipObjectFolder = getClipObjectFolder(clipObjectId)
  if (clipObjectFolder instanceof Error) return clipObjectFolder
  const clipVideoPath = path.join(clipObjectFolder, 'clip.mp4')
  if (!fs.existsSync(clipVideoPath)) return new Error(`Clip video not found for: ${clipVideoPath}`)
  const lowerThirdIGPath = path.join(clipObjectFolder, 'lowerThirdIG.png')
  if (!fs.existsSync(lowerThirdIGPath)) return new Error(`Lower third not found for: ${lowerThirdIGPath}`)

  const editSpec: Config = {
    outPath: path.join(clipObjectFolder, 'clipEditedIG.mp4'),
    clips: [
      {
        layers: [
          { type: 'video', path: clipVideoPath, resizeMode: 'cover' },
          { type: 'image-overlay', path: lowerThirdIGPath }
        ]
      }
    ],
    keepSourceAudio: true,
    width: 1300,
    height: 1300,
    fps: 60
  }

  const editStart = Date.now()
  if (!clipObject.duration) return new Error(`Clip duration not found for: ${clipObjectId}`)
  const estimatedTime = 40 * clipObject.duration * 1000

  const progressLogMessage = setInterval(async () => {
    await logMessage?.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Editando clipe IG!')
          .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
          .addField('Inicio:', `${new Date(editStart).toLocaleString()}`)
          .addField('Previsão de término:', `${(new Date(editStart + estimatedTime).toLocaleString())}`)
          .addField('Progresso estimado:', `${Math.round(((Date.now() - editStart) / estimatedTime) * 100)}%`)
          .addField('Informações:', 'É possível que o progresso estimado passe de 100% quando a previsão de término for atingida.')
          .addField('Progresso:', 'Editando...')
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }, 5000)
  const editedClip = await editly(editSpec).catch(err => {
    console.error(err)
    return new Error(`Editly failed for: ${clipObjectId}`)
  })
  clearInterval(progressLogMessage)

  if (editedClip instanceof Error) return editedClip
  if (!fs.existsSync(editSpec.outPath)) return new Error(`Edited clip not found for: ${editSpec.outPath}`)
  await logMessage?.edit({
    embeds: [
      new MessageEmbed()
        .setTitle('Clipe IG editado com sucesso!')
        .addField('Clipe ID:', `[${clipObjectId}](${clipObject.url})`)
        .addField('Progresso:', 'Finalizado!')
        .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
    ]
  }).catch(console.error)
}
