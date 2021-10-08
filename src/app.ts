import express from "express";
import { Request, Response, NextFunction } from "express";
import {
  Attachment,
  createNativeClient,
  getDefaultLibraryFilename,
} from "node-firebird-driver-native";
import bodyParser from "body-parser";
import { json } from "stream/consumers";
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
} from "./sqlqueries";
import { dbOptions } from "./config/firebird";
import { loadClaim } from "./sqlqueries/loadClaim";

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
app.use(express.json({limit: "10mb"}));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", async (req, res) => {
  res.send("We have done successfull connection to a database");
});

const appPost = (
  endPoint: string,
  validator: (dataObj: any) => boolean,
  func: (dataObj: any, attachment: Attachment) => Promise<void>
) => {
  app.post(endPoint, async (req: Request, res: Response) => {
    const reqBodyObj = req.body;
    if (validator(reqBodyObj)) {
      try {
        const attachment = await attach();
        try {
          await func(reqBodyObj.data, attachment);
          res.statusCode = 200;
          res.json({ result: "OK", status: 200 });
        } finally {
          await attachment.disconnect();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      res.status(422).send("Unprocessable Entity");
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

const isContractData = (obj: any): obj is Contract => true;
//typeof obj === 'object'
//&& typeof obj.number === 'string' && obj.number
//&& typeof obj.code === 'string' && obj.code
//&& typeof obj.contactcode === 'string' && obj.contactcode;
//&& typeof obj.datebegin === 'Data' && obj.datebegin;

appPost("/contracts", makeDataValidator(isContractData, "contract"), loadContract);

const isProtocolData = (obj: any): obj is Protocol => true;
//typeof obj === 'object'
//&& typeof obj.code === 'string' && obj.code;
//&& typeof obj.number === 'number' && obj.number
//&& typeof obj.contactcode === 'string' && obj.contactcode
//&& typeof obj.goodcode === 'string' && obj.goodcode
//&& typeof obj.price === 'number' && obj.price;

appPost(
  "/protocols",
  makeDataValidator(isProtocolData, "protocol"),
  loadProtocol
);

const isContactData = (obj: any): obj is Contact => true;
  //typeof obj === "object" &&
  //typeof obj.name === "string" &&
  //obj.name &&
  //typeof obj.code === "string" &&
  //obj.code;

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
  typeof obj === "object"
  && typeof obj.code === "string" && obj.code
  && typeof obj.number === "number" && obj.number;



appPost("/claims",
  makeDataValidator(isClaim, "claim"),
  loadClaim
);

app.listen(PORT, () => {
  console.log(`Server now is running on port 8000`);
});

function data(data: any, attachment: Attachment) {
  throw new Error("Function not implemented.");
}

const isDataObject = (obj: any): obj is DataObject => {
  return typeof obj === "object" && obj.name && Array.isArray(obj.data);
};


function isGoodgroup(isGoodgroup: any, arg1: string): (dataObj: any) => boolean {
  throw new Error("Function not implemented.");
}
// function isGoodgroup(
  // isGoodgroup: any,
  // arg1: string
// ): (dataObj: any) => boolean {
  // throw new Error("Function not implemented.");
// }
//const isGoodData = (obj: any): obj is Good => {
//  return typeof obj === 'object' && 'name' in obj && 'code' in obj ;
//};

