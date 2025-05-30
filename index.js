const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express')
const cors = require('cors');
const jsxRuntime = require('react/jsx-runtime');
const port = process.env.PORT || 8000;

const app = express();

// QuickHired
// h8QWJLygU83Wq3rc

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_Password}@cluster0.1k8uoge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

    // collections
    const jobsCollection = client.db("QuickHired").collection("jobs");
    const applicationsCollection = client.db("QuickHired").collection("applications");
    // console.log(jobsCollection)

    // for showing jobs
    app.get('/jobs' , async(req,res)=>{
        const result = await jobsCollection.find().toArray();
        res.send(result);
    })   

    // for showing individual job details
    app.get('/jobs/:id' , async(req,res)=>{
        const id = req.params.id;
        const query = { _id : new ObjectId(id) };
        const result = await jobsCollection.findOne(query);
        res.send(result)
    }) 

    // for creating job applicant request
    app.post('/applications' , async(req,res)=>{
      const applications = req.body;
      const result = await applicationsCollection.insertOne(applications);
      res.send(result);
    })
   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } 
  finally {}
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send("QuickHired server is running")
})

app.listen(port , ()=>{
    console.log(`QuickHired server is running on ${port}`)
})