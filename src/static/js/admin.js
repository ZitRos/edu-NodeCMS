function init () {

    var els = [].slice.call(document.querySelectorAll("*[contenteditable=true]")),
        dels = [].slice.call(document.querySelectorAll(".card .cross")),
        changes = {},
        saveButton = document.createElement("button"),
        newId = function () {
            var i = 1;
            while (document.getElementsByName("rule-"+i).length) i++;
            return i;
        };

    saveButton.className = "save";
    saveButton.textContent = "Save Changes";

    function submit () {

        var error = null,
            changed = 0,
            got = 0;

        for (var i in changes) {
            changed++;
            post("/changePost", changes[i], function (res) {
                error = res.error || error;
                got++;
                fin();
            });
        }

        function fin () {
            if (changed !== got) return;
            alert(error || "Saved successfully!");
            if (saveButton.parentNode) {
                saveButton.parentNode.removeChild(saveButton);
            }
            if (!error) {
                els.forEach(function (el) {
                    el.style.textShadow = "";
                });
                changes = {};
            }
        }

        if (changed === 0) fin();

    }

    saveButton.addEventListener("click", submit);

    function save (id, field, value, el) {
        el.style.textShadow = "0 0 4px rgb(34, 255, 17)";
        if (!changes[id]) changes[id] = { id: parseInt(id), action: "change" };
        changes[id][field] = value;
        if (!saveButton.parentNode) document.body.appendChild(saveButton);
    }

    function addEl (el) {
        el.addEventListener("input", function () {
            var id = (el.parentNode.getAttribute("name") || "").split("-")[1];
            if (isNaN(parseInt(id))) return;
            save(id, el.getAttribute("name"), el.innerText || el.textContent, el);
        });
    }

    els.forEach(addEl);

    function addDel (el) {
        el.addEventListener("click", function () {
            var id = (el.parentNode.getAttribute("name") || "").split("-")[1];
            if (isNaN(parseInt(id))) return;
            if (changes[id] && changes[id].action === "new") {
                delete changes[id];
            } else {
                save(id, "action", "delete", el);
            }
            el.parentNode.parentNode.removeChild(el.parentNode);
        });
    }

    dels.forEach(addDel);

    document.getElementById("add").addEventListener("click", function () {
        var card = document.createElement("div"), id = newId(), r = Math.round(Math.random()*4+1);
        card.setAttribute("name", "rule-" + id);
        card.className = "wide card";
        card.innerHTML = '<button class="cross">Delete</button>\
            <div class="head" name="title" contenteditable="true" style="background-image: url(img/cards/c'+ r +'.jpg)">\
                New rule\
            </div>\
            <div class="body" name="desc" contenteditable="true" style="white-space: pre;">New rule short description,\nNew rule expanded description</div>';
        save(id, "action", "new", card);
        save(id, "title", "New rule", card);
        save(id, "desc", "New rule short description,\nNew rule expanded description", card);
        save(id, "img", "c" + r + ".jpg", card);
        var el = document.getElementById("add");
        el.parentNode.removeChild(el);
        document.body.appendChild(card);
        addEl(document.querySelector(".card[name=rule-" + id + "] div[name=title]"));
        addEl(document.querySelector(".card[name=rule-" + id + "] div[name=desc]"));
        addDel(document.querySelector(".card[name=rule-" + id + "] .cross"));
        document.body.appendChild(el);
    });

}
