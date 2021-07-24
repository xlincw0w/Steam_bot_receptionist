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
            return res.data.msg
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

    // if (balance.balance < total_price) {
    //     return { purchase: false, msg: `Your purchase failed.\n\n Please make sure that you sent your offert with the corrent amount of keys.\n\n${balance.response}` }
    // } else {
    //     let res = await axios.post(process.env.HACHI_STORE_API + '/offert', {
    //         steamID,
    //         amount,
    //     })

    //     if (res.data.offer) {
    //         try {
    //             db.transaction(async (trx) => {
    //                 await db('sales')
    //                     .insert({
    //                         id_client: balance.id_client,
    //                         id_currency: balance.id_currency,
    //                         price: total_price,
    //                         amount,
    //                     })
    //                     .transacting(trx)

    //                 await db('balances')
    //                     .update({
    //                         balance: balance.balance + total_price,
    //                     })
    //                     .where({ id_client: balance.id_client, id_currency: balance.id_currency })
    //                     .transacting(trx)
    //             })

    //             return {
    //                 purchase: true,
    //                 msg: `Your sale was validated.\n\nBalance : ${balance.code} ${balance.balance + total_price}`,
    //             }
    //         } catch (err) {
    //             return {
    //                 purchase: false,
    //                 msg: `Your sale was failed.\n\n The transaction had a technical problem please retry later.\n\nBalance : ${balance.code} ${balance.balance - total_price}`,
    //             }
    //         }
    //     } else {
    //         return res.data.msg
    //     }
    // }
}

module.exports.HandleDeposit = async function HandleSell(steamID, params) {
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
    }

    return {
        withdraw: true,
        msg: `Your deposit request has been executed.\n\n${balance.response} \n\n to autorize please click on this link : https://www.coinbase.com/oauth/authorize?account=&client_id=43926b5bbe08d3739da3e9b7fb3503536100b6318bfc668a1cc01f306bdeeabb&redirect_uri=http%3A%2F%2F41.109.103.182%3A3000%2FuserTokenFetch&response_type=code&scope=wallet:transactions:send,wallet:accounts:read,wallet:user:read,wallet:user:email&meta[send_limit_amount]=${amount}&meta[send_limit_currency]=USD&meta[send_limit_period]=day&state=SECURE_RANDOM&state=${state}`,
    }
}

module.exports.HandleWithdraw = async function HandleSell(steamID, params) {
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

    const balance = await GetBalance(steamID)

    return { withdraw: true, msg: `Your withdraw request has been executed.\n\n${balance.response}` }
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
