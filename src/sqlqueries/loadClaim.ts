import { Attachment, Transaction } from "node-firebird-driver";
import { Claim } from "../types";
import { str2date } from "../utils/helpers";

const eb = `
/* Заказы на поставку ГП */
EXECUTE BLOCK (NUMBER VARCHAR(50) = ?, DOCDATE DATE = ?, ORDERDATE DATE = ?, STRNUMBER INTEGER = ?, GOODCODE VARCHAR(50) = ?, QUANTITY DOUBLE PRECISION = ?)
AS
BEGIN

  /* Делать перед загрузкой всего пакета
  DELETE FROM USR$FK_LSFORDERS WHERE USR$ISPROCESS <> 1;       */

  INSERT INTO USR$FK_LSFORDERS (EDITIONDATE, USR$NUMBER, USR$DOCUMENTDATE, USR$ORDERDATE, USR$NUMORDER, USR$LSF_GOODCODE, USR$QUANTITY) VALUES (current_timestamp, :NUMBER, :DOCDATE, :ORDERDATE, :STRNUMBER, :GOODCODE, :QUANTITY);

END
`;

export const loadClaim = async (data: Claim[], attachment: Attachment, transaction: Transaction) => {

  for (const rec of data) {
    if (rec.quant && typeof rec.quant !== 'number') {
      throw new Error(`Неверный формат данных ${JSON.stringify(rec)}. Тип свойства quant должен быть числовым!`);
    }
  }

  const st = await attachment.prepare(transaction, eb);
  for (const rec of data) {
    await st.execute(transaction,
      [rec.number, str2date(rec.docdate),
      str2date(rec.orderdate), rec.stringnumber, rec.goodcode, rec.quant || 0]);
  }
};

export const isClaimData = (obj: any): obj is Claim =>
  typeof obj === "object" &&
  typeof obj.number === "string" &&
  obj.number
  && typeof obj.docdate === "string" &&
  str2date(obj.docdate) &&
  typeof obj.orderdate === "string" &&
  str2date(obj.orderdate) &&
  typeof obj.stringnumber === "number" &&
  obj.stringnumber &&
  typeof obj.goodcode === "string" &&
  obj.goodcode;

