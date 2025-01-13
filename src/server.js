/**
 * @file This file defines the Express application and starts the HTTP server.
 * @module server
 * @author Mats Loock & Beatriz Sanssi
 */

// Import necessary libraries and modules.
import httpContext from 'express-http-context' // Must be first!
import express from 'express'
import dotenv from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import expressLayouts from 'express-ejs-layouts'
import session from 'express-session'
import helmet from 'helmet'
import { randomUUID } from 'crypto'
import cors from 'cors'

// Import configurations and utilities.
import { connectToDatabase } from './config/mongoose.js'
import { morganLogger } from './config/morgan.js'
import { sessionOptions } from './config/sessionOptions.js'
import logger from 'morgan'

// Import routes.
import { router } from './routes/router.js'
import userRouter from './routes/userRouter.js'
import dashboardRouter from './routes/dashboardRouter.js'
import friendshipRouter from './routes/friendshipRouter.js'

dotenv.config()
try {
  // Connect to MongoDB.
  await connectToDatabase()
  console.log(`Database Connection String: ${process.env.DB_CONNECTION_STRING}`)
  console.log(`Base URL: ${process.env.BASE_URL}`)

  const app = express()
  sessionOptions.secret = process.env.SESSION_SECRET

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1) // Trust first proxy
    sessionOptions.cookie.secure = false // Serve secure cookies
  }

  app.use(session(sessionOptions))

  // Get the directory name of this module's path.
  const directoryFullName = dirname(fileURLToPath(import.meta.url))

  // Set the base URL to use for all relative URLs in a document.
  const baseURL = process.env.BASE_URL || '/'
  console.log(`Setting baseURL to: ${baseURL}`)

  // Set up a morgan logger using the dev format for log entries.
  app.use(logger('dev'))

  // Middleware configuration.
  app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' }
  })
  ) // Set various HTTP headers for app security
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        'style-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        'img-src': ["'self'", 'data:', 'cdn.jsdelivr.net'],
        'default-src': ["'self'", 'cdn.jsdelivr.net', 'data:'],
        'connect-src': ["'self'"],
        'font-src': ["'self'", 'cdn.jsdelivr.net'],
        'object-src': ["'none'"],
        'media-src': ["'self'"],
        'frame-src': ["'none'"]
      }
    })
  )
  app.use(cors()) // Enable CORS for all routes
  app.use(express.urlencoded({ extended: false })) // Body parser setup
  app.use(express.static(join(directoryFullName, '..', 'public'))) // Serve static files
  console.log(`${join('Full directory:', directoryFullName, '..', 'public')}`)
  app.use(httpContext.middleware)
  app.use(morganLogger) // Use the configured Morgan logger as middleware
  app.use(express.json())

  // View engine setup.
  app.set('view engine', 'ejs')
  app.set('views', join(directoryFullName, 'views'))
  app.use(expressLayouts)
  app.set('layout', join(directoryFullName, 'views', 'layouts', 'default'))
  app.set('layout extractScripts', true)
  app.set('layout extractStyles', true)

  app.use((req, res, next) => {
    // Set a variable accessible in all views
    res.locals.isAuthenticated = !!req.session.userId
    next()
  })
  // Routes setup
  app.use((req, res, next) => {
    // Add a request UUID to each request and store information about
    // each request in the request-scoped context.
    req.requestUuid = randomUUID()
    httpContext.set('request', req)
    // Flash messages - survives only a round trip.
    if (req.session.flash) {
      res.locals.flash = req.session.flash
      delete req.session.flash
    }
    // Pass the base URL to the views.
    res.locals.baseURL = process.env.BASE_URL || '/'
    console.log(`baseURL: ${res.locals.baseURL}`)
    next()
  })

  // Routes
  app.use('/', router)
  app.use('/users', userRouter)
  app.use('/dashboard', dashboardRouter)
  app.use('/friendship', friendshipRouter)

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.message, { error: err })
    console.error('Error caught by middleware:', err)

    // 401 Unauthorized.
    if (err.status === 401) {
      res
        .status(401)
        .sendFile(join(directoryFullName, 'views', 'errors', '401.html'))
      return
    }

    // 403 Forbidden.
    if (err.status === 403) {
      res
        .status(403)
        .sendFile(join(directoryFullName, 'views', 'errors', '403.html'))
      return
    }

    // 404 Not Found.
    if (err.status === 404) {
      res
        .status(404)
        .sendFile(join(directoryFullName, 'views', 'errors', '404.html'))
      return
    }

    // 500 Internal Server Error (in production, all other errors send this response).
    if (process.env.NODE_ENV !== 'development') {
      res
        .status(500)
        .sendFile(join(directoryFullName, 'views', 'errors', '500.html'))
      return
    }

    // Render the error page.
    res
      .status(err.status || 500)
      .json({ status: err.status, message: err.message })
  })

  app.all('*', (req, res) => {
    console.error(`404 Not Found: ${req.originalUrl}`)
    res.status(404).send('404 Not Found')
  })

  // Start the server.
  const server = app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${server.address().port}`)
    console.log('Press Ctrl-C to terminate...')
  })
} catch (err) {
  console.error(err.message, { error: err })
  process.exitCode = 1
}
