/* eslint-disable  no-explicit-any */
import express, { response } from "express";
import { Request, Response, NextFunction } from 'express';
import { createNativeClient, getDefaultLibraryFilename } from 'node-firebird-driver-native';
import bodyParser from 'body-parser';
import { json } from "stream/consumers";
import { Goodgroup, Value, Contact, Good } from "./types";
import { loadContact, loadValue, loadGood, loadGoodgroup } from "./sqlqueries";
import { dbOptions } from "./config/environments/firebird";

export interface DataObject<K> {
  name: string;
  data: K[];
}

const app = express();
const PORT = 8000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.get('/', async (req,res) => {
res.send('We have done successfull connection to a database');
});

app.post('/values', async function(req, res, next) {
	try {
			res.json(req.body);
		const { name, data } = req.body as DataObject<Value>;

		const client = createNativeClient(getDefaultLibraryFilename());
		const attachment = await client.connect(`${dbOptions.server?.host}/${dbOptions.server?.port}:\\${dbOptions.path}`, 
			{	username: dbOptions.username,
				password: dbOptions.password
			});
	
			if (name === 'value' && data.length) {
			await loadValue(data, attachment);
			await attachment.disconnect();
		} 
	} catch(err) {

	}
})

	app.post('/contacts', async function(req, res, next) {
		try {
				res.json(req.body);
			const { name, data } = req.body as DataObject<Contact>;
	
			const client = createNativeClient(getDefaultLibraryFilename());
		
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
})

app.post('/goods', async function(req, res, next) {
	try {
			res.json(req.body);
		const { name, data } = req.body as DataObject<Good>;

		const client = createNativeClient(getDefaultLibraryFilename());
	
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

		const client = createNativeClient(getDefaultLibraryFilename());
	
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
})