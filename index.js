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
    const applicationsCollection = client.db("QuickHired").collection("applications")
    // console.log(jobsCollection)
    // console.log(applicationsCollection)

    // for showing jobs
    app.get('/jobs' , async(req,res)=>{
      const email = req.query.email
      const query = {}

      if(email){
        query.hr_email = email;
      }

      const result = await jobsCollection.find(query).toArray();
      // console.log(query,result)
      res.send(result);
    })    

    // for showing individual job details
    app.get('/jobs/:id' , async(req,res)=>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result)
    }) 

    // for creating new jobs by recruiter
    app.post('/jobs' , async(req,res)=>{
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    })

    // for showing total applications for a particular job
    app.get('/applications/job/:id' , async(req,res)=>{
      const job_id = req.params.id;
      const query = { id: job_id };
      const result = await applicationsCollection.find(query).toArray();
      res.send(result);
    })

    // for creating job applicant request
    app.post('/applications' , async(req,res)=>{
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      // console.log(result)
      // console.log(application)
      res.send(result);
    })

    // for showing applications for each email 
    app.get('/applications' , async(req,res)=>{
      const email = req.query.email;

      const query = {
        applicant : email 
      } 

      const result = await applicationsCollection.find(query).toArray();
      
      // doing aggregation[connecting two collections together]. tho it is a bad way
      for(const application of result){
        const id = application.id // applicationsCollection's id
        const jobQuery = { _id : new ObjectId(id) }; // jobsCollection's _id

        const job = await jobsCollection.findOne(jobQuery);

        application.company = job.company
        application.company_logo = job.company_logo
        application.title = job.title
        application.location = job.location
      }
      res.send(result)
    })

    // for updating the application status
    app.patch('/applications/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = { _id : new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status : req.body.status
        }
      }
      const result = await applicationsCollection.updateOne(filter,updatedDoc);
      console.log(id,filter,updatedDoc,result)
      res.send(result)
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