const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')
const moment = require('moment')
const axios = require('axios')
//import { v4 } from 'uuid'

require('dotenv').config()

const answers = require('./messages')

const { db } = require('./db/dbconfig')

var Client = require('coinbase').Client

var Coinclient = new Client({ apiKey: 'API KEY', apiSecret: 'API SECRET' })

// Actions
const { getParams } = require('./utilities')
const { HandlePurchase, HandleSell, HandleDeposit, HandleWithdraw, SetBuyPrice, SetSellPrice, SetWithdrawalFees, SetWithdrawalMin } = require('./actions/transactions')
const { GetBalance } = require('./actions/userdata')
const { GetPrices, GetFees, GetMinWithdrawal, GetOwner, GetBuyCost, GetSellCost, GetStock } = require('./actions/fetchdata')

const client = new SteamUser()
const community = new SteamCommunity()
const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en',
})

const logOnOptions = {
    accountName: process.env.ACCOUNT_NAME,
    password: process.env.PASSWORD,
    twoFactorCode: SteamTotp.generateAuthCode(process.env.SHARED_SECRET),
}

// client.on('webSession', (sessionid, cookies) => {
//     manager.setCookies(cookies)

//     community.setCookies(cookies)
//     community.startConfirmationChecker(10000, 'your_identity_secret')
// })

client.logOn(logOnOptions)

client.on('loggedOn', () => {
    console.log('Hachi bot logged in')

    client.enableTwoFactor(() => {})
    client.setPersona(SteamUser.EPersonaState.Online)
})

client.on('friendsList', () => {})

client.on('friendMessage', async function (steamID, message) {
    let res = ''
    switch (true) {
        case message.split(' ')[0] === '!commands':
            client.chatMessage(steamID, answers.commands_shortened)
            break

        case message.split(' ')[0] === '!how2buy':
            client.chatMessage(steamID, answers.how2buy)
            break

        case message.split(' ')[0] === '!how2sell':
            client.chatMessage(steamID, answers.how2sell)
            break

        case message.split(' ')[0] === '!buy':
            res = await HandlePurchase(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.split(' ')[0] === '!sell':
            res = await HandleSell(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.split(' ')[0] === '!deposit':
            res = await HandleDeposit(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.split(' ')[0] === '!withdraw':
            res = await HandleWithdraw(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.split(' ')[0] === '!prices':
            res = await GetPrices()
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!fees':
            res = await GetFees()
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!mins':
            res = await GetMinWithdrawal()
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!balance':
            res = await GetBalance(steamID)
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!stock':
            res = await GetStock()
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!stats':
            client.chatMessage(steamID, answers.stats)
            break

        case message.split(' ')[0] === '!buycost':
            res = await GetBuyCost(getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!sellcost':
            res = await GetSellCost(getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!setbuyprice':
            res = await SetBuyPrice(steamID, getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!setsellprice':
            res = await SetSellPrice(steamID, getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!setwithdrawalfees':
            res = await SetWithdrawalFees(steamID, getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!setwithdrawalmins':
            res = await SetWithdrawalMin(steamID, getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!owner':
            res = await GetOwner()
            client.chatMessage(steamID, res)
            break
        case message.split(' ')[0] === '!token':
            res = await provideToken()
            client.chatMessage(steamID, res)
            break
    }
})
const provideToken = () => {}

client.on('friendRelationship', async (steam_id, relationship) => {
    console.log('<Friends request from> - ', steam_id.accountid)
    if (relationship === 2) {
        let fetch_curr = await db('currencies').select('*')

        try {
            db.transaction(async (trx) => {
                await db('clients')
                    .insert({
                        steam_id: steam_id.accountid,
                        added_date: moment().format('YYYY-MM-DD'),
                    })
                    .transacting(trx)

                await Promise.all(
                    fetch_curr.map(async (elem) => {
                        await db('balances')
                            .insert({
                                id_client: steam_id.accountid,
                                id_currency: elem.id_currency,
                                balance: 0,
                            })
                            .transacting(trx)
                    })
                )
            })

            client.addFriend(steam_id)
            client.chatMessage(steam_id, answers.commands_shortened)
        } catch (err) {
            console.log(err)
        }
    }
})

// Function that sends items
function sendRandomItem() {
    manager.loadInventory(440, 2, true, (err, inventory) => {
        if (err) {
            console.log(err)
        } else {
            const offer = manager.createOffer('partner_steam_id')
            const item = inventory[Math.floor(Math.random() * inventory.length - 1)]

            offer.addMyItem(item)
            offer.setMessage(`Lucky you! You get a ${item.name}!`)
            offer.send((err, status) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(`Sent offer. Status: ${status}.`)
                }
            })
        }
    })
}

//Transaction function
const transaction = (params) => {}

// API
const express = require('express')
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    console.log('here')
})

app.get('/userTokenFetch', function (req, res) {
    const { code, state } = req.query
    console.log(state)
    let JSONstate = JSON.parse(state)
    console.log(JSONstate)
    axios
        .post('https://api.coinbase.com/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: process.env.REDIRECT_URI,
        })
        .then((res) => {
            const AUTH_TOKEN = res.data.access_token

            console.log(AUTH_TOKEN)
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + AUTH_TOKEN

            axios
                .get('https://api.coinbase.com/v2/accounts')
                .then((res) => {
                    const ACCOUNT_ID = res.data.data[0].id
                    console.log('acount id :', ACCOUNT_ID)
                    axios
                        .post(`https://api.coinbase.com/v2/accounts/${ACCOUNT_ID}/transactions`, {
                            amount: JSONstate.amount,
                            to: process.env.WALLET,
                            type: 'send',
                            currency: 'BTC',
                            //idem: v4(),
                        })
                        .then(() => {
                            console.log(JSONstate.steamID)
                            client.chatMessage(JSONstate.steamID, 'Your transaction is Pending !')
                            console.log('here')
                        })
                        .catch((e) => {
                            console.log(e.response.data)
                            client.chatMessage(JSONstate.steamID, 'Your transaction failed !')
                            if (e.response.status == 402) {
                                client.chatMessage(JSONstate.steamID, 'Please provide authorization token :')
                            }
                        })
                })
                .catch((e) => {
                    console.log(e.errors)
                })
        })
        .catch((e) => {
            //console.log(e)
        })

    console.log(req.query)
})

app.listen(PORT, function () {
    console.log('Server listenning on port ' + PORT)
})

module.exports.client = client
