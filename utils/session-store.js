import session from "express-session";
import { default as connectMongoDBSession } from "connect-mongodb-session";
const MongoDBStore = connectMongoDBSession(session);

const sessionStore = () => {
  const store = new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: "sessions",
  });

  // Catch errors
  store.on("error", (error) => {
    console.log(error);
  });

  return session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
  });
};

export default sessionStore;
