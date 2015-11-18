import config from "./config.json";
import {MongoClient} from "mongodb";

var toCall = [];

export var db = {};
export var onDbInit = function (anon) {
    toCall.push(anon);
};

MongoClient.connect(config.db.url + "/" + config.db.dbname, function (err, db1) {
    console.log(err ? err : "Database ready.");
    db = db1;
    for (var f of toCall) { f(); }
});
