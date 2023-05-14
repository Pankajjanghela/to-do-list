//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://pankajjanghela:qazmlpwsxnko@cluster0.cd2bqes.mongodb.net/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({})
    .then(foundItems => {
      /*  if (foundItems.length === 0) use hum log isliye kar rahe hai kyoki jitne baar hum file ko run karte hai utni hi baar item baar-baar
      DATABASE mei insert kar dega  */
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Insert All The Item Successfully");
          })
          .catch(error => {
            console.log("Failed to insert default items:", error);
          });
        /* here if statement ke baad interpreter else statement read nahi karega aur Item app mei show nahi karega to hum 
        res.redirect ka use karke hum developer ko [ app.get("/", function (req, res) ] mei wapas bhej denge fir jab interpreter ko item add 
        dikhenge database mei to wah if statement ko read nahikarega balki else statement ko run karega */
        res.redirect("/");
      }

      else {
        // here Item render or show to the app Interface in the location "/"
        res.render("list", { listTitle: "Today", newListItems: fndItems });
      }
    })
    .catch(err => {
      console.log(err);
    })

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(() => {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        //Show an existing list

        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
});




app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
  }
});

app.post("/delete", async function (req, res) {
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully remove the item");
      res.redirect("/");
    }
  } catch (err) {
    try {
      const foundList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: checkedItemId } } }
      );
      res.redirect("/" + listName);
    } catch (err) {
      // Handle error
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  }
});


app.get("/about", function (req, res) {
  res.render("about");
});
mongoose.connection.on('error', function (err) {
  console.error('MongoDB connection error:', err);
});
app.listen(3000, function () {
  console.log("Server started on port 4000");
});
