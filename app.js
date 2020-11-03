// load express
const express = require('express')

// SQL
const SQL_GET_APP_CATEGORIES = 'SELECT DISTINCT(category) FROM apps'
const SQL_GET_APP_BY_APPID = 'SELECT * FROM apps WHERE app_id = ?'
const SQL_GET_APP_BY_NAME = 'SELECT * FROM apps WHERE name LIKE ? LIMIT ? OFFSET ?'
const SQL_GET_APP_BY_NAME_BY_CATEGORY = 'SELECT * FROM apps WHERE category = ? AND name LIKE ? LIMIT ? OFFSET ?'

module.exports = function(p) {
    const router = express.Router()
    const pool = p

    // load resources
    router.use(express.static(`${__dirname}/static`))

    // #### GET route ####

    // ## search for apps using q query
    router.get('/search', async (req, resp) => {
        const q = req.query.q
        const c = req.query.category || req.query.c || '*'
        const offset = parseInt(req.query.offset) || 0
        const limit = 20
        const p = (offset / limit) + 1
        let conn
        let results

        try {
            conn = await pool.getConnection()

            if (c == '*') {
                // SEARCH Q in ALL CATEGORIES
                console.info("searching all")
                results = await conn.query(SQL_GET_APP_BY_NAME, [`%${q}%` , limit, offset ])
            }
            else {
                // SEARCH Q only in SPECIFIC CATEGORY
                console.info("searching some")
                results = await conn.query(SQL_GET_APP_BY_NAME_BY_CATEGORY, [c, `%${q}%` , limit, offset])
            }

            // retrieve the categories in the db    
            const cat_results = await conn.query(SQL_GET_APP_CATEGORIES)
            const category = cat_results[0]
            resp.status(200)
            resp.type('text/html')
            resp.render('search',
                {
                    title: "Search Results",
                    apps: results[0],
                    category,
                    q,
                    c,
                    p,
                    prevOffset: Math.max(offset - limit, 0),
                    nextOffset: offset + limit
                }
            )
        } catch(e) {
            resp.status(500)
            resp.type('text/html')
            resp.send(JSON.stringify(e))
        } finally {
            conn.release()
        }
    })

    // search for app individually with app_id
    router.get('/app/:appId', async (req, resp) => {
    const appId = req.params['appId']
    let conn
    try {
        conn = await pool.getConnection()
        const results = await conn.query(SQL_GET_APP_BY_APPID, appId)
        const data = results[0]
        
        if (data.length <= 0) {
            // 404
            resp.status(404)
            resp.type('text/html')
            resp.send(`Not found: ${appId}`)
        } 

        resp.status(200)
        resp.type('text/html')
        resp.render('app',
            {
                title: "App Information",
                app: data[0]
            }
        )
    } 
    catch (e) {
        resp.status(500)
        resp.type('text/html')
        resp.send(JSON.stringify(e))
    }
    finally {
        conn.release()
    }
    })  

    // ## DEFAULT SEARCH PAGE ##
    router.get('/', async (req, resp) => {
        let conn
        try {
            conn = await pool.getConnection()
            const results = await conn.query(SQL_GET_APP_CATEGORIES)
            const category = results[0]
            resp.status(200)
            resp.type('text/html')
            resp.render('search',
                {
                    title: 'Home',
                    category
                }
            )
        } 
        catch (e) {
            resp.status(500)
            resp.type('text/html')
            resp.send(JSON.stringify(e))
        }
        finally {
            conn.release()
        }
    })

    // ## REDIRECT ##
    router.use((req, resp) => {
    resp.redirect('/')
    })

    return(router)
}