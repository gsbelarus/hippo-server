import { Goodgroup } from "../types";

export const loadGoodgroup = async (data: Goodgroup[], attachment: any) => {
	const transaction = await attachment.startTransaction();
		
	const statement1 = await attachment.prepare(transaction, ` /* товарные группы */
    EXECUTE BLOCK (CODE VARCHAR(50) = :CODE, NAME VARCHAR(80) = :NAME, PARENTCODE VARCHAR(50) = :PARENTCODE)
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
    END`);

    for (const item of data) {
			// console.log("item=", item.name);
			const params = [
        item.code,
        item.name,
        item.parentcode,
				];

			await statement1.execute(transaction, params);
		}			

	await transaction.commit();
}

