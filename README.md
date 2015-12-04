# Keep-It-Simple NodeJS+MongoDB CMS

![Sample](https://cloud.githubusercontent.com/assets/4989256/11591491/cf21773e-9aa0-11e5-9b3b-6185ffaed338.png)

The keep-it-simple modern Content Management Systems built on NodeJS and MongoDB.

To run the CMS, launch MongoDB, check src/config.json for correct settings,
then start `babel-node --presets=babel-preset-es2015 src/index`.

### Database structure

Rename the database in the `src/config.json` file. Use the following MongoDB database structure.
Note that any field may not be present. In this case it will be replaced by default assuming value.

#### For `pages` collection:

```js
{
    id: Number, // page ID (domain?page=<id>)
    semantic: String, // page semantic name (domain?page=<semanticName>
    title: "Title", // page title
    desc: "The description.", // page description (node that \n symbol splits full description from short one)
    img: "path/to/background/picture.png", // background picture
    extraLabel: "This costs ${{prop(props.price)}}", // extra label in right top corner of the card
    parent: 0, // id of the parent page. Use 0 to form menu elements.
    sort: { // sorting settings
        field: "title", // name of the field to sort data
        order: -1 // desc/asc: -1 or 1
    },
    props: {
        price: 20, // any page-specific properties goes here.
        color: "red" // in case of internet store, 
    },
    usesFilters: ["price", "color"] // filters that must be defined in `filters` collection.
}
```

#### For `filters` collection:

```js
{
    name: "price", // filter URL name
    label: "The Label", // filter screen name
    type: "range", // supported types: range, set
    min: 0, max: 100, // in case of "range" type
    set: [{ title: "Low", value: 0 }, { title: "High", value: 1 }] // in case of "set" type
}
```

### NodeJS startup

If global gulp is not installed: `npm install -g gulp`
If ES6 modules is not supported with pure NodeJS interpreter yet: `npm install babel-node`

```sh
npm install
gulp
babel-node src/index.js
```

And visit `127.0.0.1`.
