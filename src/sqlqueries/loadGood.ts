import { Attachment, Transaction } from "node-firebird-driver";
import { Good } from "../types";

const eb = `/* товары */
  EXECUTE BLOCK (
      CODE VARCHAR(50) = ?
    , RATE DINTEGER = ? 
    , NAME VARCHAR(255) = ? 
    , WEIGHT DOUBLE PRECISION = ?
    , DISABLED DINTEGER = ?
    , BARCODE VARCHAR(15) = ?
    , VALUECODE VARCHAR(50) = ?
    , GROUPCODE VARCHAR(50) = ?
    , MOQ DOUBLE PRECISION = ?)
  AS
  DECLARE variable ID INTEGER;
  DECLARE variable VALUEID INTEGER;
  DECLARE variable PARENT INTEGER;
  DECLARE variable TAXKEY INTEGER;
  DECLARE variable DESCR VARCHAR(50);

  BEGIN

    SELECT ID
    FROM GD_GOODGROUP
    WHERE USR$LSF_CODE = :GROUPCODE
    INTO :PARENT;

    SELECT ID
    FROM GD_GOOD
    WHERE USR$LSF_CODE = :CODE
    INTO :ID;

    SELECT ID
    FROM GD_VALUE
    WHERE USR$LSF_CODE = :VALUECODE
    INTO :VALUEID;

    select p.id
    from gd_p_getid(147065078, 486813904) p
    into :TAXKEY;

    IF (PARENT IS NULL) THEN
    BEGIN
      PARENT = 147027095;
      DESCR = GROUPCODE;
    END  

    IF (ID IS NULL) THEN
    BEGIN
      INSERT INTO GD_GOOD (USR$LSF_CODE, NAME, USR$FULLNAME, GROUPKEY, VALUEKEY, BARCODE, USR$INV_WEIGHT, USR$MOQ, DISABLED, DESCRIPTION) 
        VALUES (:CODE, LEFT(:NAME, 60), LEFT(:NAME, 180), :PARENT, :VALUEID, :BARCODE, CAST(:WEIGHT AS DECIMAL(15,4)), CAST(:MOQ AS DECIMAL(15,4)), :DISABLED, :DESCR) RETURNING ID INTO :ID;
      INSERT INTO gd_goodtax (GOODKEY, TAXKEY, DATETAX, RATE) 
        VALUES (:ID, :TAXKEY, CAST('NOW' as date), :RATE);
    END
    ELSE
    BEGIN
      UPDATE GD_GOOD SET 
        NAME = LEFT(:NAME, 60), 
        USR$FULLNAME = LEFT(:NAME, 180), 
        GROUPKEY = :PARENT, 
        VALUEKEY = :VALUEID, 
        BARCODE = :BARCODE, 
        USR$INV_WEIGHT = CAST(:WEIGHT AS DECIMAL(15,4)), 
        USR$MOQ = CAST(:MOQ AS DECIMAL(15,4)), 
        DISABLED = :DISABLED,
        DESCRIPTION = :DESCR,
        EDITIONDATE = CAST('NOW' as date) 
        WHERE ID = :ID;
       
      UPDATE gd_goodtax SET RATE = :RATE WHERE GOODKEY = :ID and TAXKEY = :TAXKEY;
    END
  END`;


export const loadGood = async (data: Good[], attachment: Attachment, transaction: Transaction) => {
  const st = await attachment.prepare(transaction, eb);
  for (const rec of data) {
    await st.execute(transaction, [rec.code, rec.rate, rec.name, rec.weight,
      rec.disabled, rec.barcode, rec.valuecode, rec.groupcode, rec.moq]);
  }
};


  