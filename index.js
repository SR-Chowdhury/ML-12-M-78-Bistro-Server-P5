const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

// JWT verfication
const jwtVeriy = (req, res, next) => {
    const authorization = req.headers.authorization;
    
    if(!authorization) {
        return res.status(401).send({error:true, message: 'Unauthorized Access'});
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({error:true, message: 'Unauthorized Access'});
        }
        req.decoded = decoded;
        next();
    });
} 




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hcsitps.mongodb.net/?retryWrites=true&w=majority`;

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
        // await client.connect();
        client.connect();

        const userCollection = client.db("bistroDB").collection("users");
        const menuCollection = client.db("bistroDB").collection("menu");
        const reviewCollection = client.db("bistroDB").collection("reviews");
        const cartCollection = client.db("bistroDB").collection("carts");

        /**
         * ----------------------------------------- JWT --------------------------------
         */
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn : '1h' });
            res.send({token});
        });

        /**
         * ------------------------------ User Collection --------------------------------
         */
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });


        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email : user.email };
            const existingUser = await userCollection.findOne(query);
            if(existingUser) {
                return res.send({ message: 'user already exists'});
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id : new ObjectId(id)};
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await userCollection.updateOne(query, updateDoc);
            res.send(result);
        });

        /**
         * ------------------------------ Menu Collection --------------------------------
         */
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        });


        /**
         * ------------------------------ Review Collection --------------------------------
         */


        /**
         * ------------------------------ Cart Collection --------------------------------
         */

        app.get('/carts', jwtVeriy, async (req, res) => {
            const email = req.query.email;
            // console.log(email);
            if (!email) {
                res.send([]);
            }
            // console.log(req.decoded);
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);

            if(email !== decodedEmail) {
                return res.status(403).send({error: true, message: 'Forbidden Access'});
            }

            const query = { email : email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/carts', async (req, res) => {
            const item = req.body;
            // console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result);
        });

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id : new ObjectId(id)};
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({  ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => res.send('Bismillahir Rahmanir Rahim - ML-12-Bistro-Boss Restaurent'));
app.listen(port, () => console.log(`Server is running from port: ${port}`));