import { Attachment, Transaction } from "node-firebird-driver";
import { Protocol } from "../types";
import { convertingToASCII, str2date } from "../utils/helpers";

const eb = `/* protocol*/
EXECUTE BLOCK (CODE VARCHAR(50) = ?, NUMBER VARCHAR(50) = ?, CONTRACTCODE VARCHAR(50) = ?, CONTACTCODE VARCHAR(50) = ?, DATEBEGIN DATE = ?, DATEEND DATE = ?, GOODCODE VARCHAR(50) = ?, PRICE DOUBLE PRECISION = ?, ENDPRICE DOUBLE PRECISION = ?)
AS
DECLARE variable ID INTEGER;
DECLARE variable PRICEID INTEGER;
DECLARE variable LID INTEGER;
DECLARE variable CONID INTEGER;
DECLARE variable CONTRID INTEGER;
DECLARE variable GOODID INTEGER;
DECLARE variable DOCTYPE INTEGER;
DECLARE variable GROUPKEY INTEGER;
DECLARE variable RELDATE DATE;
BEGIN

  SELECT DOCUMENTKEY
  FROM INV_PRICE
  WHERE USR$LSF_CODE = :CODE
  INTO :PRICEID;

  SELECT ID
  FROM GD_CONTACT
  WHERE USR$LSF_CODE = :CONTACTCODE
  INTO :CONID;

  SELECT DOCUMENTKEY
  FROM USR$INV_CONTRACT
  WHERE USR$LSF_CODE = :CONTRACTCODE
  INTO :CONTRID;

  SELECT ID
  FROM GD_GOOD
  WHERE USR$LSF_CODE = :GOODCODE
  INTO :GOODID;

  select p.id
  from gd_p_getid(147005904, 63934951) p
  into :GROUPKEY;

  /*RELDATE = :DATEEND;
  IF (RELDATE IS NULL) THEN
  BEGIN
  RELDATE = :DATEBEGIN;
  END*/

  IF (GOODID IS NULL) THEN
  BEGIN
    INSERT INTO GD_GOOD (USR$LSF_CODE, NAME, GROUPKEY, VALUEKEY, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE) VALUES (:GOODCODE, 'Неизвестный товар', :GROUPKEY, 3000001, 650002, current_timestamp, 650002, current_timestamp) RETURNING ID INTO :GOODID;
  END

  select p.id
  from gd_p_getid(151269263, 623967871) p
  into :DOCTYPE;

  IF (PRICEID IS NULL) THEN
  BEGIN
    INSERT INTO GD_DOCUMENT (DOCUMENTTYPEKEY, PARENT, COMPANYKEY, AFULL, ACHAG, AVIEW, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE, NUMBER, DOCUMENTDATE)
    VALUES (:DOCTYPE, NULL, 650010, -1, -1, -1, 650002, current_timestamp, 650002, current_timestamp, :NUMBER, :DATEBEGIN) RETURNING ID INTO :ID;
    INSERT INTO INV_PRICE(DOCUMENTKEY, NAME, USR$LSF_CODE, USR$CONTACTKEY, USR$CONTRACTKEY, RELEVANCEDATE) VALUES (:ID, 'Прайс для розницы', :CODE, :CONID, :CONTRID, :DATEEND);
    INSERT INTO GD_DOCUMENT (DOCUMENTTYPEKEY, PARENT, COMPANYKEY, AFULL, ACHAG, AVIEW, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE, NUMBER, DOCUMENTDATE)
    VALUES (:DOCTYPE, :ID, 650010, -1, -1, -1, 650002, current_timestamp, 650002, current_timestamp, :NUMBER, :DATEBEGIN) RETURNING ID INTO :LID;
    INSERT INTO INV_PRICELINE(DOCUMENTKEY, PRICEKEY, GOODKEY, USR$INV_COSTACCNCU, USR$INV_COSTWITHNDS) VALUES (:LID, :ID, :GOODID, CAST(:PRICE AS DECIMAL(15,4)), CAST(:ENDPRICE AS DECIMAL(15,4)));
  END
  ELSE
  BEGIN
    SELECT DOCUMENTKEY
    FROM INV_PRICELINE
    WHERE pricekey = :PRICEID
    AND GOODKEY = :GOODID
    INTO :LID;

    UPDATE GD_DOCUMENT SET NUMBER = :NUMBER, DOCUMENTDATE = :DATEBEGIN, EDITIONDATE = CURRENT_TIMESTAMP WHERE ID = :PRICEID;
    UPDATE INV_PRICE SET USR$CONTACTKEY = :CONID, USR$CONTRACTKEY = :CONTRID, RELEVANCEDATE = :DATEEND WHERE DOCUMENTKEY = :PRICEID;

    IF (LID IS NULL) THEN
    BEGIN
      INSERT INTO GD_DOCUMENT (DOCUMENTTYPEKEY, PARENT, COMPANYKEY, AFULL, ACHAG, AVIEW, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE, NUMBER, DOCUMENTDATE)
      VALUES (:DOCTYPE, :PRICEID, 650010, -1, -1, -1, 650002, current_timestamp, 650002, current_timestamp, :NUMBER, :DATEBEGIN) RETURNING ID INTO :LID;
      INSERT INTO INV_PRICELINE(DOCUMENTKEY, PRICEKEY, GOODKEY, USR$INV_COSTACCNCU, USR$INV_COSTWITHNDS) VALUES (:LID, :PRICEID, :GOODID, CAST(:PRICE AS DECIMAL(15,4)), CAST(:ENDPRICE AS DECIMAL(15,4)));
    END
    ELSE
    BEGIN
      UPDATE INV_PRICELINE SET USR$INV_COSTACCNCU = CAST(:PRICE AS DECIMAL(15,4)), USR$INV_COSTWITHNDS = CAST(:ENDPRICE AS DECIMAL(15,4)) WHERE GOODKEY = :GOODID AND DOCUMENTKEY = :LID;
    END
  END
END`;

export const loadProtocol = async (data: Protocol[], attachment: Attachment, transaction: Transaction) => {
  console.log('loadProtocol', 1);
  const st = await attachment.prepare(transaction, eb);
  for (const rec of data) {
    console.log("protocol", rec);
    
    const DB = str2date(rec.datebegin);//rec.datebegin ? new Date (rec.datebegin) : new Date();
    let DE;
    if (rec.dateend) {
      DE = str2date(rec.dateend);    
    } else {
      DE = new Date(DB);
      DE.setFullYear(DE.getFullYear() + 1);
    }  
  
    await st.execute(transaction, [convertingToASCII(rec.code), convertingToASCII(rec.number), convertingToASCII(rec.contractcode),
      convertingToASCII(rec.contactcode), DB, DE, convertingToASCII(rec.goodcode), (rec.price), (rec.endprice)]);
  }
};

export const isProtocolData = (obj: any): obj is Protocol =>
  typeof obj === "object" &&
  typeof obj.code === "string" &&
  obj.code && 
  typeof obj.number === "string" &&
  obj.number &&
  typeof obj.contactcode === "string" &&
  obj.contactcode &&
  typeof obj.datebegin === "string" && 
  str2date(obj.datebegin) &&
  typeof obj.goodcode === "string" &&
  obj.goodcode &&
  typeof obj.price === "number" &&
  obj.price >= 0;


//var date  = new Date(year + 1, month, day);

