import express from "express";
import { Request, Response, NextFunction } from 'express';
import { createNativeClient, getDefaultLibraryFilename } from 'node-firebird-driver-native';
import bodyParser from 'body-parser';
import { json } from "stream/consumers";
import { Goodgroup, Value, Contact, Good, DataObject } from "./types";
import { loadContact, loadValue, loadGood, loadGoodgroup } from "./sqlqueries";
import { dbOptions } from "./config/firebird";

const client = createNativeClient(getDefaultLibraryFilename());

const attach = () => client.connect(`${dbOptions.server?.host}/${dbOptions.server?.port}:\\${dbOptions.path}`,
  {
    username: dbOptions.username,
    password: dbOptions.password
  }
);

const app = express();
const PORT = 8000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/', async (req,res) => {
  res.send('We have done successfull connection to a database');
});

app.post('/values', async (req, res) => {

  // проверить, что нам пришел объект нужной структуры.

	const { name, data } = req.body as DataObject<Value>;

	try {
    const attachment = await attach();
    try {
      if (name === 'value' && data.length) {
        await loadValue(data, attachment);
      }
      res.statusCode = 200;
    } finally {
			await attachment.disconnect();
    }
	} catch(err) {
    console.error(err);
	}
});

app.post('/contacts', async function(req, res, next) {
  try {
      res.json(req.body);
    const { name, data } = req.body as DataObject<Contact>;

    const attachment = await client.connect(`${dbOptions.server?.host}/${dbOptions.server?.port}:\\${dbOptions.path}`,
    {	username: dbOptions.username,
      password: dbOptions.password
    });

      if (name === 'contact' && data.length) {
      await loadContact(data, attachment);
      await attachment.disconnect();
    }
  } catch(err) {

  }
});

app.post('/goods', async function(req, res, next) {
	try {
			res.json(req.body);
		const { name, data } = req.body as DataObject<Good>;

		const attachment = await client.connect(`${dbOptions.server?.host}/${dbOptions.server?.port}:\\${dbOptions.path}`,
		{	username: dbOptions.username,
			password: dbOptions.password
		});

			if (name === 'good' && data.length) {
			await loadGood(data, attachment);
			await attachment.disconnect();
		}
	} catch(err) {

	}
})

app.post('/goodgroups', async function(req, res, next) {
	try {
			res.json(req.body);
		const { name, data } = req.body as DataObject<Goodgroup>;

		const attachment = await client.connect(`${dbOptions.server?.host}/${dbOptions.server?.port}:\\${dbOptions.path}`,
		{	username: dbOptions.username,
			password: dbOptions.password
		});

			if (name === 'goodgroup' && data.length) {
			await loadGoodgroup(data, attachment);
			await attachment.disconnect();
		}
	} catch(err) {

	}
})


app.listen(PORT, () => {
 console.log(`Server now is running on port 8000`);
});