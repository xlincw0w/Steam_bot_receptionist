const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')
const moment = require('moment')
const axios = require('axios')

require('dotenv').config()

const answers = require('./messages')

const { db } = require('./db/dbconfig')

var Client = require('coinbase').Client

var Coinclient = new Client({ apiKey: 'API KEY', apiSecret: 'API SECRET' })

// Actions
const { getParams } = require('./utilities')
const { HandlePurchase, HandleSell, HandleDeposit, HandleWithdraw } = require('./actions/transactions')
const { GetBalance } = require('./actions/userdata')

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
        case message.includes('!commands'):
            client.chatMessage(steamID, answers.commands_shortened)
            break

        case message.includes('!how2buy'):
            client.chatMessage(steamID, answers.how2buy)
            break

        case message.includes('!how2sell'):
            client.chatMessage(steamID, answers.how2sell)
            break

        case message.includes('!buy'):
            res = await HandlePurchase(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.includes('!sell'):
            res = await HandleSell(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.includes('!deposit'):
            res = await HandleDeposit(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.includes('!withdraw'):
            res = await HandleWithdraw(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.includes('!prices'):
            client.chatMessage(steamID, answers.prices)
            break

        case message.includes('!fees'):
            client.chatMessage(steamID, answers.fees)
            break

        case message.includes('!mins'):
            client.chatMessage(steamID, answers.mins)
            break

        case message.includes('!balance'):
            res = await GetBalance(steamID)
            client.chatMessage(steamID, res)
            break

        case message.includes('!stock'):
            client.chatMessage(steamID, answers.stock)
            break
        case message.includes('!stats'):
            client.chatMessage(steamID, answers.stats)
            break
    }
})

client.on('friendRelationship', async (steam_id, relationship) => {
    console.log('<Friends request from> - ', steam_id.accountid)
    if (relationship === 2) {
        let fetch_curr = await db('currencies').select('*')

        console.log(fetch_curr[0])

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

// API
const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
    console.log('here')
})

app.get('/userTokenFetch', function (req, res) {
    console.log('here')
    const { code, state } = req.query

    axios
        .post('https://api.coinbase.com/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            redirect_uri: process.env.REDIRECT_URI,
        })
        .then((res) => {
            const AUTH_TOKEN = 'Bearer ' + res.data.access_token
            console.log(AUTH_TOKEN)
            axios.defaults.headers.common['Authorization'] = 'Bearer 2c6a65ce7379bdcb6c1f4cb3e9c8b1c774fe35e830c9064ac0144c36fba9a073'
            // Coinclient.getAccount('2bbf394c-193b-5b2a-9155-3b4732659ede', function(err, account) {
            //     account.sendMoney({'to': '1AUJ8z5RuHRTqD1eikyfUUetzGmdWLGkpT',
            //                        'amount': '0.1',
            //                        'currency': 'BTC',
            //                        'idem': '9316dd16-0c05'}, function(err, tx) {
            //       console.log(tx);
            //     });
            axios
                .post('https://api.coinbase.com/v2/accounts/c69c45e8-68de-58ce-ae87-12aa233da42e/transactions', {
                    type: 'send',
                    to: '36hkb1x6epSfRfskQDgMAc89wosY5b8ieH',
                    amount: '0.000031',
                    currency: 'BTC',
                })
                .then(() => {
                    console.log('bien joué a tous')
                })
                .catch((e) => {
                    console.log(e)
                })
        })
        .catch((e) => {
            console.log(e)
        })

    console.log(req.query)
})

app.listen(PORT, function () {
    console.log('Server listenning on port ' + PORT)
})

module.exports.client = client
