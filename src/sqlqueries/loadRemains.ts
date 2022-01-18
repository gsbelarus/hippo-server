import { Attachment, Transaction } from "node-firebird-driver";
import { Remains } from "../types";
import { str2date } from "../utils/helpers";

const eb = `/* остатки ГП */
EXECUTE BLOCK (CODE VARCHAR(50) = ?, QUANTITY DOUBLE PRECISION = ?, REMAINSDATE DATE = ?, MAKEDATE DATE = ?, MAKETIME VARCHAR(50) = ?)
AS
DECLARE variable ID INTEGER;
BEGIN

  /* Делать перед загрузкой всего пакета
  DELETE FROM USR$FK_COOKGROUP_REMAINS WHERE USR$REMAINSDATE = :REMAINSDATE;       */

  SELECT ID
  FROM GD_GOOD
  WHERE USR$LSF_CODE = :CODE
  INTO :ID;

  INSERT INTO USR$FK_COOKGROUP_REMAINS (EDITIONDATE, USR$LSF_GOODCODE, USR$GOODKEY, USR$QUANTITY, USR$REMAINSDATE, USR$DATEMAKING, USR$TIMEMAKING) VALUES (current_timestamp, :CODE, :ID, :QUANTITY, :REMAINSDATE, CAST(:MAKEDATE AS DATE), CAST(:MAKETIME AS TIME));

END
`;

export const loadRemains = async (data: Remains[], attachment: Attachment, transaction: Transaction) => {
  const st = await attachment.prepare(transaction, eb);
  for (const rec of data) {
    await st.execute(transaction, [rec.code, rec.quant,
    str2date(rec.remainsdate), rec.makedate ? str2date(rec.makedate) : null,
    rec.maketime]);
  }
};

export const isRemainsData = (obj: any): obj is Remains =>
  typeof obj === "object" &&
  typeof obj.code === "string" &&
  obj.code &&
  typeof obj.remainsdate === "string" &&
  str2date(obj.remainsdate)
  && typeof obj.quant === "number" &&
  obj.quant >= 0;
  