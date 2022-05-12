import { addToQueue, startQueueProcessing } from '../functions/clipProcessQueue'

async function test () {
  startQueueProcessing()
  const addedToQueue = await addToQueue(
    'twitch@s_xardu2OvOC-ro_',
    'https://clips.twitch.tv/DiligentYawningZucchiniM4xHeh-s_xardu2OvOC-ro_',
    undefined,
    undefined,
    'JPSAUD501'
  )
  if (addedToQueue instanceof Error) return addedToQueue
}
test()
