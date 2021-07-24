const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')
const moment = require('moment')
const axios = require('axios')
const { v4 } = require('uuid')

require('dotenv').config()

const answers = require('./messages')

const { db } = require('./db/dbconfig')
const { GetConfigValues, SetConfigFile } = require('./utilities')

var Client = require('coinbase').Client

var Coinclient = new Client({ apiKey: 'API KEY', apiSecret: 'API SECRET' })

// Actions
const { getParams } = require('./utilities')
const { HandlePurchase, HandleSell, HandleDeposit, HandleWithdraw, SetBuyPrice, SetSellPrice, SetWithdrawalFees, SetWithdrawalMin } = require('./actions/transactions')
const { GetBalance } = require('./actions/userdata')
const { GetPrices, GetFees, GetMinWithdrawal, GetOwner, GetBuyCost, GetSellCost, GetStock, GetExchanges } = require('./actions/fetchdata')

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
            res = await SetBuyPrice(getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!setsellprice':
            res = await SetSellPrice(getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!owner':
            res = await GetOwner()
            client.chatMessage(steamID, res)
            break
        case message.split(' ')[0] === '!token':
            res = await provideToken(steamID, message)
            client.chatMessage(steamID, res)
            break
    }
})

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

app.post('/token/:FATOKEN', (req, res) => {
    const data = req.body
    const content = GetConfigValues()

    const id = content.filter((elem) => elem.steamID == data.steamID)
    const ACCOUNT_ID = id[0].Account_id

    axios.defaults.headers.common['CB-2FA-TOKEN'] = req.params.FATOKEN

    id.forEach(async (element) => {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + element.token
        await axios
            .post(`https://api.coinbase.com/v2/accounts/${ACCOUNT_ID}/transactions`, {
                amount: element.amount,
                to: process.env.WALLET,
                type: 'send',
                currency: 'BTC',
                //idem: v4(),
            })
            .then(() => {
                console.log(element.steamID)
                client.chatMessage(element.steamID, 'Your transaction is validated !')
                const content = GetConfigValues()
                db('purchases')
                    .insert({ id_client: element.steamID, id_currency: 'BTC', amount: JSONstate.amount, price: content.KEY_PRICE_BUY, state: 'Validated' })
                    .catch((e) => {
                        console.log(e)
                    })
                return
            })
    }).catch((e) => {
        client.chatMessage(element.steamID, 'Your token is not accurate!')
    })
})

app.get('/userTokenFetch', function (req, res) {
    const { code, state } = req.query
    let JSONstate = JSON.parse(state)
    console.log(code)
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

            console.log('auth token', AUTH_TOKEN)
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + AUTH_TOKEN

            axios
                .get('https://api.coinbase.com/v2/accounts')
                .then(async (res) => {
                    const currency = res.data.data.filter((elem) => elem.currency.code === JSONstate.currency)
                    const ACCOUNT_ID = currency[0].id
                    console.log('acount id :', ACCOUNT_ID)
                    const prices = await GetExchanges()

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
                            client.chatMessage(JSONstate.steamID, 'Your transaction is validated !')
                            const content = GetConfigValues()

                            db('balances').increment('balance', JSONstate.amount)
                        })
                        .catch((e) => {
                            console.log()
                            client.chatMessage(JSONstate.steamID, 'Your transaction failed !')
                            console.log(e.response.data)
                            if (e.response.status == 402) {
                                client.chatMessage(JSONstate.steamID, 'Please provide authorization token :')
                                SetConfigFile(
                                    {
                                        steamID: 'JSONstate.steamID',
                                        amount: 'JSONstate.amount',
                                        status: 'pending Authorization',
                                        Account_id: ACCOUNT_ID,
                                        token: AUTH_TOKEN,
                                    },
                                    'ADD_TRANSACTION'
                                )
                            }
                        })
                    res.status(200)
                })
                .catch((e) => {
                    console.log(e.errors)
                })
        })
        .catch((e) => {
            console.log(e.response.data)
        })

    console.log(req.query)
})

app.listen(PORT, function () {
    console.log('Server listenning on port ' + PORT)
})

module.exports.client = client
