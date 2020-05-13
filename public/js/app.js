var baseURL = 'https://dev-pc.voicevoice.com'

const getNextAvailableBox = function () {
    const availableBox = $('.box').toArray().filter(function (i) {
        var occupied = $('#' + i.id).find('[class*="OT_root"]').length > 0;
        console.log(i.id, occupied)
        return !occupied
    })
    return availableBox[0] ? availableBox[0].id.replace(/[a-z]/g, '') : null;
}


var getFromSession = (sessionKey, field) => {
    const value = JSON.parse(sessionStorage.getItem(sessionKey))
    return value ? value[field] : null;
}

var getToken = (id, name, type) => {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: `${baseURL}/live/${getFromSession('conversation', 'stringId')}/accessToken`,
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
