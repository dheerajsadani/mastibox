import {WebSocketServer,WebSocket} from "ws";

import dotenv from "dotenv"
dotenv.config();

const PORT = process.env.PORT;

//@ts-ignore
const wss = new WebSocketServer({port:PORT,host:"0.0.0.0"});

interface roomData{
    roomId: string,
    users:WebSocket[]
}

const clients = new Map();

const roomsData:roomData[] =[];


wss.on("connection", (socket)=> {
    console.log("welcome to chat app");

    socket.on("message", (message)=> {
        const parsedMessage = JSON.parse(message as unknown as string);

        // if(parsedMessage.type == "identify"){
        //     const name = parsedMessage.payload.name;
        //     clients.set(socket,{name});
        // }

        if(parsedMessage.type =="create"){

            //get name

            const username = parsedMessage.payload.username;
            clients.set(socket,{username});
            // const meta = clients.get(socket);
            // const name = meta.name;

            //create new room id 

            function createNewRoomId():string{
                let newId="";

                for(let i:number=0; i<5 ; i++){
                    let digit = Math.floor(Math.random()*10);
                    newId+= digit.toString();
                }
                return newId;
            }

            let newRoomId = createNewRoomId();

            let isRoomExists = roomsData.filter((x)=> x.roomId == newRoomId);
            //if created room id is already created in past then looping for fresh roomID
            if(isRoomExists.length != 0){
                let i=0;
                while(true){
                    newRoomId = createNewRoomId();
                    isRoomExists = roomsData.filter((x)=> x.roomId == newRoomId);
                    i++;
                    if(isRoomExists.length == 0 || i>10){
                        break;
                    }
                }   
            }
            
            if(isRoomExists.length == 0){
                roomsData.push({
                    roomId: newRoomId as string,
                    users: [socket]
                });

                //@ts-ignore
                socket.send("Created RoomId #"+newRoomId);
                // console.log("Created RoomId #"+newRoomId);
            }else{
                socket.send("Failed to create room");
            }      
        }

        if(parsedMessage.type =="join"){

            const username = parsedMessage.payload.username;
            clients.set(socket,{username});
            //room exists or not
            const reqRoomId= parsedMessage.payload.roomId;

            const isRoomExists = roomsData.filter((x)=> x.roomId == reqRoomId);

            if(isRoomExists.length !=0){
                if(isRoomExists[0]?.users.includes(socket)){
                    socket.send("you are already part of roomID #"+reqRoomId);
                }else{
                    isRoomExists[0]?.users.push(socket);
                    ///@ts-ignore
                    socket.send("Joined RoomId #"+ reqRoomId);
                    // console.log("Joined RoomId #"+ reqRoomId);
                }   
            }else{
                socket.send("room not exists")
            }

        }

        if(parsedMessage.type =="chat"){
            
            //get name of user from clients 
            const meta = clients.get(socket);
            const username = meta.username;
            //room exists or not
            const reqRoomId= parsedMessage.payload.roomId;

            const isRoomExists = roomsData.filter((x)=> x.roomId == reqRoomId);

            //user subscribed to that roomID or not

            if(isRoomExists.length != 0){
                const isUserSubscribed = isRoomExists[0]?.users.includes(socket);
                
                if(isUserSubscribed){
                    const newMessage = parsedMessage.payload.message;

                    isRoomExists[0]?.users.map((x)=> {
                        x.send(JSON.stringify({
                            "type": "message",
                            "username": `${username}`,
                            "roomId": reqRoomId,
                            "message": `${newMessage}`
                        }));
                    })
                }else{
                    socket.send("user not subscribed to given roomId")
                }

                
            }else{
                socket.send("invalid roomId")
            }

        }
    })

 
});