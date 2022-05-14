import { instagramLogin } from '../functions/clients/instagramLogin'
import { discordLogin } from '../functions/clients/discordLogin'
import { addToQueue, startQueueProcessing } from '../functions/clipProcessQueue'

async function test () {
  await discordLogin()
  await instagramLogin()
  startQueueProcessing()
  const queue = addToQueue('outplayed@kPkXJ1')
  if (queue instanceof Error) return console.log(queue)
}
test()
