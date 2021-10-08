import { Attachment } from "node-firebird-driver";
import { execPath } from "process";
import { Contact } from "../types";
import iconv from "iconv-lite";
import { convertingToASCII } from "../utils";

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
      UPDATE gd_contact SET NAME = :NAME, ADDRESS = :ADDRESS, PHONE = :PHONE, EMAIL = :EMAIL, USR$ETTN_GLN = :GLN WHERE ID = :ID;
      UPDATE GD_COMPANY SET FULLNAME = :NAME WHERE CONTACTKEY = :ID;
      UPDATE GD_COMPANYCODE SET TAXID = :TAXID WHERE COMPANYKEY = :ID;
    END
  END`;

export const loadContact = async (data: Contact[], attachment: Attachment) => {
  const tr = await attachment.startTransaction();
  try {
    try {
      console.log('1');
      const st = await attachment.prepare(tr, eb);
      console.log('2');
      for (const i of data) {
        await st.execute(tr, [
          i.code,
          convertingToASCII(i.name),
          convertingToASCII(i.address || ''),
          i.phone,
          convertingToASCII(i.email || ''),
          i.gln,
          i.taxid,
        ]);
        console.log('item2',  i)
      }
    } catch (err) {
      console.error(err);
      await tr.rollback();
    }
  } finally {
    await tr.commit();
  }
};
