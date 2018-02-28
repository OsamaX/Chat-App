const socket = io.connect();

socket.on("online", (active) => {
    $(".active_count").text(Object.keys(active).length)
    let html = "";
    for (let users in active) {
        html += `<p class="active-name">${active[users]}<img class="green" src="static/img/green.png" /></p>`
    }
    $(".users").html(html)
})

$("#btn-chat").click(function (e) {
    sendMessage()
})



$("#btn-input").keyup(function (e) {
    if (e.originalEvent.code == "Enter") {
        sendMessage()
    }
})


socket.on("yours", data => {
    let html = `<li class="right clearfix"><span class="chat-img pull-right">
    <img src="http://placehold.it/50/FA6F57/fff&text=ME" alt="User Avatar" class="img-circle" />
</span>
    <div class="chat-body clearfix">
        <div class="header">
            <small class=" text-muted"><span class="glyphicon glyphicon-time"></span>${data.time}</small>
            <strong class="pull-right primary-font">${data._creator.user}</strong>
        </div>
        <p>${data.text}</p>
    </d`

    $(".chat").append(html)
    
    scrollToBottom()
})

socket.on("their", data => {
    let html = `<li class="left clearfix"><span class="chat-img pull-left">
    <img src="http://placehold.it/50/55C1E7/fff&text=U" alt="User Avatar" class="img-circle" />
</span>
    <div class="chat-body clearfix">
        <div class="header">
            <strong class="primary-font">${data._creator.user}</strong> <small class="pull-right text-muted">
                <span class="glyphicon glyphicon-time"></span>${data.time}</small>
        </div>
        <p>${data.text}</p>
    </div>
</li>`

    $(".chat").append(html)
    
    scrollToBottom()
})

$(".logout").click(function(e) {
    socket.emit("log_out")
})

function sendMessage() {
    let msg = $("#btn-input").val()
    
    if (msg && msg.trim().length != 0) {
        socket.emit("input", msg)
        $("#btn-input").val("")
    }
}

function scrollToBottom() {
    let chat_Body = document.getElementById("chat-body");
    chat_Body.scrollTop = chat_Body.scrollHeight;
}

