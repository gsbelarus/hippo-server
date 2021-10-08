import { Attachment } from "node-firebird-driver";
import { Protocol } from "../types";
//import { execPath } from "process";

const eb = `/* protocol*/
EXECUTE BLOCK (CODE VARCHAR(50) = ?, NUMBER VARCHAR(50) = ?, CONTRACTCODE VARCHAR(50) = ?, CONTACTCODE VARCHAR(50) = ?, DATEBEGIN DATE = ?, DATEEND DATE = ?, GOODCODE VARCHAR(50) = ?, PRICE DOUBLE PRECISION = ?, ENDPRICE DOUBLE PRECISION = ?)
AS
DECLARE variable ID INTEGER;
DECLARE variable LID INTEGER;
DECLARE variable CONID INTEGER;
DECLARE variable CONTRID INTEGER;
DECLARE variable GOODID INTEGER;
DECLARE variable DOCTYPE INTEGER;
DECLARE variable GROUPKEY INTEGER;
BEGIN

  SELECT DOCUMENTKEY
  FROM INV_PRICE
  WHERE USR$LSF_CODE = :CODE
  INTO :ID;

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
  
  IF (GOODID IS NULL) THEN
  BEGIN
    INSERT INTO GD_GOOD (USR$LSF_CODE, NAME, GROUPKEY, VALUEKEY, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE) VALUES (:GOODCODE, 'Неизвестный товар', :GROUPKEY, 3000001, 650002, current_timestamp, 650002, current_timestamp) RETURNING ID INTO :GOODID;
  END
  
  select p.id
  from gd_p_getid(151269263, 623967871) p
  into :DOCTYPE;
  
  SELECT
  GEN_ID(gd_g_unique, 1) + GEN_ID(gd_g_offset, 0) AS NewID
  FROM RDB$DATABASE
  INTO :LID;

  IF (ID IS NULL) THEN
  BEGIN
    INSERT INTO GD_DOCUMENT (DOCUMENTTYPEKEY, PARENT, COMPANYKEY, AFULL, ACHAG, AVIEW, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE, NUMBER, DOCUMENTDATE)
    VALUES (:DOCTYPE, NULL, 650010, -1, -1, -1, 650002, current_timestamp, 650002, current_timestamp, :NUMBER, :DATEBEGIN) RETURNING ID INTO :ID;
    INSERT INTO INV_PRICE(DOCUMENTKEY, USR$LSF_CODE, USR$CONTACTKEY, USR$CONTRACTKEY, RELEVANCEDATE) VALUES (:ID, :CODE, :CONID, :CONTRID, :DATEEND);
    INSERT INTO GD_DOCUMENT (DOCUMENTTYPEKEY, PARENT, COMPANYKEY, AFULL, ACHAG, AVIEW, CREATORKEY, CREATIONDATE, EDITORKEY, EDITIONDATE, NUMBER, DOCUMENTDATE)
    VALUES (:DOCTYPE, :ID, 650010, -1, -1, -1, 650002, current_timestamp, 650002, current_timestamp, :NUMBER, :DATEBEGIN) RETURNING ID INTO :LID;
    INSERT INTO INV_PRICELINE(DOCUMENTKEY, GOODKEY, USR$INV_COSTACCNCU, USR$INV_COSTWITHNDS) VALUES (:LID, :GOODID, CAST(:PRICE AS DECIMAL(15,4)), CAST(:ENDPRICE AS DECIMAL(15,4)));
  END
  ELSE
  BEGIN
    UPDATE GD_DOCUMENT SET NUMBER = :NUMBER, DOCUMENTDATE = :DATEBEGIN WHERE ID = :ID;
    UPDATE INV_PRICE SET USR$CONTACTKEY = :CONID, USR$CONTRACTKEY = :CONTRID, RELEVANCEDATE = :DATEEND WHERE DOCUMENTKEY = :ID;
    UPDATE OR INSERT INTO INV_PRICELINE (GOODKEY, USR$INV_COSTACCNCU, USR$INV_COSTWITHNDS) VALUES(:GOODID, CAST(:PRICE AS DECIMAL(15,4)), CAST(:ENDPRICE AS DECIMAL(15,4))) MATCHING(GOODKEY);
  END
END`;

export const loadProtocol = async (
  data: Protocol[],
  attachment: Attachment
) => {
  const tr = await attachment.startTransaction();
  try {
    try {
      console.log('1');
      const st = await attachment.prepare(tr, eb);
      console.log('2');
      for (const i of data) {
        await st.execute(tr, [
          i.code,
          i.number,
          i.contractcode,
          i.contactcode, 
          i.datebegin,
          i.dateend,
          i.goodcode,
          new Date(i.price),
          new Date(i.endprice),
        ]);
        console.log('item2',  i);
      }
    } catch (err) {
      console.error(err);
      await tr.rollback();
    }
  } finally {
    await tr.commit();
  }
};
