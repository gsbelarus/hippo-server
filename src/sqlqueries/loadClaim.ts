import { Attachment } from "node-firebird-driver";
import { execPath } from "process";
import { Claim } from "../types";
import iconv from "iconv-lite";
import { convertingToASCII } from "../utils";

const eb = ` 
/* Заказы на поставку ГП */
EXECUTE BLOCK (CODE VARCHAR(50) = :CODE, NUMBER VARCHAR(50) = :NUMBER, DOCDATE DATE = :DOCDATE, ORDERDATE DATE = :ORDERDATE, STRNUMBER INTEGER = :STRINGNUMBER, GOODCODE VARCHAR(50) = :GOODCODE, QUANTITY DOUBLE PRECISION = :QUANT)
AS
DECLARE variable ID INTEGER;
BEGIN

  /* Делать перед загрузкой всего пакета
  DELETE FROM USR$FK_LSFORDERS WHERE USR$ISPROCESS <> 1;       */

  SELECT ID
  FROM GD_GOOD
  WHERE USR$LSF_CODE = :CODE
  INTO :ID;

  INSERT INTO USR$FK_LSFORDERS (EDITIONDATE, USR$NUMBER, USR$DOCUMENTDATE, USR$ORDERDATE, USR$NUMORDER, USR$LSF_GOODCODE, USR$QUANTITY) VALUES (current_timestamp, :NUMBER, :DOCDATE, :ORDERDATE, :STRNUMBER, :CODE, :QUANTITY);

END
`;

export const loadClaim = async (data: Claim[], attachment: Attachment) => {
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
          i.docdate,
          i.orderdate,
          i.stringnumber,
          i.goodcode,
          i.quant,
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
