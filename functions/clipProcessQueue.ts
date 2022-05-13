import { Message, MessageEmbed } from 'discord.js'
import { IQueueObject } from '../interfaces'
import { processClip } from './processClip'
import { config } from '../constants'
import { getClipObject } from './clipObject'

const queue: IQueueObject[] = []
const inProcess: IQueueObject[] = []

export async function startQueueProcessing (): Promise<void> {
  setInterval(async () => {
    if (queue.length === 0) return
    const maxSimultaneousClipsProcessing: number = config['MAX-SIMULTANEOUS-CLIPS-PROCESSING']
    if (!maxSimultaneousClipsProcessing) throw new Error('MAX-SIMULTANEOUS-CLIPS-PROCESSING not found in config.yaml')
    if (maxSimultaneousClipsProcessing < 1) throw new Error('MAX-SIMULTANEOUS-CLIPS-PROCESSING must be greater or equal to 1!')
    if (inProcess.length >= maxSimultaneousClipsProcessing) return await updateWaitingClipsLogMessages()
    const queueObject = queue.shift()
    if (!queueObject) return
    inProcess.push(queueObject)
    const { clipObjectId, logMessage } = queueObject
    // --> Process Clip
    await processClip(clipObjectId, logMessage)
    // <--
    const clipProcessDone = queueClipProcessDone(clipObjectId)
    if (clipProcessDone instanceof Error) throw clipProcessDone
  }, 10000)
}

export async function addToQueue (clipObjectId: string, logMessage?: Message): Promise<void | Error> {
  queue.push({
    clipObjectId,
    logMessage: logMessage || undefined
  })
  const updatedWaitingClipsLogMessages = await updateWaitingClipsLogMessages()
  if (updatedWaitingClipsLogMessages instanceof Error) return updatedWaitingClipsLogMessages
}

async function updateWaitingClipsLogMessages (): Promise<void | Error> {
  for (const queueObject of queue) {
    if (!queueObject.logMessage) continue
    const { clipObjectId } = queueObject
    const clipObject = getClipObject(clipObjectId)
    if (clipObject instanceof Error) return new Error(`Clip object not found for: ${clipObjectId}`)
    const sharerNameString = clipObject.sharerDiscordName
    if (!sharerNameString) return new Error('No sharer name found!')
    const queueLength = queue.length
    const indexPositionInQueue = queue.findIndex(clip => {
      return clip.clipObjectId === queueObject.clipObjectId
    })
    if (indexPositionInQueue === -1) return new Error(`Clip not found in queue: ${queueObject.clipObjectId}`)
    const positionInQueue = indexPositionInQueue + 1
    await queueObject.logMessage.edit({
      embeds: [
        new MessageEmbed()
          .setTitle('Clipe na fila de processamento!')
          .addField('Clipe ID:', `[${clipObject.objectId}](${clipObject.url})`)
          .addField('Compartilhado por: ', `${sharerNameString}`)
          .addField('Posição na fila de processamento:', `${positionInQueue}/${queueLength}`)
          .setFooter({ text: `Ultima atualização: ${new Date().toLocaleString()}` })
      ]
    }).catch(console.error)
  }
}

function queueClipProcessDone (clipObjectId: string): void | Error {
  const indexOfClipObject = inProcess.findIndex(clip => {
    return clip.clipObjectId === clipObjectId
  })
  if (indexOfClipObject === -1) return new Error(`Clip not found in inProcess: ${clipObjectId}`)
  inProcess.splice(indexOfClipObject, 1)
}
