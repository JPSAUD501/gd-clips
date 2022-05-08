import dotenv from 'dotenv'
import YAML from 'yaml'
import fs from 'fs'
import Discord from 'discord.js'
import { IgApiClient } from 'instagram-private-api'

dotenv.config()

const discordTokenVerification = process.env['DISCORD-TOKEN']
if (!discordTokenVerification) throw new Error('DISCORD-TOKEN environment variable not set')
const instagramUsernameVerification = process.env['INSTAGRAM-USERNAME']
if (!instagramUsernameVerification) throw new Error('INSTAGRAM-USERNAME environment variable not set')
const instagramPasswordVerification = process.env['INSTAGRAM-PASSWORD']
if (!instagramPasswordVerification) throw new Error('INSTAGRAM-PASSWORD environment variable not set')

// Constants

export const client = new Discord.Client({ // Discord Client
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

export const igClient = new IgApiClient() // Instagram Client

export const discordToken = discordTokenVerification // Discord token from .ENV
export const instagramUsername = instagramUsernameVerification // Instagram Username token from .ENV
export const instagramPassword = instagramPasswordVerification // Instagram Password token from .ENV
export const maxNameLowerThirdLength = 9 // Unless you change the html template, this is the max length of the author name in the lower third
export const maxNameThumbnailLength = 9 // Unless you change the html template, this is the max length of the author name in the thumbnail
export const interactionCustomIdSeparator = '@' // I don't recommend changing this
export const rootDbPath = 'db' // Root path for the database
export const credentialsPath = 'youtube-auth/client_secret.json' // Root path for the youtube client secret
export const tokenPath = 'youtube-auth/client_oauth_token.json' // Root path for the youtube oauth token
export const youtubeOauthScopes = ['https://www.googleapis.com/auth/youtube.upload'] // Youtube auth scopes
export const config = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'))
