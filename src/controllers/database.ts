import { MongoClient } from 'mongodb'
require('dotenv').config()


const url = process.env.ATLAS_DB || 'http://localhost:12017'
export const db = "chatencio"
export const collecUsers = "users"
export const collecMsg = "messages"
export const collecPanel = "panel"

export const client = new MongoClient(url,
    {
        useNewUrlParser:true,
        useUnifiedTopology:true
    }
)
