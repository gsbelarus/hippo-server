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

const client = createNativeClient(getDefaultLibraryFilename());

const attach = () => client.connect(
  `${dbOptions.server?.host}/${dbOptions.server?.port}:${dbOptions.path}`,
  {
    username: dbOptions.username,
    password: dbOptions.password,
  }
);

const app = express();
const PORT = 8000;
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.get("/", async (req, res) => {
  res.send("We have done successfull connection to a database");
});

app.post("/values", async (req, res) => {
  if (!isDataObject(req.body)) {
    //TODO
    res.status(422).send('Unprocessable Entity'); 
  }

  const { name, data } = req.body as DataObject<Value>;
  try {
    const attachment = await attach();
    try {
      if (name === "value" && data.length) {
        await loadValue(data, attachment);
      }
      res.statusCode = 200;
      res.json({ result: 'OK', status: 200 });
    } finally {
      await attachment.disconnect();
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/contacts", async (req, res) => {
  const { name, data } = req.body as DataObject<Contact>;
  try {
    const attachment = await attach();
    try {
      if (name === "contact" && data.length) {
        await loadContact(data, attachment);
      }
      res.statusCode = 200;
    } finally {
      await attachment.disconnect();
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/goods", async (req, res) => {
  if (!isDataObject(req.body)) {
    //TODO
    res.status(422).send('Something broke!');
  }
  const { name, data } = req.body as DataObject<Good>;
  
  // if (data.length = 0) {
  //   res.status(422).send('Something broke!');
  // }

  // if (!isGoodData(data[0])) {
  //   res.status(422).send('Something broke!');
  // }
 
  try {
    const attachment = await client.connect(
      "192.168.0.69/3054:k:/Bases/Gippo/FABRIKA.FDB",
      {
        username: dbOptions.username,
        password: dbOptions.password,
      }
    );
    try {
      if (name === "good" && data.length) {
        await loadGood(data, attachment);
      }
      res.statusCode = 200;
      res.json({result: 'OK'});
    } finally {
      await attachment.disconnect();
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/goodgroups", async (req, res) => {
  const { name, data } = req.body as DataObject<Goodgroup>;
  try {
    const attachment = await client.connect(
      "vkl/3054:k:/Bases/Gippo/FABRIKA.FDB",
      { username: dbOptions.username, password: dbOptions.password }
    );
    try {
      if (name === "goodgroup" && data.length) {
        await loadGoodgroup(data, attachment);
      }
      res.statusCode = 200;
      // res.json();
    } finally {
      await attachment.disconnect();
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/contracts", async (req, res) => {
  const { name, data } = req.body as DataObject<Contract>;
  try {
    const attachment = await attach();
    try {
      if (name === "contract" && data.length) {
        await loadContract(data, attachment);
      }
      res.statusCode = 200;
    } finally {
      await attachment.disconnect();
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/protocols", async (req, res) => {
  const { name, data } = req.body as DataObject<Protocol>;
  try {
    const attachment = await attach();
    try {
      if (name === "protocol" && data.length) {
        await loadProtocol(data, attachment);
      }
      res.statusCode = 200;
    } finally {
      await attachment.disconnect();
    }
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server now is running on port 8000`);
});

function data(data: any, attachment: Attachment) {
  throw new Error("Function not implemented.");
}

const isDataObject = (obj: any): obj is DataObject => {
  return typeof obj === 'object' && 'name' in obj && 'data' in obj ;
};

const isValueData = (obj: any): obj is Value => {
  return typeof obj === 'object' && 'name' in obj && 'code' in obj ;
};

const isGoodData = (obj: any): obj is Good => {
  return typeof obj === 'object' && 'name' in obj && 'code' in obj ;
};
