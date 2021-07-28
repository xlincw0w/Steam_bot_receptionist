const { constants } = require('../utilities')
const { GetCurrencies } = require('../utilities')
const { GetBalance } = require('./userdata')
const { find } = require('lodash')

const { GetConfigValues, SetConfigFile } = require('../utilities')
const { GetExchanges, GetStockValue } = require('./fetchdata')

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
        return {
            purchase: false,
            msg: `Your purchase failed.\n\n You dont have enough balance to buy ${amount} keys!\n It costs ${config.KEY_PRICE_BUY * amount} $ or ${(
                (config.KEY_PRICE_BUY / exchange.quotes.USD.price) *
                amount
            ).toFixed(8)} ${exchange.symbol}\nmeanwhile you only have ${balance.balance.toFixed(8)} BTC.`,
        }
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
                    msg: `Your purchase was validated.\n\n It cost ${amount * config.KEY_PRICE_BUY} $ or ${total_price.toFixed(
                        8
                    )} BTC for ${amount} Keys\nAn offer has been sent to you account.\n\nBalance : ${balance.code} ${balance.balance - total_price}`,
                }
            } catch (err) {
                console.log(err)
                return {
                    purchase: false,
                    msg: `Your purchase was failed.\n\n The transaction had a technical problem please retry later.\n\nBalance : ${balance.code} ${(
                        balance.balance - total_price
                    ).toFixed(8)}`,
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
    const stock = await GetStockValue()

    const total_price = (1 / exchange.quotes.USD.price) * config.KEY_PRICE_SELL * amount

    if (stock + amount > process.env.STOCK_LIMIT) {
        return {
            purchase: false,
            msg: `Your sale failed.\n\n Stock limit reached.`,
        }
    } else {
        let res = await axios.post(process.env.HACHI_STORE_API + '/sell', {
            steamID,
            amount,
        })

        if (res.data.trade === 'accepted') {
            return {
                sell: true,
                msg: `An offer with ${amount} keys was sent\n\n Please make sure you confirm that on your phone.`,
            }
        } else {
            return {
                sell: true,
                msg: `An error occured\n\n Make sure you have ${amount} keys in your inventory`,
            }
        }
    }
}

module.exports.HandleDeposit = async function HandleSell(steamID, params, client, clientSteam) {
    if (params.length !== 2) {
        clientSteam.chatMessage(steamID, 'Invalid parameters\n\nPlease make sure you type !deposit <cryptocurrency>.')
        return false
    }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[1])) {
        clientSteam.chatMessage(steamID, 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code)
        return false
    }
    if (!find(currencies, { code: params[1].toUpperCase() })) {
        clientSteam.chatMessage(steamID, 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code)
        return false
    }

    let currency = params[1].toUpperCase()

    client.getAccounts({}, async function (err, accounts) {
        if (err) {
            console.log(err)
        } else {
            const WalletAccount = accounts.filter((elem) => {
                //console.log(elem.currency)
                return elem.currency == currency
            })
            console.log(WalletAccount[0])

            client.getAccount(WalletAccount[0].id, async function (err, account) {
                account.createAddress(null, function (err, address) {
                    console.log(address)
                    if (err) {
                        console.log(err)
                    } else {
                        db('clients')
                            .update({ specific_address: address.address })
                            .where({ steam_id: steamID })
                            .catch((e) => console.log(e))
                        clientSteam.chatMessage(steamID, `In order to deposit, you can send ANY amount you want to your personal address :\n${address.address}`)
                    }
                })
                // if (err) {
                //     console.log('ee')
                //     console.log(err)
                // } else {
                //     WalletAccount.createAddress(null, function (err, address) {
                //         if (err) {
                //             console.log('dd')
                //             console.log(err)
                //         } else {
                //             console.log(address)
                //             db('clients').update({ specific_address: address.data.address }).where({ steam_id: steamID })
                //         }
                //     })
                // }
            })
        }
    })
}

module.exports.HandleWithdraw = async function HandleSell(steamID, params, client, clientSteam) {
    let address_or_email = null

    if (params.length !== 4) {
        clientSteam.chatMessage(steamID, 'Invalid parameters\n\nPlease make sure you type !withdraw <crypto amount> <cryptocurrency> <address/coinbase email>.')
        return false
    }

    if (!constants.float_rg.test(params[1])) {
        clientSteam.chatMessage(steamID, 'Invalid parameters\n\n<crypto amount> should be a real')
        return false
    }

    const currencies = await GetCurrencies()
    if (!constants.alph_rg.test(params[2])) {
        clientSteam.chatMessage(steamID, 'Invalid parameters\n\n<cryptocurrency> should be a currency\nExample ' + currencies[0].code)
        return false
    }

    constants.email_rg.test(params[3]) ? (address_or_email = 'coinbase_email') : (address_or_email = 'address')

    if (!find(currencies, { code: params[2].toUpperCase() })) {
        clientSteam.chatMessage(steamID, 'Invalid parameters\n\n<cryptocurrency> does not exist\nExample ' + currencies[0].code)
        return false
    }

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
            if (row[0].balance >= params[1]) {
                client.getAccounts({}, async function (err, accounts) {
                    if (err) {
                        console.log(err)
                    } else {
                        const WalletAccount = accounts.filter((elem) => {
                            return elem.currency == currency
                        })

                        client.getAccount(WalletAccount[0].id, function (err, account) {
                            account.sendMoney({ to: params[3], amount: params[1], currency: params[2] }, function (err, tx) {
                                if (!err) {
                                    clientSteam.chatMessage(steamID, 'your withdraw has been successful')
                                    db('balances')
                                        .decrement({
                                            balance: params[1],
                                        })
                                        .where({ id_client: steamID })
                                        .andWhere({ id_currency: params[2] })
                                        .then(() => console.log('sucess'))
                                } else {
                                    clientSteam.chatMessage(steamID, 'Please provide a valid withdraw address')
                                }
                            })
                        })
                    }
                })
            } else {
                clientSteam.chatMessage(steamID, 'Your balance is too low')
            }
        })
        .catch((e) => {
            console.log(e)
            clientSteam.chatMessage(steamID, 'Oups an error has occured')
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

module.exports.BuyAmount = async function BuyAmount(steamID, params) {
    if (params.length === 3) {
        let { KEY_PRICE_BUY, KEY_PRICE_SELL } = GetConfigValues()

        let data = await GetExchanges()
        data = data.filter((elem) => elem.symbol === params[2].toUpperCase())

        console.log(KEY_PRICE_BUY)
        console.log(data)

        return `With ${params[1]} ${params[2]}\nBuy price : ${KEY_PRICE_BUY}\n\nYou can get ${Math.floor(params[1] / (KEY_PRICE_BUY / data[0].quotes.USD.price))} keys`
    } else {
        return 'Incorrect parameters !buyamount <crypto amount> <cryptocurrency>'
    }
}

module.exports.SellAmount = async function SellAmount(steamID, params) {
    if (params.length === 3) {
        let { KEY_PRICE_BUY, KEY_PRICE_SELL } = GetConfigValues()

        let data = await GetExchanges()
        data = data.filter((elem) => elem.symbol === params[2].toUpperCase())

        return `To get ${params[1]} ${params[2]}\nBuy price : ${KEY_PRICE_SELL}\n\nYou need ${Math.floor(params[1] / (KEY_PRICE_SELL / data[0].quotes.USD.price))} keys`
    } else {
        return 'Incorrect parameters !buyamount <crypto amount> <cryptocurrency>'
    }
}
