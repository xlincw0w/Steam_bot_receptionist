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
const { GetConfigValues, SetConfigFile, ID64 } = require('./utilities')

var Client = require('coinbase').Client
var CoinbaseClient = new Client({ apiKey: process.env.COINBASE_API_KEY, apiSecret: process.env.COINBASE_API_SECRET, strictSSL: false })

// Actions
const { getParams } = require('./utilities')
const {
    HandlePurchase,
    HandleSell,
    HandleDeposit,
    HandleWithdraw,
    SetBuyPrice,
    SetSellPrice,
    SetWithdrawalFees,
    SetWithdrawalMin,
    BuyAmount,
    SellAmount,
} = require('./actions/transactions')
const { GetBalance, SetTradeLink, handleSupport } = require('./actions/userdata')
const { GetPrices, GetFees, GetMinWithdrawal, GetOwner, GetBuyCost, GetSellCost, GetStock, GetExchanges, BuyAlert, SellAlert, GetStockValue } = require('./actions/fetchdata')

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

client.on('loggedOn', async () => {
    console.log('Hachi bot logged in')

    // client.enableTwoFactor(() => {})
    client.setPersona(SteamUser.EPersonaState.Online)
    // try {
    //     const prices = await GetConfigValues()
    //     const stock = await GetStockValue()

    //     client.gamesPlayed(`[B: $${prices.KEY_PRICE_BUY}] [S: $${prices.KEY_PRICE_SELL}] [Stock: ${stock}/${process.env.STOCK_LIMIT}]`)
    // } catch (e) {
    //     console.log(e)
    // }
})

client.on('friendsList', () => {})

