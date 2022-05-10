import { igClient, instagramPassword, instagramUsername } from '../../constants'

export async function instagramLogin (): Promise<void> {
  igClient.state.generateDevice(instagramUsername)
  const login = await igClient.account.login(instagramUsername, instagramPassword).catch(console.error)
  if (!login) throw new Error('Error Instagram logging in')
  console.log('Instagram logged in!')
}
