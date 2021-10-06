import { Attachment } from "node-firebird-driver";
import { execPath } from "process";
import { Contract } from "../types";

const eb = `/* contract */
EXECUTE BLOCK (CODE VARCHAR(50) = ?, NUMBER VARCHAR(50) = :NUMBER, CONTACTCODE VARCHAR(50) = :CONTACTCODE, DATEBEGIN DATE = :DATEBEGIN, DATEEND DATE = :DATEEND)
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
    VALUES (:DOCTYPE, NULL, 650010, -1, -1, -1, 650002, current_timestamp, 650002, current_timestamp, :NUMBER, :DATEBEGIN) RETURNING ID INTO :ID;
    INSERT INTO USR$INV_CONTRACT(DOCUMENTKEY, USR$LSF_CODE, USR$CONTACTKEY, USR$DATEEND) VALUES (:ID, :CODE, :CONID, :DATEEND);
  END
  ELSE
  BEGIN
    UPDATE GD_DOCUMENT SET NUMBER = :NUMBER, DOCUMENTDATE = :DATEBEGIN WHERE ID = :ID;
    UPDATE USR$INV_CONTRACT SET USR$CONTACTKEY = :CONID, USR$DATEEND = :DATEEND WHERE DOCUMENTKEY = :ID;
  END
END
`;

export const loadContract = async (
  
  data: Contract[],
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
          i.contactcode,
          i.datebegin,
          i.dateend,
        ]);
      }
    } catch (err) {
      console.error(err);
      await tr.rollback();
    }
  } finally {
    await tr.commit();
  }
};
function contract(arg0: string, contract: any) {
  throw new Error("Function not implemented.");
}

