var post = function (url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    //if (this.SEND_COOKIES) xhr.withCredentials = true;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback((function () {
                try {
                    return JSON.parse(xhr.responseText) || {};
                } catch (e) {
                    try {
                        var temp = null;
                        eval("temp=" + xhr.responseText);
                        return temp;
                    } catch (e) {
                        return {
                            error: "<h1>Unable to parse server response</h1><p>" + xhr.responseText
                            + "</p>"
                        };
                    }
                }
            })());
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            callback({
                error:
                    (xhr.responseText || "Unknown server error!")
                    + " " + xhr.status + ": " + xhr.statusText
            });
        }
    };
    //if (this.USERNAME && this.PASSWORD) {
    //    xhr.setRequestHeader("Authorization", "Basic " + btoa(this.USERNAME + ":" + this.PASSWORD));
    //}
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(JSON.stringify(data));
};
