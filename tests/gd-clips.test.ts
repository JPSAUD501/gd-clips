import ytdl from 'youtube-dl-exec'

async function test () {
  const stream = await ytdl('https://www.twitch.tv/yarlxws/clip/ScrumptiousAggressiveElephantPunchTrees-3oAI3yljX61DsKys', {
    dumpSingleJson: true
  })
  const url = stream.formats.pop()
  if (!url) return new Error('Não foi possível encontrar o link do vídeo')
  return console.log(url.url)
}
test()
