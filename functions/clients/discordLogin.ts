import discordModals from 'discord-modals'
import { client, discordToken } from '../../constants'

export async function discordLogin (): Promise<void> {
  discordModals(client)
  await client.login(discordToken)
  if (!client.user) throw new Error('Error logging in')
  const awaitLogin = await new Promise((resolve, reject) => {
    client.on('ready', () => {
      resolve('success')
    })
    client.on('error', (err) => {
      reject(err)
    })
  })
  if (awaitLogin instanceof Error) throw new Error('Error logging 1 in')
  if (awaitLogin !== 'success') throw new Error('Error logging 2 in')
  console.log(`Logged in as ${client.user.tag}!`)
}
