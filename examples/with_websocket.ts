import { BaseController, Controller, Dero, Get, Handler, Type } from "./../mod.ts";

// deno-fmt-ignore
const html = `
    <html>
      <head>
        <title>Hello Chat</title>
        <script>
            window.onload = function(){ 
                const ws = new WebSocket("ws://localhost:3000/ws");
                const chat = document.getElementById("my_chat");
                const form = document.getElementById("my_form");
                const message = document.getElementById("my_message");
                ws.onmessage = (e) => {
                    chat.innerHTML += "<b>Friend: </b>" + e.data + "<br/>";
                }
                form.onsubmit = (e) => {
                    e.preventDefault();
                    if (!message.value || ws.readyState !== 1){
                        return;
                    }
                    ws.send(message.value);
                    chat.innerHTML += "<b>Me: </b>" + message.value + "<br/>";
                    message.value = "";
                }
            };
        </script>
      </head>
      <body style="width: 80%; margin: auto">
        <h1>Simple Chat App</h1>
        <hr/>
        <div id="my_chat"></div>
        <form id="my_form">
            <input id="my_message" placeholder="message" />
            <button type="submit">SEND</button>
        </form>
      </body>
    </html>
`;

@Controller()
class SocketController extends BaseController {
  
  @Type('html')
  @Get('/')
  index() {
    return html;
  }

  @Get('/ws')
  socket() {
    const { headers, request } = this.request;
    if (headers.get("upgrade") != "websocket") {
      return this.next();
    }
    const { socket, response } = Deno.upgradeWebSocket(request);
    const channel = new BroadcastChannel("chat");
    socket.onmessage = (e) => channel.postMessage(e.data);
    socket.onclose = () => channel.close();
    socket.onerror = () => channel.close();
    channel.onmessage = (e) => socket.send(e.data);
    return response;
  }
}

class App extends Dero {
  constructor() {
    super();
    this.use({
      class: [SocketController],
    });
  }
}

await new App().listen(3000);


