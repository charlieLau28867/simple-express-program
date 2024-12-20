const express = require('express')
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//Database task A
var db = require('mongoose');
db.set('strictQuery', false); //to avoid the warning message
db.connect('mongodb://mongodb/HKPassFlow', {useNewUrlParser: true,
useUnifiedTopology: true})
  .then(() => {
    console.log("Connected to MongoDB");
})
  .catch(err => {
    console.log("MongoDB connection error: "+err);
    process.exit();
  db.on('close', function () {
      console.log('Error...close');
      process.exit();
  })
});


//Set the Schema
var mySchema = new db.Schema({
  Year: Number,
  Month: Number,
  Local: Number,
  Mainland: Number,
  Others: Number,
  Total: Number,
});
//Create my model
var monthlog = db.model("monthlog", mySchema, "monthlog");

// Make our model accessible to routers
app.use(function(req,res,next) {
  req.monthlog = monthlog;
  next();
});
 

//task b
app.route('/HK/stat/:year(\\d{4})/:month?')
.get( async (req, res,next) => {

   //Get the data
  let Pathyear = req.params.year;
  let Month = req.params.month;
  let checkmonthint = Number(Month);

  if (Month != null){
    if (Month == "others" || Month == "mainland" || Month == "local") next('route');
    else if (Month >0 && Month <13 && Pathyear > 2020 && Pathyear < 2026 && Number.isInteger(checkmonthint)){
      monthlog.find({Year: Pathyear, Month:Month},{_id:0,__v:0})
      .then(docs=>{
        if(docs.length < 1){
          res.status(404).json('{"error1":"No data for '+ Month+'/'+Pathyear+'}');
        }else{
          console.log(docs);
          res.json(docs);
        }
      })
      .catch(err => {
        res.send({msg: err });
      });

    }else if(!Number.isInteger(checkmonthint)){
      res.status(400).json('{"error":"Cannot GET "' + req.originalUrl + '"}');
    }else{
      res.status(400).json('{"error":"Wrong year - must be between 2021 - 2025. Wrong month."}');
    }
  }else{
    if(Pathyear > 2020 && Pathyear < 2026){
      const data = await monthlog.aggregate([
          {$match:{Year:Number(Pathyear)}},
        {$group:{_id: null, Local:{$sum:'$Local'},Mainland:{$sum:'$Mainland'},Others:{$sum:'$Others'},Total:{$sum:'$Total'}}},
        {$project: {_id: 0}}
      ])
      console.log(data);
      res.json(data);
    }else{
      console.log("wrong Year")
      res.status(400).json('{"error":"Wrong year - must be between 2021 - 2025. Wrong month."}');
    }
  } 
})

//task d
app.route('/HK/stat/:year(\\d{4})/:month?')
.get( (req, res) => {
  let Direction = req.params.month;
  let Pathyear = req.params.year;
  let command = "";
  if (Direction == "others"){
    command = "Others";
  }
  if (Direction == "local"){
    command = "Local";
  }
  if (Direction == "mainland"){
    command = "Mainland";
  }
  if(Pathyear > 2020 && Pathyear < 2026 ){
    if (Pathyear == 2025){
      res.status(404).json('{"error":"No data for 2025"}');
    }else{
      monthlog.find({Year: Pathyear},{_id:0,Month:1,[command]:1}).sort({Month: 1})        
      .then(docs => {
        console.log(docs);
        res.json(docs);
      })
      .catch(err => {
        res.send({msg: err });
      });
    }
  }else{
    res.status(400).json('{"error":"Wrong year - must be between 2021 - 2025."}');
  }

})



//task C
app.route('/HK/stat')
.post( (req, res) => {
  const data = req.body;
  if (data.length > 1){
    if (data[0].Flow == "Arrival"){
      console.log("here is arrival");
      let Local = data[0].Local - data[1].Local
      let Mainland = data[0].Mainland - data[1].Mainland
      let Others = data[0].Others - data[1].Others
      let Total = Local + Mainland + Others



      monthlog.find({Year: data[0].Year, Month:data[0].Month},{_id:0,__v:0})
      .then(docs => {
        if(docs.length > 0){
          res.status(409).json('{"error":"Record exists for '+ data[0].Month+"/"+data[0].Year+'; cannot overwrite."}');
        }else if (docs.length == 0){
          monthlog.create({"Year":data[0].Year,"Month":data[0].Month,"Local":Local,"Mainland":Mainland,"Others":Others, "Total": Total})
        }
      })
      .catch(err => {
        res.send({msg: err });
      });

    }else if (data[0].Flow == "Departure"){
      console.log("here is Departure");
      let Local = data[1].Local - data[0].Local
      let Mainland = data[1].Mainland - data[0].Mainland
      let Others = data[1].Others - data[0].Others
      let Total = Local + Mainland + Others


      monthlog.find({Year: data[0].Year, Month:data[0].Month},{_id:0,__v:0})
      .then(docs => {
        if(docs.length > 0){
          res.status(409).json('{"error":"Record exists for '+ data[0].Month+"/"+data[0].Year+'; cannot overwrite."}');
        }else if (docs.length == 0){
          monthlog.create({"Year":data[0].Year,"Month":data[0].Month,"Local":Local,"Mainland":Mainland,"Others":Others, "Total": Total})
        }
      })
      .catch(err => {
        res.send({msg: err });
      });
    }
  }else{
    res.status(400).json('{"error":"POST request - missing data."}');
  }
})


app.route('/HK/*')
.get( (req, res) => {
  res.status(400).json('{"error":"Cannot GET "' + req.originalUrl + '"}');
 })
.post( (req, res) => {
  res.status(400).json('{"error":"Cannot POST "' + req.originalUrl + '"}');
 })
.put( (req, res) => {
  res.status(400).json('{"error":"Cannot PUT "' + req.originalUrl + '"}');
 });





app.listen(3000, () => {
  console.log('App listening on port 3000!')
  console.log('Start to connect to db!')
});
