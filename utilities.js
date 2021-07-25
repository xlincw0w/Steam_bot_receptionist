const { db } = require('./db/dbconfig')
const fs = require('fs')
const SID = require('steamid')

module.exports = {
    getParams: function getParams(message) {
        return message.split(' ')
    },

    ID64: (accountid) => {
        return new SID.fromIndividualAccountID(accountid).getSteamID64()
    },

    GetCurrencies: () => db('currencies').select('code'),
    SetConfigFile: (value, change) => {
        const file_content = fs.readFileSync('./config.json')
        const content = JSON.parse(file_content)

        switch (change) {
            case 'KEY_PRICE_BUY':
                content.KEY_PRICE_BUY = value
                break
            case 'KEY_PRICE_SELL':
                content.KEY_PRICE_SELL = value
                break
            case 'WITHDRAWAL_FEES':
                content.WITHDRAWAL_FEES = value
                break
            case 'WITHDRAWAL_MIN':
                content.WITHDRAWAL_MIN = value
                break
            case 'ADD_TRANSACTION':
                const index = content.transactions.indexOf((elem) => elem.steamID == value.steamID)
                if (index == -1) {
                    content.transactions.push(value)
                } else {
                    content.transactions.slice(index)
                    content.transactions.push(value)
                }

            case 'SUPP_TRANSACTION':
                content.transactions.filter((elem) => elem.steamID != value)
        }

        fs.writeFileSync('./config.json', JSON.stringify(content))
    },
    GetConfigValues: () => {
        const file_content = fs.readFileSync('./config.json')
        const content = JSON.parse(file_content)

        return content
    },

    price: 2.5,
    constants: {
        // regex
        username_rg: /^[A-Za-z]+[A-Za-z0-9 ]*$/,
        alph_rg: /^[A-Za-zéàè]+[A-Za-zéàè]*$/,
        alphanum_rg: /^[A-Za-zéàè0-9 ]+[A-Za-zéàè0-9 ]*$/,
        email_rg: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\., ;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        num_rg: /^[0-9]+[0-9]*$/,
        float_rg: /^[0-9]+[.]?[0-9]*$/,
        neg_num_rg: /^(-)?[0-9]+[0-9]*$/,
    },
}
