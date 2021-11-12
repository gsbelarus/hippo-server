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
import { generateAuthToken } from "./utils/helpers";
import bcrypt from 'bcrypt';
import { findOne, insert, remove } from "./neDb";
import log from './utils/logger';

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
  const authToken = req.headers['authorization'];
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
    log.warn('requireAuth: Не пройдена авторизация');
    res.status(401).send({success: false, error: { code: 401, message: "Не пройдена авторизация"}});
  }
};

app.get("/", requireAuth, async (req, res) => {
  res.send({ success: true });
});

app.post("/log", async (req, res) => {
  console.log('exec', req.body, req.params);
  res.send({success: true, token: '123456789'});
});

app.post("/exec", async (req, res) => {
  console.log('order', req.query, req.body.length);
  res.send({success: true});
});

app.post("/sellbill", async (req, res) => {
  console.log('order', req.params);
  res.send({success: true});
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => {
    return username === u.name
  });
  if (!user) {
    log.warn('/login: Неверное имя пользователя');
    res.status(404).send({success: false, error: { code: 404, message: "Неверное имя пользователя"}});
    return;
  }
  const hashedPassword = user.password;
  //Сравним пришедший пароль с тем, который хранится у нас
  if (await bcrypt.compare(password, hashedPassword)) {
    //Сгенерируем новый токен
    const authToken = generateAuthToken();
    //Сохраним новый токен в bd для вошедшего пользователя
    await insert(db, { authToken, user });
    log.info('/login: Аутентификация успешно пройдена');
    res.status(200).send({success: true, data: { access_token: authToken }});
  } else {
    log.warn('/login: Неверный пароль');
    res.status(401).send({success: false, error: { code: 401, message: "Неверный пароль"}});
  }
});

app.post("/logout", requireAuth, async (req, res) => {
  const authToken = req.headers['authorization'];
  //Удаляем из db запись с текущем пользователем
  await remove(db, { authToken });
  // //Удаляем токен из Header
  // delete req.headers['Authorization'];
  log.info('/logout: Выход из учетной записи выполнен успешно');
  res.status(200).send({success: true});
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
    log.info(`${endPoint} Начала загрузки данных`);
    if (validator(reqBodyObj)) {
      try {
        const attachment = await attach();
        const transaction = await attachment.startTransaction();
        let success = false;
        try {
          await func(reqBodyObj, attachment, transaction);
          await transaction.commit();
          res.status(200).send({success: true});
          log.info(`${endPoint} Окончание загрузки данных`);
          success = true;
        } finally {
          if (!success) {
            await transaction.rollback();
          }
          await attachment.disconnect();
        }
      } catch (err) {
        // console.error(err);
        log.error(`${endPoint} Ошибка Firebird - ${err}`);
        res.status(500).send({success: false, error: { code: 500, message: `Ошибка Firebird: ${err}`}});
      }
    } else {
      log.error(`${endPoint} Неверный формат данных`);
      res.status(500).send({success: false, error: { code: 500, message: 'Неверный формат данных'}});
    }
  });
};

const makeDataValidator =
  (itemValidator: any) => (reqBodyObj: any) =>
    typeof reqBodyObj === "object" &&
    // reqBodyObj.name === name &&
    Array.isArray(reqBodyObj) &&
    !!reqBodyObj.length &&
    itemValidator(reqBodyObj[0]);

const isValueData = (obj: any): obj is Value =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost("/values", requireAuth, makeDataValidator(isValueData), loadValue);

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
  makeDataValidator(isContractData),
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
  makeDataValidator(isProtocolData),
  loadProtocol
);

const isContactData = (obj: any): obj is Contact =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost("/contacts", requireAuth, makeDataValidator(isContactData), loadContact);

const isGoodData = (obj: any): obj is Good =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code &&
  typeof obj.groupcode === "string" &&
  obj.groupcode;

appPost("/goods", requireAuth, makeDataValidator(isGoodData), loadGood);

const isGoodgroupData = (obj: any): obj is Goodgroup =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost(
  "/goodgroups",
  requireAuth,
  makeDataValidator(isGoodgroupData),
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

appPost("/claims", requireAuth, makeDataValidator(isClaim), loadClaim);

const isRemains = (obj: any): obj is Claim =>
  typeof obj === "object" &&
  typeof obj.code === "string" &&
  obj.code
  //&& typeof obj.quant === "number" &&
  //obj.number
  //&& typeof obj.remainsdate === "string" &&
  //obj.remainsdate;


appPost("/remains", requireAuth, makeDataValidator(isRemains), loadRemains);


app.listen(PORT, () => {
  log.info(`Server is running on port ${PORT}`);
  // console.log(`Server now is running on port ${PORT}`);
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
  log.info(`shutdown: Все данные по пользователям очищены`)
};

process
  .on('exit', code => log.info(`Process exit event with code: ${code}`))
  .on('SIGINT', async () => {
    log.info('Ctrl-C...');
    log.info('Finished all requests');
    await shutdown('SIGINT received...');
    process.exit();
  })
  .on('SIGTERM', async () => {
    await shutdown('SIGTERM received...');
    process.exit();
  })
  .on('unhandledRejection', (reason, p) => console.error({ err: reason }, p))
  .on('uncaughtException', err => console.error(err));

