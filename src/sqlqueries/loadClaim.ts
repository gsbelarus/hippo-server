import { Attachment, Transaction } from "node-firebird-driver";
import { Claim } from "../types";



const eb = ` 
/* Заказы на поставку ГП */
EXECUTE BLOCK (CODE VARCHAR(50) = ?, NUMBER VARCHAR(50) = ?, DOCDATE DATE = ?, ORDERDATE DATE = ?, STRNUMBER INTEGER = ?, GOODCODE VARCHAR(50) = ?, QUANTITY DOUBLE PRECISION = ?)
AS
DECLARE variable ID INTEGER;
BEGIN

  /* Делать перед загрузкой всего пакета
  DELETE FROM USR$FK_LSFORDERS WHERE USR$ISPROCESS <> 1;       */

  SELECT ID
  FROM GD_GOOD
  WHERE USR$LSF_CODE = :CODE
  INTO :ID;

  INSERT INTO USR$FK_LSFORDERS (EDITIONDATE, USR$NUMBER, USR$DOCUMENTDATE, USR$ORDERDATE, USR$NUMORDER, USR$LSF_GOODCODE, USR$QUANTITY) VALUES (current_timestamp, :NUMBER, :DOCDATE, :ORDERDATE, :STRNUMBER, :GOODCODE, :QUANTITY);

END
`;

export const loadClaim = async (data: Claim[], attachment: Attachment, transaction: Transaction) => {
 
const st = await attachment.prepare(transaction, eb);
  for (const rec of data) {
    console.log(rec);
    await st.execute(transaction, 
      [rec.number, rec.number, rec.docdate ? new Date(rec.docdate) : new Date(), 
        new Date(rec.orderdate), rec.stringnumber, rec.goodcode, rec.quant]);
  }
};

