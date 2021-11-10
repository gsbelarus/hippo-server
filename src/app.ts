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
  Contract,
  Protocol,
  Claim,
  IUser,
} from "./types";
import {
  loadContact,
  loadValue,
  loadGood,
  loadGoodgroup,
  loadContract,
  loadProtocol,
  loadClaim,
  loadRemains,
} from "./sqlqueries";
import { dbOptions } from "./config/firebird";
import config from '../src/config/environment';
import { generateAuthToken } from "./utils";
import bcrypt from 'bcrypt';
import { findOne, insert, remove } from "./neDb";

const client = createNativeClient(getDefaultLibraryFilename());

const db = new Datastore();
db.loadDatabase();

const user: IUser = {
  name: config.USER_NAME,
  password: config.USER_PASSWORD,
};

const users = [user];

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

app.use(async (req: any, res: Response, next: NextFunction) => {
  // Получение значения из header
  const authToken = req.headers['authtoken'];

  // Поиск пользователя из db по токену
  const item = await findOne(db, { authToken });

  // Сохраняем объект пользователя в свойство user,
  // чтобы в следующих запросах разрешить доступ этому пользователю
  req.user = item?.user;
  next();
});

// Middleware для проверки пользователя
// Подставляем его в те запросы, где важна аутентификация
const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  if (req.user) {
    next();
  } else {
    res.status(401).send({ success: false, error: { code: 401, message: "Не пройдена аутентификация" } });
  }
};

app.get("/", requireAuth, async (req, res) => {
  res.send({ success: true });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => {
    return username === u.name
  });

  if (!user) {
    res.status(404).send({ success: false, error: { code: 404, message: "Неверное имя пользователя" } });
    return;
  }

  const hashedPassword = user.password;

  //Сравним пришедший пароль с тем, который хранится у нас
  if (await bcrypt.compare(password, hashedPassword)) {
    //Сгенерируем новый токен
    const authToken = generateAuthToken();

    //Сохраним новый токен в bd для вошедшего пользователя
    await insert(db, { authToken, user });

    // Установим токен авторизации в Header
    res.setHeader('authtoken', authToken)

    res.status(200).send({ success: true });
  } else {
    res.status(401).send({ success: false, error: { code: 401, message: "Неверный пароль" } });
  }
});

app.post("/logout", async (req, res) => {

  const authToken = req.headers['authtoken'];

  //Удаляем из db запись с текущем пользователем
  await remove(db, { authToken });

  //Удаляем токен из Header
  delete req.headers['authtoken'];

  res.status(200).send({ success: true });
});

const appPost = (
  endPoint: string,
  authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  validator: (dataObj: any) => boolean,
  func: (
    dataObj: any,
    attachment: Attachment,
    transaction: Transaction
  ) => Promise<void>
) => {
  app.post(endPoint, authMiddleware, async (req: Request, res: Response) => {
    const reqBodyObj = req.body;
    if (validator(reqBodyObj)) {
      try {
        const attachment = await attach();
        const transaction = await attachment.startTransaction();
        let success = false;
        try {
          await func(reqBodyObj.data, attachment, transaction);
          await transaction.commit();
          res.status(200).send({ success: true });
          success = true;
        } finally {
          if (!success) {
            await transaction.rollback();
          }
          await attachment.disconnect();
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, error: { code: 500, message: `Firebird error: ${err}` } });
      }
    } else {
      res.status(500).send({ success: false, error: { code: 500, message: 'Invalid data' } });
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
  makeDataValidator(isGoodgroupData, "goodgroup"),
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

const isRemains = (obj: any): obj is Claim =>
  typeof obj === "object" &&
  typeof obj.code === "string" &&
  obj.code
  //&& typeof obj.quant === "number" &&
  //obj.number
  //&& typeof obj.remainsdate === "string" &&
  //obj.remainsdate;


appPost("/remains", requireAuth, makeDataValidator(isRemains, "remains"), loadRemains);


app.listen(PORT, () => {
  console.log(`Server now is running on port ${PORT}`);
});

// function data(data: any, attachment: Attachment) {
//   throw new Error("Function not implemented.");
// }

// const isDataObject = (obj: any): obj is DataObject => {
//   return typeof obj === "object" && obj.name && Array.isArray(obj.data);
// };

// function isGoodgroup(
//   isGoodgroup: any,
//   arg1: string
// ): (dataObj: any) => boolean {
//   throw new Error("Function not implemented.");
// }

/**
 * При завершении работы удаляем все данные
 */

const shutdown = async (msg: string) => {
  await remove(db, {});
};

process
  .on('exit', code => console.log(`Process exit event with code: ${code}`))
  .on('SIGINT', async () => {
    await shutdown('SIGINT received...');
    process.exit();
  })
  .on('SIGTERM', async () => {
    await shutdown('SIGTERM received...');
    process.exit();
  })
  .on('unhandledRejection', (reason, p) => console.error({ err: reason }, p))
  .on('uncaughtException', err => console.error(err));

