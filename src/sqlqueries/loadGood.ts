import { Good } from "../types";

export const loadGood = async (data: Good [], attachment: any) => {
	const transaction = await attachment.startTransaction();
		
	const statement1 = await attachment.prepare(transaction, ` /* товары */
  EXECUTE BLOCK (
    CODE VARCHAR(50) = :CODE
    , RATE DINTEGER = :RATE
    , NAME VARCHAR(180) = :NAME
    , WEIGHT DOUBLE PRECISION = :WEIGHT
    , DISABLED DINTEGER = :DISABLED
    , BARCODE VARCHAR(15) = :BARCODE
    , VALUECODE VARCHAR(50) = :VALUECODE
    , GROUPCODE VARCHAR(50) = :GROUPCODE
    , MOQ DOUBLE PRECISION = :MOQ)
  AS
  DECLARE variable ID INTEGER;
  DECLARE variable VALUEID INTEGER;
  DECLARE variable PARENT INTEGER;
  DECLARE variable TAXKEY INTEGER;
  
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
  
    IF (ID IS NULL) THEN
    BEGIN
      INSERT INTO GD_GOOD (USR$LSF_CODE, NAME, USR$FULLNAME, GROUPKEY, VALUEKEY, BARCODE, USR$INV_WEIGHT, USR$MOQ, DISABLED) VALUES (:CODE, LEFT(:NAME, 60), LEFT(:NAME, 180), :PARENT, :VALUEID, :BARCODE, CAST(:WEIGHT AS DECIMAL(15,4)), CAST(:MOQ AS DECIMAL(15,4)), :DISABLED) RETURNING ID INTO :ID;
      INSERT INTO gd_goodtax (GOODKEY, TAXKEY, DATETAX, RATE) VALUES (:ID, :TAXKEY, CAST('NOW' as date), :RATE);
    END
    ELSE
    BEGIN
      UPDATE GD_GOOD SET NAME = LEFT(:NAME, 60), USR$FULLNAME = LEFT(:NAME, 180), GROUPKEY = :PARENT, VALUEKEY = :VALUEID, BARCODE = :BARCODE, USR$INV_WEIGHT = CAST(:WEIGHT AS DECIMAL(15,4)), USR$MOQ = CAST(:MOQ AS DECIMAL(15,4)), DISABLED = :DISABLED WHERE ID = :ID;
      UPDATE gd_goodtax SET RATE = :RATE WHERE GOODKEY = :ID and TAXKEY = :TAXKEY;
    END
  END)`);

    for (const item of data) {
			// console.log("item=", item.name);
			const params = [
        item.code,
        item.rate,
        item.name,
        item.weight || 0,
        item.disabled || 0,
        item.barcode || '',
        item.valuecode || '',
        item.groupcode || '',
        item.moq || 0
				];

        await statement1.execute(transaction, params);
		}			

	await transaction.commit();
}