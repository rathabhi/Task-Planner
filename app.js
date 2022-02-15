//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useFindAndModify', false);
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true,useUnifiedTopology: true});

const itemsSchema={
  name:String
};
const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Welcome to the To-Do list!"
});
const item2=new Item({
  name:"Hit the + button to add a new item"
});
const item3=new Item({
  name:"<--Hit this to delete an item"
});
const itemList=[item1,item2,item3];

const listSchema={
  name:String,
  listItems:[itemsSchema]
}
const Listing=mongoose.model("Listing",listSchema);


app.get("/", function(req, res) {


  Item.find({},function(err,items){
    if(items.length===0){
      Item.insertMany(itemList,function(err){
        if(err)
        console.log(err);
        else
        console.log("Successfully added default items");
      });
      res.redirect("/");
      
    }
    else
    res.render("list", {listTitle: "Today", newListItems: items});

  });
  

});
app.get("/:topic",function(req,res){
  const topicName=_.capitalize(req.params.topic);
  Listing.findOne({name:topicName},function(err,result){
    if(!err){
      if(result){
        res.render("list",{listTitle:result.name,newListItems:result.listItems});
        
        
      }
      else{
        const listTopics=new Listing({
          name:topicName,
          listItems:itemList
        
        });
        listTopics.save();
        const page="/"+topicName;
        res.redirect(page);
        
      }
    }
  });
  
  


});

app.post("/", function(req, res){

  const newItem = req.body.newItem;
  const newTitle=req.body.list;
  const item=new Item({
    name:newItem
  });
  if(newTitle==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    Listing.findOne({name:newTitle},function(err,resList){
      if(!err){
        resList.listItems.push(item);
      resList.save();
      res.redirect("/"+newTitle);
      }
      
    });
  }
  

  
});
app.post("/delete",function(req,res){
  const checkedId=req.body.checkItem;
  const nameOfList=req.body.listName;
  if(nameOfList==="Today"){
    Item.findByIdAndRemove(checkedId,function(err){
      if(err)
      console.log(err);
      else{
        console.log("Successfully deleted");
        res.redirect("/");
      }
      
    });
    
  }
  else {
    Listing.findOneAndUpdate({name:nameOfList},{$pull:{listItems:{_id:checkedId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+nameOfList);
      }
    })
  }
 
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT||3000);