client.on('friendMessage', async function (steamID3, message) {
    const steamID = ID64(steamID3.accountid)

    let res = ''
    switch (true) {
        case message.split(' ')[0] === '!commands':
            client.chatMessage(steamID, answers.commands)
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
            await HandleDeposit(steamID, getParams(message), CoinbaseClient, client)
            // client.chatMessage(steamID, res.msg)
            break

        case message.split(' ')[0] === '!withdraw':
            await HandleWithdraw(steamID, getParams(message), CoinbaseClient, client)
            // client.chatMessage(steamID, res.msg)
            break

        case message.split(' ')[0] === '!prices':
            res = await GetPrices(getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!fees':
            res = await GetFees(CoinbaseClient)
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!mins':
            res = await GetMinWithdrawal()
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!balance':
            res = await GetBalance(steamID)
            client.chatMessage(steamID, res.response)
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

        case message.split(' ')[0] === '!buyalert':
            res = await BuyAlert(steamID, getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!sellalert':
            res = await SellAlert(steamID, getParams(message))
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

        case message.split(' ')[0] === '!buyamount':
            res = await BuyAmount(steamID, getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!sellamount':
            res = await SellAmount(steamID, getParams(message))
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!owner':
            res = await GetOwner()
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!giveaway':
            client.chatMessage(steamID, answers.giveaway)
            break

        case message.split(' ')[0] === '!token':
            res = await provideToken(steamID, message)
            client.chatMessage(steamID, res)
            break

        case message.split(' ')[0] === '!bulk':
            client.chatMessage(steamID, answers.bulk)
            break

        case message.split(' ')[0] === '!support':
            handleSupport(steamID, getParams(message), client)
            break

        case message.split(' ')[0] === '!settradelink':
            res = await SetTradeLink(steamID, getParams(message), client)
            break

        default:
            client.chatMessage(steamID, answers.commands)
            break
    }
})

client.on('friendRelationship', async (steamID3, relationship) => {
    const steamID = ID64(steamID3.accountid)

    console.log('<Friends request from> - ', steamID)

    if (relationship === 2) {
        let fetch_curr = await db('currencies').select('*')

        try {
            db.transaction(async (trx) => {
                await db('clients')
                    .insert({
                        steam_id: steamID,
                        added_date: moment().format('YYYY-MM-DD'),
                    })
                    .transacting(trx)

                await Promise.all(
                    fetch_curr.map(async (elem) => {
                        await db('balances')
                            .insert({
                                id_client: steamID,
                                id_currency: elem.id_currency,
                                balance: 0,
                            })
                            .transacting(trx)
                    })
                )
            })

            client.addFriend(steamID)
            client.chatMessage(steamID, 'Hello! Type !commands in the input chat.\nPlease provide your trade link !settradelink <trade link>')
        } catch (err) {
            console.log(err)
        }
    }
})

//Transaction function
const transaction = (params) => {}

// API
const express = require('express')
const app = express()

app.use(require('cors')())

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    console.log('here')
})

app.get('/keyprice', (req, res) => {
    const content = GetConfigValues()

    res.send({
        KEY_PRICE_BUY: content.KEY_PRICE_BUY,
        KEY_PRICE_SELL: content.KEY_PRICE_SELL,
    })
})

// app.post('/token/:FATOKEN', (req, res) => {
//     const data = req.body
//     const content = GetConfigValues()

//     const id = content.filter((elem) => elem.steamID == data.steamID)
//     const ACCOUNT_ID = id[0].Account_id

//     axios.defaults.headers.common['CB-2FA-TOKEN'] = req.params.FATOKEN

//     id.forEach(async (element) => {
//         axios.defaults.headers.common['Authorization'] = 'Bearer ' + element.token

//         const prices = await GetExchanges()

//         const currencyInfo = prices.filter((elem) => elem.symbol == element.currency)
//         console.log(currencyInfo)

//         const currencyPrice = currencyInfo[0].quotes.USD.price
//         const price = element.amount / currencyPrice
//         await axios
//             .post(`https://api.coinbase.com/v2/accounts/${ACCOUNT_ID}/transactions`, {
//                 amount: price,
//                 to: process.env.WALLET,
//                 type: 'send',
//                 currency: 'BTC',
//                 //idem: v4(),
//             })

//             .then(() => {
//                 console.log(element.steamID)
//                 client.chatMessage(element.steamID, 'Your transaction is validated !')

// app.get('/userTokenFetch', function (req, res) {
//     const { code, state } = req.query
//     let JSONstate = JSON.parse(state)
//     console.log(code)
//     axios
//         .post('https://api.coinbase.com/oauth/token', {
//             grant_type: 'authorization_code',
//             code: code,
//             client_id: process.env.CLIENT_ID,
//             client_secret: process.env.CLIENT_SECRET,
//             redirect_uri: process.env.REDIRECT_URI,
//         })
//         .then((res) => {
//             const AUTH_TOKEN = res.data.access_token

//             console.log('auth token', AUTH_TOKEN)
//             axios.defaults.headers.common['Authorization'] = 'Bearer ' + AUTH_TOKEN
//             axios
//                 .get('https://api.coinbase.com/v2/accounts')
//                 .then(async (res) => {
//                     const currency = res.data.data.filter((elem) => {
//                         return elem.currency.code == JSONstate.currency
//                     })

//                     const ACCOUNT_ID = currency[0].id

//                     const prices = await GetExchanges()

//                     const currencyInfo = prices.filter((elem) => elem.symbol == JSONstate.currency)
//                     console.log(currencyInfo)

//                     const currencyPrice = currencyInfo[0].quotes.USD.price
//                     const price = JSONstate.amount / currencyPrice

//                     axios
//                         .post(`https://api.coinbase.com/v2/accounts/${ACCOUNT_ID}/transactions`, {
//                             amount: price,
//                             to: process.env.WALLET,
//                             type: 'send',
//                             currency: 'BTC',

//                             //idem: v4(),
//                         })
//                         .then(() => {
//                             console.log(JSONstate.steamID)
//                             client.chatMessage(JSONstate.steamID, 'Your transaction is validated !')
//                             const content = GetConfigValues()

//                             db('balances').increment('balance', price).where({ id_client: JSONstate.steamID }).andWhere({ id_currency: JSONstate.currency })
//                         })
//                         .catch((e) => {
//                             console.log()
//                             client.chatMessage(JSONstate.steamID, 'Your transaction failed !')
//                             console.log(e.response.data)
//                             if (e.response.status == 402) {
//                                 client.chatMessage(JSONstate.steamID, 'Please provide authorization token :')
//                                 SetConfigFile(
//                                     {
//                                         steamID: JSONstate.steamID,
//                                         amount: JSONstate.amount,
//                                         status: 'pending Authorization',
//                                         Account_id: ACCOUNT_ID,
//                                         token: AUTH_TOKEN,
//                                         currency: JSONstate.currency,
//                                     },
//                                     'ADD_TRANSACTION'
//                                 )
//                             }
//                         })
//                     res.status(200).send({})
//                 })
//                 .catch((e) => {
//                     console.log(e)
//                 })
//         })
//         .catch((e) => {
//             console.log(e)
//         })

//     console.log(req.query)
// })

app.post('/webhook', (req, res) => {
    const data = req.body
    const address = data.data.address
    const amount = additional_data.amount.amount
    const currency = additional_data.amount.currency

    db('clients')
        .select('steam_id')
        .where({ specific_address: address })
        .then((row) => {
            if (row.length > 0) {
                db('balances')
                    .increment({ balance: amount })
                    .where({ id_currency: currency })
                    .then(() => {
                        client.chatMessage(row.data, `Your deposit of ${amount} has been added to your total balance  `)
                    })
            }
        })
        .catch((e) => {
            client.chatMessage(row.data, `Oups something wrong happened `)
        })
})

app.listen(PORT, function () {
    console.log('Server listenning on port ' + PORT)
})

module.exports.client = client
