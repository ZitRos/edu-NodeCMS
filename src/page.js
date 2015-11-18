import {db, onDbInit} from "./mongo";
import * as macro from "./macro";

var sort = function (data = [], props = { field: "title" }) {
    props.order = props.order || 1;
    return data.sort(function (a, b) {
        a = isNaN(+a[props.field]) ? a[props.field] : parseFloat(a[props.field]);
        b = isNaN(+b[props.field]) ? b[props.field] : parseFloat(b[props.field]);
        if (a>b) return props.order;
            else if (a<b) return -props.order;
            else return 0;
    });
};

var PAGES = {};

onDbInit(function () {
    db.collection("pages").find({ parent: 0 }).toArray(function (err, items) {
        (items || []).forEach(function (item) {
            PAGES[item.id] = {
                link: "/?page=" + (item.semantic || item.id),
                name: item.title || "No Title",
                semantic: item.semantic
            };
        });
    });
});

var requireSeeAlsos = function (alsosArray, callback) {
    var newAliases = [], end = false;
    for (var a of alsosArray) {
        let b = a;
        db.collection("pages").find({ id: a.id }).toArray(function (err, items) {
            var item = (items || [])[0] || { title: "Wrong ID in alias" };
            if (b["title"]) { item.title = b["title"]; }
            newAliases.push(item);
            checkEnd();
        });
    }
    var checkEnd = function () {
        if (newAliases.length >= alsosArray.length && !end) {
            end = true;
            callback(newAliases);
        }
    };
};

/**
 * @param query
 * @param {function} render
 * @constructor
 */
export var Page = function (query, render) {

    let pageId = query.page || 1,
        pageObject, children = [], thisPage, childrenToLoad = 0, childrenLoaded = 0, itemPos = 0;

    macro.reset();

    function tryFin () {
        if (childrenLoaded !== childrenToLoad) return;
        childrenLoaded = -Infinity;
        fin();
    }

    /** Catches the special returned result from macro or whatever. */
    function hook (obj = {}) {
        if (obj.children instanceof Array) processChildren(obj.children);
    }

    function parseDescription (object, text, nullize) {
        return text.replace(/\{\{(\$?[a-zA-Z]+)\((.*)}}/g, function (part, name, args = "") {
            if (args.length > 1) args = args.slice(0, args.length - 1); // remove last )
            if (nullize) return "";
            let params = args.match(/('.*?'|[^',]+)(?=\s*,|\s*$)/g);
            params = params.map((s) => {
                return s[0] === `'` && s[s.length - 1] === `'` ? s.slice(1, s.length - 1) : s;
            });
            if (!macro.hasOwnProperty(name)) {
                return `<span style=\"color: gray\">{{</span><span style=\"color: red\">${name}
                    </span><span style=\"color: gray\">(${args})}}</span>`;
            }
            if (name[0] === "$") { // async
                childrenToLoad++;
                macro[name].apply(this, [(result) => {
                    childrenLoaded++;
                    hook(result);
                    tryFin();
                }].concat(object, params));
            } else { // sync
                let result = macro[name].apply(this, [].concat(object, params));
                if (typeof result === "string") {
                    return result;
                } else hook(result);
            }
            return "";
        });
    }

    function processChildren (items = []) {
        items.forEach(function (i) {
            let pos = itemPos++, id, alias;
            children[pos] = i;
            if (i.extraLabel) i.extraLabel = parseDescription(i, i.extraLabel);
            if (!(alias = i.alias) || !(id = i.alias.id)) return;
            childrenToLoad++;
            db.collection("pages").find({ id: id }).toArray(function (err, its) {
                if (err) { console.error(err); }
                children[pos] = (its || [])[0] || { title: `Item with ID=${id} not found!` };
                children[pos].title = alias.title || children[pos].title;
                children[pos].desc = parseDescription(children[pos], alias.desc || children[pos].desc);
                childrenLoaded++;
                tryFin();
            });
        });
    }

    db.collection("pages").find({
        $or: [{ id: parseInt(pageId) }, { semantic: pageId }]
    }).toArray((err, items) => { if (err) console.error(err);

        thisPage = (items || [])[0];
        if (!thisPage) { render({ items: [], title: "404!" }); return; }
        childrenToLoad++; // necessarily wait for children load

        let usesFilters =
                thisPage["usesFilters"] instanceof Array && thisPage["usesFilters"].length,
            filters = [],
            findFilter = { parent: thisPage.id };

        pageObject = {
            query: query,
            title: thisPage.title,
            desc: parseDescription(thisPage, thisPage.desc),
            items: [],
            display: thisPage.display || "cards",
            pageId: pageId,
            pages: PAGES,
            parent: thisPage.parent,
            seeAlsos: thisPage["seeAlso"] || [],
            usesFilters: usesFilters ? filters : false
        };

        if (thisPage.img) pageObject.img = thisPage.img;

        if (usesFilters) {
            childrenToLoad += thisPage["usesFilters"].length;
            thisPage["usesFilters"].forEach((f, i) => {
                let ind = i;
                db.collection("filters").find({ name: f }).toArray((e, it = []) => {
                    filters[ind] = it[0] || { name: "null", label: `Unknown filter ${f}` };
                    childrenLoaded++;
                    tryFin();
                });
            });
            // todo: write filter expression, +boolean & numbers recognition
            let filterExpression = [];
            thisPage["usesFilters"].forEach((filterName) => {

                let s, i = (s = filterName + "").indexOf("."),
                    realFilterName = i !== -1 ? s.substring(0, i + 1) : s;

                let add = (v) => {
                    if (v) filterExpression.push(v);
                };

                let getFilter = (n, q) => { if (q === "") return null;
                    let val = parseFloat(q), m;
                    if ((m = n.match(/^([\w]+)\.(min|max)$/)) && !isNaN(val)) {
                        return { // find min or max
                            ["props." + m[1]]: {
                                [m[2] === "min" ? "$gte" : "$lte"]: val
                            }
                        }
                    }
                    return {
                        ["props." + n]: isNaN(val) ? q : val
                    };
                };

                let inQuery = (q) => {
                    let r = [];
                    return ["", ".min", ".max"].filter((i) => {
                        return typeof query[q + i] !== "undefined" ? ((r.push(q + i)), true) : false;
                    }), r;
                };

                inQuery(filterName).forEach((filterName) => {
                    if (query[filterName] instanceof Array) {
                        add({
                            $or: query[filterName].map(
                                e => getFilter(filterName, e)).filter((i) => { return !!i; })
                        });
                    } else add(getFilter(filterName, query[filterName]));
                });
            });
            findFilter = {
                $and: [findFilter].concat(filterExpression)
            };
        }

        // keep under
        db.collection("pages").find(findFilter).toArray((err, items) => {
            if (err) console.error(err);
            processChildren(items);
            childrenLoaded++; // release children load
            tryFin();
        });

    });

    function fin () {
        let seeAlsoArr;
        pageObject.items = sort(children, thisPage.sort).map(o => { // finally sort items
            o.desc = parseDescription(o, o.desc || "", true);
            return o;
        });
        if ((seeAlsoArr = thisPage["seeAlso"] || []).length) {
            requireSeeAlsos(seeAlsoArr, function (required) {
                pageObject.seeAlsos = required;
                render(pageObject);
            });
        } else {
            render(pageObject);
        }
    }

};