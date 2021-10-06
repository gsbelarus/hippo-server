import { Attachment } from "node-firebird-driver";
import { execPath } from "process";
import { Goodgroup } from "../types";

const eb = ` /* товарные группы */
    EXECUTE BLOCK (CODE VARCHAR(50) = ?, NAME VARCHAR(80) = ?, PARENTCODE VARCHAR(50) = ?)
    AS
    DECLARE variable ID INTEGER;
    DECLARE variable PARENT INTEGER;
    
    BEGIN
    
      IF (PARENTCODE IS NULL) THEN
      BEGIN
        select p.id
        from gd_p_getid(147005904, 63934951) p
        into :PARENT;
      END
      ELSE
      BEGIN
        SELECT ID
        FROM GD_GOODGROUP
        WHERE USR$LSF_CODE = :PARENTCODE
        INTO :PARENT;
      END
    
      SELECT ID
      FROM GD_GOODGROUP
      WHERE USR$LSF_CODE = :CODE
      INTO :ID;
    
     /* SELECT ID
      FROM GD_CONTACT
      WHERE USR$LSF_CODE = :DEPOTCODE
      INTO :DEPID; */
    
      IF (ID IS NULL) THEN
      BEGIN
        INSERT INTO GD_GOODGROUP (USR$LSF_CODE, NAME, PARENT) VALUES (:CODE, :NAME, :PARENT);
      END
      ELSE
      BEGIN
        UPDATE GD_GOODGROUP SET NAME = :NAME, PARENT = :PARENT WHERE ID = :ID;
      END
    END`;
export async function loadGoodgroup(data: Goodgroup[], attachment: Attachment) {
  const tr = await attachment.startTransaction();
  try {
    try {
      console.log('1');
      const st = await attachment.prepare(tr, eb);
      console.log('2');
      for (const i of data) {
        await st.execute(tr, [i.code, i.name, i.parentcode]);
        console.log('item', i);
      }
    } catch (err) {
      console.log('err');
      console.error(err);
      await tr.rollback();
    }
  } finally {
    console.log('3');
    await tr.commit();
  }
}
