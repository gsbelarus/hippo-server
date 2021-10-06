export interface DataObject<K = string> {
  name: string;
  data: K[];
}

export interface Contact {
  name: string;
  code: string;
  address: string;
  phone: string;
  taxid: string;
  gln: string;
  edi: string;
  email: string;
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
  number: number;
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