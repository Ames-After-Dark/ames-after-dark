const express = require("express");
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
// TEMPORARILY removing audience for debugging
const checkJwt = auth({
    audience: 'ames-after-dark-api',
    issuerBaseURL: 'https://dev-lz0c3j2voxj6hy6v.us.auth0.com/',
});

// Optional JWT middleware - validates token if present, but allows requests without tokens
const optionalJwt = (req, res, next) => {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, set empty auth and continue
        req.auth = {};
        return next();
    }
    
    // Token provided - validate it with checkJwt
    checkJwt(req, res, (err) => {
        if (err) {
            // Token validation failed, treat as no auth (don't propagate error)
            console.log('JWT validation failed, treating as unauthenticated:', err.message);
            req.auth = {};
            return next();
        }
        // Token is valid, req.auth is populated by checkJwt
        next();
    });
};

module.exports = {
    checkJwt,
    optionalJwt
};