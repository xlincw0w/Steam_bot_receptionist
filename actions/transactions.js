const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { GetBalance } = require('./userdata')
const { find } = require('lodash')

const { GetConfigValues, SetConfigFile } = require('../utilities')
const { GetExchanges } = require('./fetchdata')

const axios = require('axios')
const { db } = require('../db/dbconfig')

module.exports.HandlePurchase = async function HandlePurchase(steamID, params) {
    if (params.length !== 3) return { purchase: false, msg: 'Invalid parameters\n\nPlease make sure you type !buy <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { purchase: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }
    if (!find(currencies, { code: params[2].toUpperCase() }))
        return { purchase: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = parseInt(params[1])
    let currency = params[2].toUpperCase()

    console.log(currency, amount)

    let balance = await GetBalance(steamID)
    balance = balance.array.filter((elem) => elem.code === currency)[0]

    let exchange = await GetExchanges()
    exchange = exchange.filter((elem) => elem.symbol === currency)[0]

    let config = GetConfigValues()

    const total_price = (1 / exchange.quotes.USD.price) * config.KEY_PRICE_BUY * amount

    if (balance.balance < total_price) {
        return { purchase: false, msg: `Your purchase failed.\n\n Your balance is low please consider a withdrawal !withdraw for more information.\n\n${balance.response}` }
    } else {
        let res = await axios.post(process.env.HACHI_STORE_API + '/trade', {
            steamID,
            amount,
        })

        if (res.data.trade === 'accepted') {
            try {
                db.transaction(async (trx) => {
                    await db('purchases')
                        .insert({
                            id_client: balance.id_client,
                            id_currency: balance.id_currency,
                            price: total_price,
                            amount,
                        })
                        .transacting(trx)

                    await db('balances')
                        .update({
                            balance: balance.balance - total_price,
                        })
                        .where({ id_client: balance.id_client, id_currency: balance.id_currency })
                        .transacting(trx)
                })

                return {
                    purchase: true,
                    msg: `Your purchase was validated.\n\n An offer has been sent to you account.\n\nBalance : ${balance.code} ${balance.balance - total_price}`,
                }
            } catch (err) {
                return {
                    purchase: false,
                    msg: `Your purchase was failed.\n\n The transaction had a technical problem please retry later.\n\nBalance : ${balance.code} ${balance.balance - total_price}`,
                }
            }
        } else {
            return { msg: res.data.msg }
        }
    }
}

module.exports.HandleSell = async function HandleSell(steamID, params) {
    if (params.length !== 3) return { pending: false, msg: 'Invalid parameters\n\nPlease make sure you type !sell <key amount> <cryptocurrency>.' }
    if (!constants.num_rg.test(params[1])) return { pending: false, msg: 'Invalid parameters\n\n<key amount> should be a number' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }
    if (!find(currencies, { code: params[2].toUpperCase() })) return { pending: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)
    let balance = await GetBalance(steamID)
    balance = balance.array.filter((elem) => elem.code === currency)[0]

    let exchange = await GetExchanges()
    exchange = exchange.filter((elem) => elem.symbol === currency)[0]

    let config = GetConfigValues()

    const total_price = (1 / exchange.quotes.USD.price) * config.KEY_PRICE_SELL * amount

    try {
        db.transaction(async (trx) => {
            await db('sales')
                .insert({
                    id_supplier: balance.id_client,
                    id_currency: balance.id_currency,
                    price: total_price,
                    state: 'pending',
                    amount,
                })
                .transacting(trx)

            await db('balances')
                .update({
                    balance: balance.balance + total_price,
                })
                .where({ id_client: balance.id_client, id_currency: balance.id_currency })
                .transacting(trx)
        })
        return {
            purchase: true,
            msg: `Your sale is in a pending state.\n\nPlease sent a trade offert here with ${amount} keys on it\nTrade link : https://steamcommunity.com/tradeoffer/new/?partner=1232482096&token=yicdXQMK`,
        }
    } catch (err) {
        console.log(err)
        return {
            purchase: false,
            msg: `Your sale was failed.\n\n The transaction had a technical problem please retry later.\n\nBalance : ${balance.code} ${balance.balance - total_price}`,
        }
    }
}

module.exports.HandleDeposit = async function HandleSell(steamID, params, client) {
    if (params.length !== 3) return { deposit: false, msg: 'Invalid parameters\n\nPlease make sure you type !deposit <crypto amount> <cryptocurrency>.' }
    if (!constants.float_rg.test(params[1])) return { deposit: false, msg: 'Invalid parameters\n\n<crypto amount> should be a real' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { deposit: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }
    if (!find(currencies, { code: params[2].toUpperCase() })) return { deposit: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(currency, amount)

    const balance = await GetBalance(steamID)
    const state = {
        amount: amount,
        steamID: steamID,
        currency: currency,
    }

    const WalletAccount = await client.getAccounts({}, function (err, accounts) {
        const account = accounts.data.filter((elem) => elem.currency == currency)
        return account
    })

    const address = await client.getAccount(process.env.CLIENT_ID, async function (err, account) {
        const address = await WalletAccount.createAddress(null, function (err, address) {
            return address.data.address
        })
        return address
    })
    db('clients').update({ specific_address: address }).where({ steam_id: steamID })

    return {
        withdraw: true,
        msg: `Your deposit request has been executed.\n\n${balance.response} \n\n Wallet Address :${address}}`,
    }
}

module.exports.HandleWithdraw = async function HandleSell(steamID, params, client) {
    let address_or_email = null

    if (params.length !== 4) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !withdraw <crypto amount> <cryptocurrency> <address/coinbase email>.' }
    if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n<crypto amount> should be a real' }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code }

    constants.email_rg.test(params[3]) ? (address_or_email = 'coinbase_email') : (address_or_email = 'address')

    if (!find(currencies, { code: params[2].toUpperCase() }))
        return { withdraw: false, msg: 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code }

    let amount = params[1]
    let currency = params[2].toUpperCase()

    console.log(address_or_email)
    console.log(currency, amount)

    db('balances')
        .select('balance')
        .where({ id_client: steamID })
        .andWhere({ id_currency: params[2] })
        .limit(1)
        .then((row) => {
            if (row.data >= props[1]) {
                client.getAccount(process.env.ACCOUNT_ID, function (err, account) {
                    account.sendMoney({ to: params[3], amount: params[1], currency: params[2] }, function (err, tx) {
                        client.chatMessage(steamID, 'your withdraw has been successful')
                        db('balances')
                            .decrement({
                                balance: params[1],
                            })
                            .where({ id_client: steamID })
                            .andWhere({ id_currency: params[2] })
                            .then(() => console.log('sucess'))
                    })
                })
            } else {
                client.chatMessage(steamID, 'Your balance is too low')
            }
        })
        .catch((e) => {
            client.chatMessage(steamID, 'Oups an error has occured')
        })
}

module.exports.SetBuyPrice = async function SetBuyPrice(steamID, params) {
    console.log(steamID)
    console.log('Admin', process.env.ADMIN_STEAMID64)
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setsellprice <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'KEY_PRICE_BUY')

        return `Admin : \n\n✹ Buy price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}

module.exports.SetSellPrice = async function SetSellPrice(steamID, params) {
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setsellprice <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'KEY_PRICE_SELL')

        return `Admin : \n\n✹ Sell price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}

module.exports.SetWithdrawalFees = async function SetWithdrawalFees(steamID, params) {
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setwithdrawalfees <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'WITHDRAWAL_FEES')

        return `Admin : \n\n✹ Buy price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}

module.exports.SetWithdrawalMin = async function SetWithdrawalMin(steamID, params) {
    if (steamID == process.env.ADMIN_STEAMID64) {
        if (params.length !== 2) return { withdraw: false, msg: 'Invalid parameters\n\nPlease make sure you type !setwithdrawalmins <price>.' }
        if (!constants.float_rg.test(params[1])) return { withdraw: false, msg: 'Invalid parameters\n\n Price should be a real' }

        SetConfigFile(parseFloat(params[1]), 'WITHDRAWAL_MINS')

        return `Admin : \n\n✹ Sell price updated to ${params[1]}`
    } else {
        return `Admin : \n\n✹ Operation not allowed !`
    }
}
