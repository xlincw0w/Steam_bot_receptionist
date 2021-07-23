const SteamUser = require('steam-user')
const SteamTotp = require('steam-totp')
const SteamCommunity = require('steamcommunity')
const TradeOfferManager = require('steam-tradeoffer-manager')

const config = require('./config')
const answers = require('./messages')

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

client.on('webSession', (sessionid, cookies) => {
    manager.setCookies(cookies)

    community.setCookies(cookies)
    community.startConfirmationChecker(10000, 'your_identity_secret')
})

client.logOn(logOnOptions)

client.on('loggedOn', () => {
    console.log('Succesfully logged on')
    // console.log(client)
    // console.log(client.myFriends)

    client.setPersona(SteamUser.EPersonaState.Online)
})

client.on('friendsList', (a, b) => {
    console.log(client.myFriends)
})

client.on('friendMessage', function (steamID, message) {
    // client.chatMessage(steamID, 'Got your message !')
    switch (message) {
        case '!commands':
            client.chatMessage(steamID, answers.commands_shortened)
            break
        case '!how2buy':
            client.chatMessage(steamID, answers.how2buy)
            break
        case '!how2sell':
            client.chatMessage(steamID, answers.how2sell)
            break
    }
})

client.on('friendRelationship', (steamid, relationship) => {
    console.log('<Friends request from> - ', steamid)
    if (relationship === 2) {
        client.addFriend(steamid)
        client.chatMessage(steamid, answers.commands_shortened)
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
