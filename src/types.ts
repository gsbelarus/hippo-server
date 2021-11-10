import { time } from "console";
import { Request } from "express"

export interface DataObject<K = string> {
  name: string;
  data: K[];
}

export interface Contact {
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gln: string;
  taxid: string;

}

export interface Value {
  name: string;
  code: string;
  shortName: string;
}
export interface Goodgroup {
  name: string;
  code: string;
  parentcode: string;
}
export interface Good {
  code: string;
  rate: number;
  name: string;
  weight: number;
  disabled: number;
  barcode: string;
  valuecode: string;
  groupcode: string;
  moq: number;
}

export interface Contract {
  code: string;
  number: string;
  contactcode: string;
  datebegin: Date;
  dateend: Date;
}

export interface Protocol {
  code?: string;
  number: string;
  contractcode: string;
  contactcode: string;
  datebegin: Date;
  dateend: Date;
  goodcode: string;
  price: number;
  endprice: number;
}

export interface Claim {
  code?: string;
  number: string;
  docdate: Date;
  orderdate: Date;
  stringnumber: number;
  goodcode: string;
  quant: number;
}

export interface Remains {
  code?: string;
  quant: number;
  remainsdate: string;
  makedate: string;
  maketime: string;
}

export interface IUser {
  name: string;
  password: string;
}

export interface IUserRequest extends Request {
  user: IUser;
}

export type AuthToken = {
  [name: string]: IUser;
}

export interface IError {
  code: number;
  message: string;
}

export interface IResponse {
  success: boolean;
  error?: IError;
}