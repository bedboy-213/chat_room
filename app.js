const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
const { getDatabase, ref, push, get } = require("firebase/database");
const { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require("./firebase");

const app = express();
const server = http.createServer(app); // إنشاء خادم HTTP
const io = new Server(server); // إعداد Socket.IO

// إعداد EJS
app.set("view engine", "ejs");
app.use(express.static("public"));

// إعداد Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// إعداد الجلسات
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// التحقق من تسجيل الدخول
function checkAuth(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

// المسار الأساسي
app.get("/", (req, res) => {
  res.redirect("/login");
});

// عرض صفحة التسجيل
app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

// عرض صفحة تسجيل الدخول
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// عرض صفحة الترحيب
app.get("/welcome", checkAuth, (req, res) => {
  res.render("welcome", { username: req.session.user.email.split("@")[0] });
});

// عرض صفحة الدردشة
app.get("/chat", checkAuth, (req, res) => {
  const db = getDatabase();
  const messagesRef = ref(db, "messages");

  // جلب الرسائل
  get(messagesRef)
    .then((snapshot) => {
      const messages = snapshot.exists() ? Object.values(snapshot.val()) : [];
      res.render("chat", {
        username: req.session.user.email.split("@")[0],
        messages: messages, // إرسال الرسائل إلى chat.ejs
      });
    })
    .catch((error) => {
      res.render("chat", {
        username: req.session.user.email.split("@")[0],
        messages: [],
        error: error.message,
      });
    });
});

// تسجيل مستخدم جديد
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      set(ref(getDatabase(), "users/" + user.uid), { email: user.email })
        .then(() => {
          res.redirect("/login");
        })
        .catch((error) => {
          res.render("register", { error: error.message });
        });
    })
    .catch((error) => {
      res.render("register", { error: error.message });
    });
});

// تسجيل الدخول
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      req.session.user = { email: userCredential.user.email };
      res.redirect("/welcome");
    })
    .catch((error) => {
      res.render("login", { error: error.message });
    });
});

// تسجيل الخروج
app.get("/logout", (req, res) => {
  signOut(auth)
    .then(() => {
      req.session.destroy();
      res.redirect("/login");
    })
    .catch((error) => {
      res.send({ error: error.message });
    });
});

// إعداد الأحداث عبر Socket.IO
io.on("connection", (socket) => {
  console.log("User connected");

  const db = getDatabase();
  const messagesRef = ref(db, "messages");

  // استقبال الرسالة من المستخدم
  socket.on("send-message", (data) => {
    if (!data.text.trim()) return;

    const message = {
      text: data.text,
      sender: data.sender,
      timestamp: Date.now(),
    };

    // حفظ الرسالة في Firebase
    push(messagesRef, message)
      .then(() => {
        io.emit("new-message", message); // إرسال الرسالة للجميع
      })
      .catch((error) => {
        console.error("Error saving message:", error.message);
      });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

