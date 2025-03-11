const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000

// midle Ware 
app.use(cors())
app.use(express.json())

// mongoDb add to server 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gbi1i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const jobsCollection = client.db('job_portal').collection('allJobs')
        const UserJobCollection = client.db('job_portal').collection('UserJobsCollection')



        // jwt related api
        app.post("/jwt", async (req, res) => {
            const body = req.body
            const token = jwt.sign(body, process.env.SECREET_TOKEN, { expiresIn: "1h" })
            res.send(token)
        })



        // job related api 
        app.get('/jobs', async (req, res) => {
            const email = req.query.email
            let query = {}
            if (email) {
                query = { hr_email: email }
            }
            console.log(email)
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })
        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)
            res.send(result)
        })

        app.post("/jobs", async (req, res) => {
            const body = req.body
            const result = await jobsCollection.insertOne(body)
            res.send(result)
        })


        // job application related api 
        app.post("/job-application", async (req, res) => {
            const data = req.body
            const result = await UserJobCollection.insertOne(data)
            res.send(result)

        })

        app.get("/job-application/jobs/:job_id", async (req, res) => {
            const id = req.params.job_id
            const query = { JobId: id }
            console.log(query)
            const result = await UserJobCollection.find(query).toArray()
            res.send(result)
        })

        app.get("/job-application", async (req, res) => {
            const email = req.query.email
            const query = { JobEmail: email }
            const result = await UserJobCollection.find(query).toArray()


            // fokira away 
            for (const singleResult of result) {
                const query1 = { _id: new ObjectId(singleResult.JobId) }
                const result1 = await jobsCollection.findOne(query1)
                if (result1) {
                    singleResult.title = result1.title
                    singleResult.location = result1.location
                    singleResult.company_logo = result1.company_logo
                    singleResult.hr_email = result1.hr_email
                    singleResult.name = result1.name
                }
            }
            res.send(result)

        })

        app.patch("/job-application/:id", async (req, res) => {
            const id = req.params.id
            const body = req.body
            console.log(body)
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: body.status
                }
            }
            const result = await UserJobCollection.updateOne(query, updateDoc)
            res.send(result)
        })





    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send("job portal is start ")
})

app.listen(port, () => {
    console.log(`the job portal server is ${port}`)
})