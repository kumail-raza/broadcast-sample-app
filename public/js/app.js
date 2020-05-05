const getNextAvailableBox = function () {
    const availableBox = $('.box').toArray().filter(function (i) {
        var occupied = $('#' + i.id).find('[class*="OT_root"]').length > 0;
        console.log(i.id, occupied)
        return !occupied
    })
    return availableBox[0].id;
}

var getToken = (id, name, type) => {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: "http://localhost:8083/live/demo/accessToken",
            type: "post",
            "headers": {
                "Content-Type": "application/json"
            },
            data: JSON.stringify({user: {id, name, userType: type}}),
            success: resolve,
            error: reject
        });
    })
}
