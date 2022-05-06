import { OAuth2Client } from 'googleapis-common'
import { google } from 'googleapis'
import { credentialsPath, tokenPath, youtubeOauthScopes } from '../constants'
import fs from 'fs'
import { sendGuildOwnerQuestion } from './guildOwnerQuestion'

export async function authorize (): Promise<OAuth2Client | Error> {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'))

  const clientSecret = credentials.installed.client_secret
  const clientId = credentials.installed.client_id
  const redirectUrl = credentials.installed.redirect_uris[0]

  const OAuth2 = google.auth.OAuth2
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl)

  if (!fs.existsSync(tokenPath)) {
    const newOauth2Client = await getNewToken(oauth2Client)
    if (newOauth2Client instanceof Error) return newOauth2Client
    return newOauth2Client
  } else {
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
    oauth2Client.credentials = token.tokens
    return oauth2Client
  }
}

async function getNewToken (oauth2Client: OAuth2Client): Promise<OAuth2Client | Error> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: youtubeOauthScopes
  })
  const codeUrl = await sendGuildOwnerQuestion(`Autorize o GD-CLIPS á enviar videos para o YouTube acessando o link: ${authUrl}\nApós autorizar copie o link em que você foi redirecionado e envie aqui: `, 'http://localhost/?code=')
  if (codeUrl instanceof Error) return codeUrl
  const code = codeUrl.split('?')[1].split('=')[1]
  const token = await oauth2Client.getToken(code).catch(console.error)
  if (!token) return new Error('Token is void')
  oauth2Client.credentials = token.tokens
  storeToken(token)
  return oauth2Client
}

function storeToken (token: any): void {
  fs.writeFileSync(tokenPath, JSON.stringify(token))
  console.log('Token stored!')
}
