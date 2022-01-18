import { Attachment, Transaction } from "node-firebird-driver";
import { Contact } from "../types";
import { convertingToASCII } from "../utils/helpers";

const eb = ` EXECUTE BLOCK (CODE VARCHAR(50) = ?, NAME VARCHAR(200) = ?, ADDRESS VARCHAR(180) = ?, PHONE VARCHAR(80) = ?, EMAIL VARCHAR(400) = ?, GLN VARCHAR(13) = ?, TAXID VARCHAR(9) = ?)
  AS
  DECLARE variable ID INTEGER;
  DECLARE variable PARENT INTEGER;
  DECLARE variable SHORTNAME VARCHAR(60);
  BEGIN

    SHORTNAME = LEFT(:NAME, 60);

    SELECT ID
    FROM GD_CONTACT
    WHERE USR$LSF_CODE = :CODE
    INTO :ID;

    select p.id
    from gd_p_getid(147002208, 31587988) p
    into :PARENT;

    IF (ID IS NULL) THEN
    BEGIN
      SELECT
      GEN_ID(gd_g_unique, 1) + GEN_ID(gd_g_offset, 0) AS NewID
      FROM RDB$DATABASE
      INTO :ID;
      INSERT INTO gd_contact (ID, CONTACTTYPE, PARENT, USR$LSF_CODE, NAME, ADDRESS, PHONE, EMAIL, USR$ETTN_GLN) VALUES (:ID, 3, :PARENT, :CODE, :SHORTNAME, :ADDRESS, :PHONE, :EMAIL, :GLN);
      INSERT INTO GD_COMPANY (CONTACTKEY, FULLNAME) VALUES (:ID, :NAME);
      INSERT INTO GD_COMPANYCODE (COMPANYKEY, TAXID) VALUES (:ID, :TAXID);
    END
    ELSE
    BEGIN
      UPDATE gd_contact SET NAME = :SHORTNAME, ADDRESS = :ADDRESS, PHONE = :PHONE, EMAIL =  :EMAIL, USR$ETTN_GLN = :GLN, EDITIONDATE = CURRENT_TIMESTAMP WHERE ID = :ID;
      UPDATE GD_COMPANY SET FULLNAME = :NAME WHERE CONTACTKEY = :ID;
      UPDATE GD_COMPANYCODE SET TAXID = :TAXID WHERE COMPANYKEY = :ID;
    END
  END`;

  export const loadContact = async (data: Contact[], attachment: Attachment, transaction: Transaction) => {
    console.log('loadContact', 111);
    const st = await attachment.prepare(transaction, eb);
    for (const rec of data) {
      console.log("contact", rec);
      await st.execute(transaction, [rec.code, convertingToASCII(rec.name), convertingToASCII(rec.address), rec.phone, convertingToASCII(rec.email), rec.gln, rec.taxid]);
    }
  };

  export const isContactData = (obj: any): obj is Contact =>
  typeof obj === "object" &&
  typeof obj.code === "string" &&
  obj.code &&
  typeof obj.name === "string" &&
  obj.name &&
  typeof obj.taxid === "string" &&
  obj.taxid;

  

