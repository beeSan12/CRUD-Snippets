/**
 * @file This module contains the options object for the session middleware.
 * @module sessionOptions
 * @author Mats Loock & Beatriz Sanssi <bs222eh@student.lnu.se>
 * @see {@link https://github.com/expressjs/session}
 */

// Options object for the session middleware.
export const sessionOptions = {
  name: process.env.SESSION_NAME || 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'lax'
  }
}

if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true // serve secure cookies
}
