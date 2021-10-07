const functions = require("firebase-functions");

// Firebase 어드민 SDK 모듈 임포트
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const express = require("express");
const app = express();

const cors = require("cors")({ origin: true });
app.use(cors);

// 사용자 정보 알아내기
const anonymousUser = {
  id: "anon",
  name: "Anonymous",
  avatar: "",
};

const checkUser = (req, res, next) => {
  req.user = anonymousUser;

  if (req.query.auth_token != undefined) {
    const idToken = req.query.auth_token;
    admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedIdToken) => {
        const authUser = {
          id: decodedIdToken.user_id,
          name: decodedIdToken.name,
          avatar: decodedIdToken.picture,
        };
        req.user = authUser;
        next();
      })
      .catch((error) => {
        next();
      });
  } else {
    next();
  }
};

app.use(checkUser);

// 채널 생성 API
const createChannel = (cname) => {
  const channelsRef = admin.database().ref("channels");
  const date1 = new Date();
  const date2 = new Date();
  date2.setSeconds(date2.getSeconds() + 1);
  const defaultData = `{
        "messages" : {
            "1" : {
                "body" : "Welcome to #${cname} channel!",
                "date" : "${date1.toJSON()}",
                "user" : {
                    "avatar" : "",
                    "id" : "robot",
                    "name" : "Robot"
                }
            },
            "2" : {
                "body" : "첫 번째 메시지를 보내 봅시다.",
                "date" : "${date2.toJSON()}",
                "user" : {
                    "avatar" : "",
                    "id" : "robot",
                    "name" : "Robot"
                }
            }
        }
    }`;
  channelsRef.child(cname).set(JSON.parse(defaultData));
};

app.post("/channels", (req, res) => {
  const cname = req.body.cname;
  createChannel(cname);
  res.header("Content-Type", "application/json; charset=utf-8");
  res.status(201).json({ result: "ok" });
});

// 채널 목록 확인 API
app.get("/channels", (req, res) => {
  const channelsRef = admin.database().ref("channels");
  channelsRef.once("value", function (snapshot) {
    const items = [];
    snapshot.forEach(function (childSnapshot) {
      const cname = childSnapshot.key;
      items.push(cname);
    });
    res.header("Content-Type", "application/json; charset=utf-8");
    res.send({ channels: items });
  });
});

// 지정한 채널에 새 메시지를 추가하는 API
app.post("/channels/:cname/messages", (req, res) => {
  const cname = req.params.cname;
  const message = {
    date: new Date().toJSON(),
    body: req.body.body,
    user: req.user,
  };
  const messagesRef = admin.database().ref(`channels/${cname}/messages`);
  messagesRef.push(message);
  res.header("Content-Type", "application/json; charset=utf-8");
  res.status(201).send({ result: "ok" });
});

// 채널 내 메시지 목록을 확인하는 API
app.get("/channels/:cname/messages", (req, res) => {
  const cname = req.params.cname;
  const messagesRef = admin
    .database()
    .ref(`channels/${cname}/messages`)
    .orderByChild("date")
    .limitToLast(20);
  messagesRef.once("value", function (snapshot) {
    const items = [];
    snapshot.forEach(function (childSnapshot) {
      const message = childSnapshot.val();
      message.id = childSnapshot.key;
      items.push(message);
    });
    items.reverse();
    res.header("Content-Type", "application/json; charset=utf-8");
    res.send({ messages: items });
  });
});

// 초기 상태로 되돌리기
app.post("/reset", (req, res) => {
  createChannel("general");
  createChannel("random");
  res.header("Content-Type", "application/json; charset=utf-8");
  res.status(201).send({ result: "ok" });
});

// RESTful API를 사용 가능한 상태로 만들기
exports.v1 = functions.https.onRequest(app);
