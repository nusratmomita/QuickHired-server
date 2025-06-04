const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express')
const cors = require('cors');

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const jsxRuntime = require('react/jsx-runtime');
const port = process.env.PORT || 8000;

const app = express();


// middleware
app.use(cors({
  origin: ['http://localhost:5173'],// from where the request is coming(our client side)
  credentials: true // to allow cookies to be sent with requests(allowing cookies)
}));
app.use(express.json());
app.use(cookieParser());

const logger = (req,res,next)=>{
  console.log("Inside the logger middleware");
  next();// using this so that the request can continue to the next middleware or route handler (going to the next execution)
}

const verifyingToken = (req,res,next) => {
  console.log("Inside the verifyingToken middleware");

  const token = req?.cookies?.token;// getting the toke for the cookies 
  // console.log(token)

  if(!token){
    return res.status(401).send({massage : "Unauthorized access. No token provided."});
  }

  else{
    jwt.verify(token , process.env.JWT_ACCESS_SECRET, (error , decoded)=>{
      if(error){
        return res.status(401).send({massage : "Unauthorized access. No token provided."});
      }
      // console.log(decoded)
      req.decoded = decoded;// putting the decoded token in the request object so that it can be used in the next middleware or route handler
      next();
    })
  }
}


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

    // * creating JWT token related APIs
    app.post('/jwt' , async(req,res)=>{
      const {email} = req.body;
      const user = {email};
      // console.log(user);
      const token = jwt.sign(user , process.env.JWT_ACCESS_SECRET , {expiresIn: '1h'});


      res.cookie('token' , token , {
        httpOnly: true,// It can only be accessed by the server.It cannot be accessed via JavaScript using document.cookie.
        secure: false
      })

      res.send({token,success:true});

    })

    // for showing jobs
    app.get('/jobs' , async(req,res)=>{
      const email = req.query.email
      const query = {}

      if(email){
        query.hr_email = email;
      }

      const result = await jobsCollection.find(query).toArray();
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
      res.send(result);
    })

    // for showing applications for each email 
    app.get('/applications' , logger , verifyingToken , async(req,res)=>{
      const email = req.query.email;

      // for checking if we are not providing X's data to Y's account
      // if the email in the query is not the same as the email in the decoded token, then return 403 Forbidden 
      if(email !== req.decoded.email){
        return res.status(403).send({message: "Forbidden access"});
      }

      const query = {
        applicant : email 
      } 

      console.log("Inside applications API" , req.cookies);// trying to get the cookie

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