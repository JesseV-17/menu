// Below we will use the Express Router to define a series of API endpoints.
// Express will listen for API requests and respond accordingly
import express from 'express'
const router = express.Router()

// Set this to match the model name in your Prisma schema
const model = 'menu'

// Prisma lets NodeJS communicate with MongoDB
// Let's import and initialize the Prisma client
// See also: https://www.prisma.io/docs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Connect to the database
prisma.$connect().then(() => {
    console.log('Prisma connected to MongoDB')
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err)
})

// ----- CREATE (POST) -----
// Create a new record for the configured model
// This is the 'C' of CRUD
router.post('/data', async (req, res) => {
    try {
        // Remove the id field from request body if it exists
        // MongoDB will auto-generate an ID for new records
        const { id, ...createData } = req.body

        const created = await prisma[model].create({
            data: createData
        })
        res.status(201).send(created)
    } catch (err) {
        console.error('POST /data error:', err)
        res.status(500).send({ error: 'Failed to create record', details: err.message || err })
    }
})


// ----- READ (GET) list ----- 
router.get('/data', async (req, res) => {
    try {
        // fetch all records from the database, newest first
        const result = await prisma[model].findMany({
            orderBy: {
                id: 'desc'  // Show newest items first (ObjectId contains timestamp)
            }
        })
        res.send(result)
    } catch (err) {
        console.error('GET /data error:', err)
        res.status(500).send({ error: 'Failed to fetch records', details: err.message || err })
    }
})



// ----- findMany() with search ------- 
// Accepts optional search parameter to filter by ITEM field
// See also: https://www.prisma.io/docs/orm/reference/prisma-client-reference#examples-7
router.get('/search', async (req, res) => {
    try {
        // get search terms from query string, default to empty string
        const searchTerms = req.query.terms || ''
        // fetch the records from the database
        const result = await prisma[model].findMany({
            where: {
                ITEM: {
                    contains: searchTerms,
                    mode: 'insensitive'  // case-insensitive search
                }
            },
            orderBy: { ITEM: 'asc' },
            take: 10
        })
        res.send(result)
    } catch (err) {
        console.error('GET /search error:', err)
        res.status(500).send({ error: 'Search failed', details: err.message || err })
    }
})


// ----- UPDATE (PUT) -----
// Listen for PUT requests
// respond by updating a particular record in the database
// This is the 'U' of CRUD
// After updating the database we send the updated record back to the frontend.
router.put('/data/:id', async (req, res) => {
    try {
        // Remove the id from the request body if it exists
        // The id should not be in the data payload for updates
        const { id, ...updateData } = req.body

        // Prisma update returns the updated version by default
        const updated = await prisma[model].update({
            where: { id: req.params.id },
            data: updateData
        })
        res.send(updated)
    } catch (err) {
        console.error('PUT /data/:id error:', err)
        res.status(500).send({ error: 'Failed to update record', details: err.message || err })
    }
})

// ----- DELETE -----
// Listen for DELETE requests
// respond by deleting a particular record in the database
// This is the 'D' of CRUD
router.delete('/data/:id', async (req, res) => {
    try {
        const result = await prisma[model].delete({
            where: { id: req.params.id }
        })
        res.send(result)
    } catch (err) {
        console.error('DELETE /data/:id error:', err)
        res.status(500).send({ error: 'Failed to delete record', details: err.message || err })
    }
})


// export the api routes for use elsewhere in our app 
// (e.g. in index.js )
export default router;

