import config from './config.js'
import { createPool } from 'mysql2/promise'

const mysql = createPool({
    host: config.sql.host,
    user: config.sql.user,
    password: config.sql.password,
    database: config.sql.database,
    port: config.sql.port
})

export default mysql