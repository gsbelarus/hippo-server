import { Attachment, Transaction } from "node-firebird-driver";
import { Contract } from "../types";
import { convertingToASCII, str2date } from "../utils/helpers";

const eb = `/* contract */
EXECUTE BLOCK (CODE VARCHAR(50) = ?, NUMBER VARCHAR(50) = ?, CONTACTCODE VARCHAR(50) = ?, DATEBEGIN DATE = ?, DATEEND DATE = ?)
AS
DECLARE variable ID INTEGER;
DECLARE variable CONID INTEGER;
DECLARE variable DOCTYPE INTEGER;
DECLARE CreatorKey DFOREIGNKEY;
DECLARE CompanyKey DFOREIGNKEY;
BEGIN

  SELECT DOCUMENTKEY
  FROM USR$INV_CONTRACT
  WHERE USR$LSF_CODE = :CODE
  INTO :ID;

  SELECT ID
  FROM GD_CONTACT
  WHERE USR$LSF_CODE = :CONTACTCODE
  INTO :CONID;

  select p.id
  from gd_p_getid(147004989, 45137928) p
  into :DOCTYPE;

  IF (ID IS NULL) THEN
  BEGIN
    INSERT INTO GD_DOCUMENT (DOCUMENTTYPEKEY, PARENT, COMPANYKEY, AFULL, ACHAG, AVIEW, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE, NUMBER, DOCUMENTDATE)
    VALUES (:DOCTYPE, NULL, 650010, -1, -1, -1, 650002, current_timestamp, 650002, current_timestamp, LEFT(:NUMBER, 20), :DATEBEGIN) RETURNING ID INTO :ID;
    INSERT INTO USR$INV_CONTRACT(DOCUMENTKEY, USR$NUMBER, USR$LSF_CODE, USR$CONTACTKEY, USR$DATEEND) VALUES (:ID, :NUMBER, :CODE, :CONID, :DATEEND);
  END
  ELSE
  BEGIN
    UPDATE GD_DOCUMENT SET NUMBER = LEFT(:NUMBER, 20), DOCUMENTDATE = :DATEBEGIN, EDITIONDATE = CURRENT_TIMESTAMP  WHERE ID = :ID;
    UPDATE USR$INV_CONTRACT SET USR$CONTACTKEY = :CONID, USR$NUMBER = :NUMBER, USR$DATEEND = :DATEEND WHERE DOCUMENTKEY = :ID;  
  END
END
`;

export const loadContract = async (data: Contract[], attachment: Attachment, transaction: Transaction) => {
  const st = await attachment.prepare(transaction, eb);
  for (const rec of data) {
   
    // console.log("contract", rec);
    const DB = str2date(rec.datebegin);//rec.datebegin ? new Date (rec.datebegin) : new Date();
    const DE = rec.dateend ? str2date(rec.dateend) : null;

    await st.execute(transaction, 
      [convertingToASCII(rec.code), convertingToASCII(rec.number) || 'б/н', convertingToASCII(rec.contactcode), DB, DE]);
  }
};

export const isContractData = (obj: any): obj is Contract =>
  typeof obj === "object" &&
  typeof obj.code === "string" &&
  obj.code &&
  typeof obj.number === "string" &&
  obj.number &&
  typeof obj.contactcode === "string" &&
  obj.contactcode &&
  typeof obj.datebegin === "string" &&
  str2date(obj.datebegin);
  
  
