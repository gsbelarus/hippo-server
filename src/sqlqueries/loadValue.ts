import { Value } from "../types";

export const loadValue = async (data: Value[], attachment: any) => {
	const transaction = await attachment.startTransaction();
		
	const statement1 = await attachment.prepare(transaction,  `/* единицы измерения */
		EXECUTE BLOCK (CODE VARCHAR(50) = ?, NAME VARCHAR(50) = ?, SHORTNAME VARCHAR(50) = ?)
		AS
		DECLARE variable ID INTEGER;
		DECLARE variable VALUENAME VARCHAR(50);
		BEGIN
		
			SELECT ID
			FROM GD_VALUE
			WHERE USR$LSF_CODE = :CODE
			INTO :ID;
			
			VALUENAME = :SHORTNAME;
			
			IF (SHORTNAME IS NULL) THEN
			BEGIN
				VALUENAME = :NAME;
			END
		
			IF (ID IS NULL) THEN
			BEGIN
				INSERT INTO GD_VALUE (USR$LSF_CODE, NAME, DESCRIPTION) VALUES (:CODE, :SHORTNAME, :NAME);
			END
			ELSE
			BEGIN
				UPDATE GD_VALUE SET NAME = :SHORTNAME, DESCRIPTION = :NAME WHERE ID = :ID;
			END
		END`);

		for (const item of data) {
			// console.log("item=", item.name);
			const params = [
				item.code,
				item.name,
				item.shortName,
				];

				await statement1.execute(transaction, params);
			}			
	
		await transaction.commit();
	}

