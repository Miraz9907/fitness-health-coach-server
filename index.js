const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000

//Middle ware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hic8zzf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const serviceCollection = client.db('healthCoach').collection('services');
        const reviewCollection = client.db('healthCoach').collection('reviews');

        app.get('/services', async(req, res) =>{
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(3).toArray();
            res.send(services);
        });

        app.get('/allservices', async(req,res) =>{
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);

        });
        app.get('/services/:id', async (req, res) =>{
            const id = req.params.id;
            const query ={ _id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

       
        app.get('/review', async(req, res) =>{
            let query = {};
            if(req.query.service){
                query = {
                    service:req.query.service
                }
            }
            else if(req.query.email){
                query = {
                    email:req.query.email
                }
            }
            
            const cursor = reviewCollection.find(query);
            const review = await cursor.toArray();
            let sortData = review.sort((x,y) => y.dateTime.localeCompare(x.dateTime));
            res.send(sortData);
        });

        app.post('/review', async(req, res)=>{
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });
    }
    finally{

    }

}

run().catch(err => console.error(err));


app.get('/', (req, res) =>{
    res.send('Health coach server is running')
})

app.listen(port, ()=>{
    console.log(`health coach server is running on ${port}`)
})