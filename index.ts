import Discord from 'discord.js'
import dotenv from 'dotenv'
import YAML from 'yaml'
import fs from 'fs'
import { newClipMessage } from './functions/newClipMessage'
import { clipPermissionResponse } from './functions/clipPermissionResponse'
import { clipApprovalResponse } from './functions/clipApprovalResponse'
import { readCustomId } from './functions/common'
import { rootDbPath } from './constants'

if (!fs.existsSync(`./${rootDbPath}}/EPIC`)) fs.mkdirSync(`./${rootDbPath}/EPIC`, { recursive: true })
if (!fs.existsSync(`./${rootDbPath}/FUNNY`)) fs.mkdirSync(`./${rootDbPath}/FUNNY`, { recursive: true })
if (!fs.existsSync(`./${rootDbPath}/EPIC-COMPILED`)) fs.mkdirSync(`./${rootDbPath}/EPIC-COMPILED`, { recursive: true })
if (!fs.existsSync(`./${rootDbPath}/FUNNY-COMPILED`)) fs.mkdirSync(`./${rootDbPath}/FUNNY-COMPILED`, { recursive: true })

// if (!fs.existsSync('./client-secret') || !fs.existsSync('./client-secret/client_secret.json')) {
//   try { fs.mkdirSync('./client-secret') } catch (error) {}
//   throw new Error('No client secret file found!')
// }

dotenv.config()

const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))

console.log('Config loaded!')

const Client = new Discord.Client({
  restTimeOffset: 0,
  shards: 'auto',
  restWsBridgeTimeout: 100,
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  intents: [
    'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_MESSAGES',
    'DIRECT_MESSAGES'
  ]
})

Client.on('ready', () => {
  console.log('GD-CLIPS is ready!')
})

Client.on('messageCreate', async message => {
  if (message.author.bot) return
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
})

Client.login(process.env.TOKEN)
