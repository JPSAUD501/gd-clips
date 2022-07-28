import { newClip } from './functions/newClip'
import { clipPermissionResponse } from './functions/clipPermissionResponse'
import { clipApprovalResponse } from './functions/clipApprovalResponse'
import { readCustomId } from './functions/common'
import { sendSharerMessage, sendModalResponseRequestSAM } from './functions/clipSharerMessage'
import { discordLogin } from './functions/clients/discordLogin'
import { startQueueProcessing } from './functions/clipProcessQueue'
import { isValidUrl } from './functions/providers'
import { getClipObjectOrCreateOne } from './functions/clipObject'
import { client, config } from './constants'
import { instagramLogin } from './functions/clients/instagramLogin'

async function startBot () {
  await discordLogin()
  await instagramLogin()

  startQueueProcessing()

  client.on('messageCreate', async message => {
    if (message.author.bot) return

    // CLips links -->
    const messageArray = message.content.replace('\n', ' ').split(' ')
    for (const messageWord of messageArray) {
      console.log(messageWord)
      if (!await isValidUrl(messageWord)) continue
      const clipObject = await getClipObjectOrCreateOne(messageWord, message.author.id, message.channel.id)
      if (clipObject instanceof Error) return console.error(clipObject)
      if (message.channel.id !== config['CLIPS-CHANNEL-ID']) continue
      console.log('New clip message!')
      await newClip(message, messageWord)
    } // <--

    // Clips attachments -->
    message.attachments.forEach(async attachment => {
      console.log(attachment.url)
      if (!await isValidUrl(attachment.url)) return
      const clipObject = await getClipObjectOrCreateOne(attachment.url, message.author.id, message.channel.id)
      if (clipObject instanceof Error) return console.error(clipObject)
      if (message.channel.id !== config['CLIPS-CHANNEL-ID']) return
      console.log('New clip message!')
      await newClip(message, attachment.url)
    }) // <--
  })

  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return
    console.log('New interaction!')
    const interactionData = readCustomId(interaction.customId)
    console.log('New interaction:', interactionData)
    if (interactionData.type === 'RP') await clipPermissionResponse(interaction).catch(console.error)
    if (interactionData.type === 'MP') await clipApprovalResponse(interaction).catch(console.error)
    if (interactionData.type === 'MRQSAM') await sendModalResponseRequestSAM(interaction).catch(console.error)
  })

  client.on('modalSubmit', async modal => {
    console.log('New modal response!')
    const interactionData = readCustomId(modal.customId)
    console.log(interactionData)
    if (interactionData.type === 'MRPSAM') await sendSharerMessage(modal).catch(console.error)
  })
}
startBot() // Start the bot
