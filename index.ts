import dotenv from 'dotenv'
import YAML from 'yaml'
import fs from 'fs'
import { newClipMessage } from './functions/newClipMessage'
import { clipPermissionResponse } from './functions/clipPermissionResponse'
import { clipApprovalResponse } from './functions/clipApprovalResponse'
import { readCustomId } from './functions/common'
import { sendAuthorMessage, sendModalResponseRequestSAM } from './functions/clipAuthorMessage'
import { discordLogin } from './functions/discordLogin'

dotenv.config()

const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))

console.log('Config loaded!')
const TOKEN = process.env.TOKEN
if (!TOKEN) throw new Error('No token found!')
discordLogin(TOKEN).then((Client) => {
  if (Client instanceof Error) throw new Error('Error logging in')
  Client.on('messageCreate', async message => {
    if (message.author.bot) return
    console.log(message)
    if (message.channel.id !== config['CLIPS-CHANNEL-ID']) return
    console.log('New clip message!')
    newClipMessage(message)
  })

  Client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return
    console.log('New interaction!')
    const interactionData = readCustomId(interaction.customId)
    console.log(interactionData)
    if (interactionData.type === 'RP') clipPermissionResponse(interaction, Client)
    if (interactionData.type === 'MP') clipApprovalResponse(interaction, Client)
    if (interactionData.type === 'MRQSAM') sendModalResponseRequestSAM(interaction, Client)
  })

  Client.on('modalSubmit', async modal => {
    console.log('New modal response!')
    const interactionData = readCustomId(modal.customId)
    console.log(interactionData)
    if (interactionData.type === 'MRPSAM') sendAuthorMessage(modal, Client)
  })
}).catch(err => {
  console.log(err)
})
