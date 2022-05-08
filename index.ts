import { newClip } from './functions/newClip'
import { clipPermissionResponse } from './functions/clipPermissionResponse'
import { clipApprovalResponse } from './functions/clipApprovalResponse'
import { readCustomId } from './functions/common'
import { sendAuthorMessage, sendModalResponseRequestSAM } from './functions/clipAuthorMessage'
import { discordLogin } from './functions/discordLogin'
import { startQueueProcessing } from './functions/clipProcessQueue'
import { isValidUrl } from './functions/providers'
import { getClipObjectOrCreateOne } from './functions/clipObject'
import { client, config } from './constants'
import { instagramLogin } from './functions/instagramLogin'

async function startBot () {
  await discordLogin()
  await instagramLogin()
  startQueueProcessing()

  client.on('messageCreate', async message => {
    if (message.author.bot) return
    console.log(message)
    // Split space or \n
    const messageArray = message.content.replace('\n', ' ').split(' ')
    console.log(messageArray)
    for (const messageWord of messageArray) {
      if (!isValidUrl(messageWord)) continue
      const clipObject = getClipObjectOrCreateOne(messageWord, message.author.id, message.channel.id)
      if (clipObject instanceof Error) return console.error(clipObject)
      if (message.channel.id !== config['CLIPS-CHANNEL-ID']) return
      console.log('New clip message!')
      if (isValidUrl(messageWord)) newClip(message, messageWord)
    }
  })

  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return
    console.log('New interaction!')
    const interactionData = readCustomId(interaction.customId)
    console.log('New interaction:', interactionData)
    if (interactionData.type === 'RP') clipPermissionResponse(interaction).catch(console.error)
    if (interactionData.type === 'MP') clipApprovalResponse(interaction).catch(console.error)
    if (interactionData.type === 'MRQSAM') sendModalResponseRequestSAM(interaction).catch(console.error)
  })

  client.on('modalSubmit', async modal => {
    console.log('New modal response!')
    const interactionData = readCustomId(modal.customId)
    console.log(interactionData)
    if (interactionData.type === 'MRPSAM') sendAuthorMessage(modal).catch(console.error)
  })
}

startBot() // Start the bot
