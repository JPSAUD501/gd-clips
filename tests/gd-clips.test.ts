import { addToQueue, startQueueProcessing } from '../functions/clipProcessQueue'

async function test () {
  startQueueProcessing()
  const addedToQueue = await addToQueue('discord@973822212689764372')
  if (addedToQueue instanceof Error) return addedToQueue
}
test()
