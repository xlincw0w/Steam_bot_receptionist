const db = require('knex')({
    client: 'mysql',
    connection: {
        host: 'eu-cdbr-west-01.cleardb.com',
        user: 'b779cdbbef48d8',
        password: '8d03c848',
        database: 'heroku_97681a3fa4122e3',
    },
})

module.exports.db = db
