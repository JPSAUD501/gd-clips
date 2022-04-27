import Discord, { Client } from 'discord.js'
import discordModals from 'discord-modals'

export async function discordLogin (token: string): Promise<Client | Error> {
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
  discordModals(Client)
  await Client.login(token)
  if (!Client.user) return new Error('Error logging in')
  const awaitLogin = await new Promise((resolve, reject) => {
    Client.on('ready', () => {
      resolve('success')
    })
    Client.on('error', (err) => {
      reject(err)
    })
  })
  if (awaitLogin instanceof Error) return new Error('Error logging 1 in')
  if (awaitLogin !== 'success') return new Error('Error logging 2 in')
  console.log(`Logged in as ${Client.user.tag}!`)
  return Client
}
