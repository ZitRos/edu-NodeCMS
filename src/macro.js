import {db} from "./mongo";

var count = 0;

var replaceDateInProps = (o) => {
    let m;
    for (let p in o) {
        if (!o.hasOwnProperty(p)) continue;
        if (typeof o[p] === "string" && (m = o[p].match(/Date\(([0-9\-TZ:\.]*)\)/))) {
            o[p] = new Date(m[1]);
            console.log(o[p]);
        }
        if (typeof o[p] === "object") o[p] = replaceDateInProps(o[p]);
    }
    return o;
};

export function reset () {
    count = 0;
    return "";
}

export function link (object, text, href) {
    return `<a href="${href}">${text}</a>`;
}

export function prop (object = {}, propName = "", labelIfTrue = "", labelIfFalse = "") {
    propName.split(".").forEach((p) => {
        object = typeof object[p] !== "undefined" ? object[p] : {}; // @dynamic
    });
    return labelIfTrue || labelIfFalse ? (object ? labelIfTrue || "" : labelIfFalse || "")
        : object + "";
}

export function img (object, src, size, pos) {
    count++;
    return `<img src="${src}" class="floatImg${pos ? pos : count % 2 === 0 ? " right" : ""}"${size ? ` style="width:${size}px"` : `` }/>`;
}

// test: db.getCollection('pages').find({ id: { $in: [8, 9, 10, 11, 12] } })
export function $addChildren (callback, object, pageId, criteria) {

    db.collection("pages").find({
        $and: [ {$or: [{ parent: parseInt(pageId) }, { "parent.semantic": pageId }]} ].concat(criteria ? ((c) => {try { return [replaceDateInProps(JSON.parse((c+"")))] } catch(e) { console.error(c, e); return []; }})(criteria) : [])
    }).toArray(function (err, items = []) {
        callback({
            children: items
        });
    });

}