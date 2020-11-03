// load libaries
const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2/promise')

// configure variables
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

// configure connection pool
const pool = mysql.createPool({
    host: process.env.SQL_HOST || 'localhost',
    port: parseInt(process.env.SQL_PORT) || 3306,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_DB || 'playstore', // not created env variable
    connectionLimit: 4,
    timezone: '+08:00'
})

const router = require('./app')(pool)

// create instance of express
const app = express()

// configure handlebars
app.engine('hbs',
    handlebars({
        defaultLayout: 'template.hbs'
    })
)
app.set('view engine', 'hbs')

// application
app.use('/main', router)

// ## REDIRECT ##
app.use((req, resp) => {
    resp.redirect('/main')
})

// start the server
pool.getConnection()
.then(conn => {
    console.info('Pinging database...')
    const p0 = Promise.resolve(conn)
    const p1 = conn.ping()
    return Promise.all([p0, p1])
})
.then(results => {
    const conn = results[0]
    conn.release()
    app.listen(PORT, () => {
        console.info(`Application is listening PORT ${PORT} at ${new Date()}.`)
    })
})
.catch(e => {
    console.error("Error getting connection: ", e)
})



