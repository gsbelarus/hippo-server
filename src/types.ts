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
  code:string;
  number: string;
  contactcode: string;
  datebegin: Date;
  dateend: Date;
}

export interface Protocol {
  code:string;
  number: number;
  contractcode: string;
  contactcode:string;
  datebegin: Date;
  dateend: Date;
  goodcode: string;
  price:number;
  endprice: number;
}

export interface Claim {
  code:string;
  number: number;
  docdate: Date;
  orderdate:Date;
  stringnumber: number;
  goodcode: string;
  quant: number;
}