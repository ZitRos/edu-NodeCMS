import {onDbInit} from "./mongo.js";

let db,
    docs = [],
    toLoad = 100000,
    loaded = 0,
    concurrency = 100,
    startId = 100259,
    pics = ["americano", "coke", "espresso", "fireExtinguisher", "kapuchino", "latte", "milk", "sprite", "tea-black", "tea-classic", "tea-flower", "tea-green"];

function push (callback) {
    docs = [];
    console.log("Generating records...");
    for (loaded = 0; loaded < toLoad; loaded++) {
        docs.push(gen());
    }
    console.log("Saving records...");
    db.collection("pages").insertMany(docs, (err) => {
        if (err) throw err;
        callback();
    });
}

function gen () {
    return {
        id: startId++,
        title: `The ${Math.random() < 0.5 ? "test " : " "}title ` + Math.random().toString().slice(2, 8),
        desc: `Let's see ${Math.random() < 0.5 ? "how long " : ""}${Math.random() < 0.5 ? "this title " : ""}${Math.random() < 0.5 ? "even " : ""}${Math.random() < 0.5 ? "can be, " : ""}yeah?`,
        img: `/img/store/drinks/${pics[Math.floor(Math.random()*pics.length)]}.jpg`,
        parent: 255,
        extraLabel: "${{prop(props.price)}}",
        props: {
            price: 1 + Math.floor(Math.random()*200),
            type: Math.floor(Math.random()*7),
            pages: 1 + Math.floor(Math.random()*4000)
        }
    }
}

onDbInit((dbReady) => {

    db = dbReady;

    push(function () {
        console.log("Done!");
    });

});