import config from "./config.json";
import express from "express";
import ejs from "ejs";
import fs from "fs";
import path from "path";
//import mongo from "./mongo";
import bodyParser from "body-parser";
import {Page} from "./page";
import session from "express-session";

// Server start file \\

var app = express(),
    models = {}, // a set of functions taking callback as a first parameter
    controllers = {},
    pageNames = []; // list of registered page names matching file name

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/static"));
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(session({
    secret: "the ultimate secret",
    cookie: { maxAge: 7*24*60*60*1000 }, // 1 week
    resave: true,
    saveUninitialized: true
}));

var getNameFromFileName = function (file) {
    return file.match(/(.*)\./)[1];
};

// parse views that do not have controller
for (let file of fs.readdirSync("./src/views")) {
    if (!/.*\..*/.test(file)) continue; // skip directories
    let pageName = getNameFromFileName(file);
    app.get(`/${ (pageName === "index") ? "" : pageName }`, (req, res) => {
        new Page({ query: req.query, req: req, res: res }, function (data) {
            res.render("index", { data: data });
        });
    });
    pageNames.push(pageName);
}

console.log(`Pages registered: ${pageNames.join(", ")}`);

app.listen(config.webServer.port, () => {
    console.log("Server start successful.");
});