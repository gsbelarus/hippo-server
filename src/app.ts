import express from "express";
import { Request, Response } from "express";
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


const client = createNativeClient(getDefaultLibraryFilename());

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

app.get("/", async (req, res) => {
  res.send("We have done successfull connection to a database");
});

const appPost = (
  endPoint: string,
  validator: (dataObj: any) => boolean,
  func: (
    dataObj: any,
    attachment: Attachment,
    transaction: Transaction
  ) => Promise<void>
) => {
  app.post(endPoint, async (req: Request, res: Response) => {
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

appPost("/values", makeDataValidator(isValueData, "value"), loadValue);

const isContractData = (obj: any): obj is Contract =>
  typeof obj === "object" &&
  typeof obj.code === "string" && obj.code; 
  
  //typeof obj.contactcode === "string" &&
  //obj.contactcode &&
  //typeof obj.datebegin === "string" &&
  //obj.datebegin;

appPost(
  "/contracts",
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
  makeDataValidator(isProtocolData, "protocol"),
  loadProtocol
);

const isContactData = (obj: any): obj is Contact =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost("/contacts", makeDataValidator(isContactData, "contact"), loadContact);

const isGoodData = (obj: any): obj is Good =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code &&
  typeof obj.groupcode === "string" &&
  obj.groupcode;

appPost("/goods", makeDataValidator(isGoodData, "good"), loadGood);

const isGoodgroupData = (obj: any): obj is Goodgroup =>
  typeof obj === "object" &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.code === "string" &&
  obj.code;

appPost(
  "/goodgroups",
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
  

appPost("/claims", makeDataValidator(isClaim, "claim"), loadClaim);

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
