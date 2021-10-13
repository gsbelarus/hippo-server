import { Attachment, Transaction } from "node-firebird-driver";
import { execPath } from "process";
import { Value } from "../types";

const eb = `/* единицы измерения */
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
END`;

export const loadValue = async (data: Value[], attachment: Attachment, transaction: Transaction) => {
  const st = await attachment.prepare(transaction, eb);
  for (const rec of data) {
    await st.execute(transaction, [rec.code, rec.name, rec.shortName]);
  }
};
