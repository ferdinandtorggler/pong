document.addEventListener('DOMContentLoaded', function () {
    var instructions = document.getElementById('instructions'),
        i,
        randomRoom = '',
        url;

    for (i = 0; i < 5; i++)
        randomRoom += '' + Math.round(Math.random() * 9);

    url = location.host + '/room/' + randomRoom;

    instructions.innerHTML += '<p><a href="/room/' + randomRoom + '">' + url + '</a></p>';
});