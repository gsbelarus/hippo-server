import express, { NextFunction, Response, Request } from "express";
import cookieParser from "cookie-parser";
import Datastore from 'nedb';
import {
  Attachment,
  createNativeClient,
  getDefaultLibraryFilename,
  Transaction,
} from "node-firebird-driver-native";
import {
  Goodgroup,
  Value,
  Contact,
  Good,
  DataObject,
  Contract,
  Protocol,
  Claim,
  IUserRequest,
  IUser,
  AuthToken,
} from "./types";
import {
  loadContact,
  loadValue,
  loadGood,
  loadGoodgroup,
  loadContract,
  loadProtocol,
  loadClaim,
} from "./sqlqueries";
import { dbOptions } from "./config/firebird";
import { generateAuthToken, getHashedPassword } from "./utils";
import bcrypt from 'bcrypt';

const client = createNativeClient(getDefaultLibraryFilename());

const db = new Datastore({filename : 'users'});
db.loadDatabase();

const attach = () =>
  client.connect(
    `${dbOptions.server?.host}/${dbOptions.server?.port}:${dbOptions.path}`,
    {
      username: dbOptions.username,
      password: dbOptions.password,
    }
  );

const app = express();
const PORT = 8000;
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const findOne = async(token: string): Promise<IUser | void> => {
  console.log('1');
  db.findOne({authToken: token}, (err: any, item: any) => {
    console.log('11', item.user);
    // Добавление авторизованного пользователя в запрос
    return user;
  });
}

app.use(async(req: any, res: Response, next: NextFunction) => {
    // Получение значения из cookie
    const authToken = req.cookies['AuthToken'];
    console.log('0', authToken);
    const user = await findOne(authToken);
    console.log('2');
    req.user = user;
    next();
});

const requireAuth = async (req: any , res: Response) => {
  console.log('3', req.user);
  if (req.user) {
    //next();
  } else {
    res.status(401).send ("Не пройдена аутентификация");
  }
};

app.get("/docs", requireAuth, (req, res) => {
  res.send("We have done successfull connection to a database");
});

app.post("/logout", (req, res) => {
  const authToken = req.cookies['AuthToken'];
  //delete authTokens[authToken];
  db.remove({authToken: authToken}, {});
  delete req.cookies['AuthToken'];
  res.send("Logout");
});

app.get("/", async (req, res) => {
  res.send("We have done successfull connection to a database");
});

const authTokens: AuthToken = {};

const user: IUser = {
  name: 'User',
  password: '$2b$10$zWm7EcFdQ3TXQ3jXoLqC5.byzS1w4.CEbhP1Fk/kG6NWjRt3a/slK',
}

const users = [user];

//  (async () => {
//   const p = await getHashedPassword('user1');
//   console.log('fff', p);
// })();

app.get("/login", async (req, res) => {
  const { name, password } = req.body;

  const user = users.find(u => {
    return name === u.name
  });

  if (!user) {
    res.status(404).send ("Неверное имя пользователя");
    return;
  }

  const hashedPassword = user.password;

  if (await bcrypt.compare(password, hashedPassword)) {
    const authToken = generateAuthToken();

    //authTokens[authToken] = user;
    db.insert({ authToken, user });

    // Установка токена авторизации в куки
    res.cookie('AuthToken', authToken, {
      maxAge: 3600 * 24 * 7,
      // secure: true,
    });

    // const dd = db.getAllData();

    // console.log('db', dd);

    db.findOne({authToken: authToken}, function (err: any, user: IUser) {
      // console.log('authToken', user);
      // Добавление авторизованного пользователя в запрос
      // console.log('db', user);
    });
    // res.cookie('AuthToken', authToken);

    res.status(200).send("Аутентификация пройдена успешно");
  } else {
    res.status(401).send ("Неверный пароль");
  }
});

const appPost = (
  endPoint: string,
  authMiddleware: (req: Request, res: Response) => Promise<void>,
  validator: (dataObj: any) => boolean,
  func: (
    dataObj: any,
    attachment: Attachment,
    transaction: Transaction
  ) => Promise<void>
) => {
  app.post(endPoint, authMiddleware, async (req: Request, res: Response) => {
    // await authMiddleware(req, res);
    const reqBodyObj = req.body;
    if (validator(reqBodyObj)) {
      try {
        const attachment = await attach();
        const transaction = await attachment.startTransaction();
        let success = false;
        try {
          await func(reqBodyObj.data, attachment, transaction);
          await transaction.commit();
          res.statusCode = 200;
          res.json({ result: "OK", status: 200 });
          success = true;
        } finally {
          if (!success) {
            await transaction.rollback();
          }
          await attachment.disconnect();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send(`Firebird error: ${err}`);
      }
    } else {
      res.status(500).send("Invalid data");
    }
  });
};

const makeDataValidator =
  (itemValidator: any, name: string) => (reqBodyObj: any) =>
    typeof reqBodyObj === "object" &&
    reqBodyObj.name === name &&
    Array.isArray(reqBodyObj.data) &&
    !!reqBodyObj.data.length &&
    itemValidator(reqBodyObj.data[0]);

const isValueData = (obj: any): obj is Value =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost("/values", requireAuth, makeDataValidator(isValueData, "value"), loadValue);

const isContractData = (obj: any): obj is Contract =>
  typeof obj === "object" &&
  typeof obj.code === "string" && obj.code;

  //typeof obj.contactcode === "string" &&
  //obj.contactcode &&
  //typeof obj.datebegin === "string" &&
  //obj.datebegin;

appPost(
  "/contracts",
  requireAuth,
  makeDataValidator(isContractData, "contract"),
  loadContract
);

const isProtocolData = (obj: any): obj is Protocol =>
  typeof obj === "object" &&
  typeof obj.code === "string" &&
  obj.code;
  //&&
  //typeof obj.number === "number" &&
  //obj.number &&
  //typeof obj.contactcode === "string" &&
  //obj.contactcode &&
  //typeof obj.goodcode === "string" &&
  //obj.goodcode &&
  //typeof obj.price === "number" &&
  //obj.price;

appPost(
  "/protocols",
  requireAuth,
  makeDataValidator(isProtocolData, "protocol"),
  loadProtocol
);

const isContactData = (obj: any): obj is Contact =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost("/contacts", requireAuth, makeDataValidator(isContactData, "contact"), loadContact);

const isGoodData = (obj: any): obj is Good =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code &&
  typeof obj.groupcode === "string" &&
  obj.groupcode;

appPost("/goods", requireAuth, makeDataValidator(isGoodData, "good"), loadGood);

const isGoodgroupData = (obj: any): obj is Goodgroup =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost(
  "/goodgroups",
  requireAuth,
  makeDataValidator(isGoodgroup, "goodgroup"),
  loadGoodgroup
);
const isClaim = (obj: any): obj is Claim =>
  typeof obj === "object" &&
  typeof obj.goodcode === "string" &&
  obj.goodcode
  && typeof obj.number === "string" &&
  obj.number
  && typeof obj.docdate === "string" &&
  obj.docdate;


appPost("/claims", requireAuth, makeDataValidator(isClaim, "claim"), loadClaim);

app.listen(PORT, () => {
  console.log(`Server now is running on port 8000`);
});

function data(data: any, attachment: Attachment) {
  throw new Error("Function not implemented.");
}

const isDataObject = (obj: any): obj is DataObject => {
  return typeof obj === "object" && obj.name && Array.isArray(obj.data);
};

function isGoodgroup(
  isGoodgroup: any,
  arg1: string
): (dataObj: any) => boolean {
  throw new Error("Function not implemented.");
}


