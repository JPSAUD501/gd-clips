import { discordLogin } from '../functions/discordLogin'
import { uploadToYT } from '../functions/uploadToYTClip'

async function test () {
  await discordLogin()
  const response = await uploadToYT('971249512528117780', 'JPSAUD501')
  console.log(response)
}
test()
