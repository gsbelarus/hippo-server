import { time } from "console";
import { Request } from "express"

export interface DataObject<K = string> {
  name: string;
  data: K[];
}

export interface Contact {
  code: string;
  name: string;
  taxid: string;
  address?: string;
  phone?: string;
  email?: string;
  gln?: string;
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
  name: string;
  nameLabel: string; 
  valuecode: string;
  groupcode: string;
  disabled?: number;
  rate?: number;  
  moq?: number;
  weight?: number;
  barcode?: string;
}

export interface Contract {
  code: string;
  number: string;
  contactcode: string;
  datebegin: string;
  dateend?: string;
}

export interface Protocol {
  code: string;
  number: string;
  contractcode: string;
  contactcode: string;
  datebegin: string;
  dateend?: string;
  goodcode: string;
  price: number;
  endprice: number;
}

export interface Claim {
  number: string;
  docdate: string;
  orderdate: string;
  stringnumber: number;
  goodcode: string;
  quant: number;
}

export interface Remains {
  code: string;
  quant: number;
  remainsdate: string;
  makedate?: string;
  maketime?: string;
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

export interface IResponse<T = undefined> {
  success: boolean;
  error?: IError;
  data?: T;
}
