const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//Middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hic8zzf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        
       if(err){
        return res.status(401).send({message: 'unauthorized access'})
       }
       req.decoded = decoded;
       next();
    })
}

async function run() {
  try {
    const serviceCollection = client.db("healthCoach").collection("services");
    const reviewCollection = client.db("healthCoach").collection("reviews");

    app.post('/jwt', (req, res) =>{
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'})
        res.send({token})
    });

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      let sortData = services.sort((x, y) => y.date.localeCompare(x.date));
      res.send(sortData);
    });

    app.get("/allservices", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      let sortData = services.sort((x, y) => y.date.localeCompare(x.date));
      res.send(sortData);
      
    });

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    //add service
    app.post('/services', async(req, res) =>{
        const reveiw = req.body;
        const result = await serviceCollection.insertOne(reveiw);
        res.send(result);
    });

    //for update review
    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = await reviewCollection.findOne(query);
      res.send(review);
    });

    

    app.put("/review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const user = req.body;
      const option = { upsert: true };
      const updatedUser = {
        $set: {
          service: user.service,
          serviceName: user.serviceName,
          price: user.price,
          reviewer: user.reviewer,
          email: user.email,
          rating: user.rating,
          dateTime: user.dateTime,
          img: user.img,
          msg: user.msg,
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedUser,
        option
      );
      res.send(result);
    });

    //for get specific review
    app.get("/review",verifyJWT, async (req, res) => {
        const decoded = req.decoded;

        if(decoded.email !== req.query.email){
            res.status(403).send({message: 'unauthorized access'})
        }
      let query = {};
      if (req.query.service) {
        query = {
          service: req.query.service,
        };
      } else if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      const cursor = reviewCollection.find(query);
      const review = await cursor.toArray();
      let sortData = review.sort((x, y) =>
        y.dateTime.localeCompare(x.dateTime)
      );
      res.send(sortData);
    });

    // review post into DB
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });


    //for update
    app.patch("/review/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      const query = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await reviewCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //for delete
    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } 
  finally {

  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Health coach server is running");
});

app.listen(port, () => {
  console.log(`health coach server is running on ${port}`);
});
