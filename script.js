const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')
const moment = require('moment')

const config = require('./config')
const answers = require('./messages')

const { db } = require('./db/dbconfig')

// Actions
const { getParams } = require('./utilities')
const { HandlePurchase, HandleSell } = require('./actions/transactions')
const { GetBalance } = require('./actions/userdata')

const client = new SteamUser()
const community = new SteamCommunity()
const manager = new TradeOfferManager({
    steam: client,
    community: community,
    language: 'en',
})

const logOnOptions = {
    accountName: config.accountName,
    password: config.password,
    // twoFactorCode: SteamTotp.generateAuthCode(config.sharedSecret),
}

// client.on('webSession', (sessionid, cookies) => {
//     manager.setCookies(cookies)

//     community.setCookies(cookies)
//     community.startConfirmationChecker(10000, 'your_identity_secret')
// })

client.logOn(logOnOptions)

client.on('loggedOn', () => {
    console.log('Hachi bot logged in')
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
            res = HandlePurchase(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.includes('!sell'):
            res = HandleSell(steamID, getParams(message))
            client.chatMessage(steamID, res.msg)
            break

        case message.includes('!deposit'):
            client.chatMessage(steamID, answers.deposit)
            break

        case message.includes('!withdraw'):
            client.chatMessage(steamID, answers.withdraw)
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

module.exports.client = client
