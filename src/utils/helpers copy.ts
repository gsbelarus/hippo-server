import crypto from 'crypto';
import bcrypt from 'bcrypt';



const temp = [];
let j = 0;
for (let i = 192; i <= 255; i++) {
  temp[j++] = i;
}

const win1251 = new Uint8Array([...temp, 168, 184, 161, 162, 178, 179, 138, 142, 154, 158, 159, 163, 175, 188, 189, 190, 191]);
// Ё, ё, Ў, ў, І, і, Š, Ž, š, ž, Ÿ, Ј, Ї, ј, Ѕ, ѕ, ї
const decoder = new TextDecoder('windows-1251');
const cyrillicLetters = decoder.decode(win1251).normalize('NFC');

console.log(cyrillicLetters);

//const cyrillicLetters = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';

export const forceWin1251 = (s: string | undefined) => {
  if (s === undefined) {
    return s;
  }

  return s.split('')
    .map( ch => {
      const c = ch.charCodeAt(0);
      console.log(ch, c, cyrillicLetters.indexOf(ch));
      return (c > 128 && cyrillicLetters.indexOf(ch) === -1) ? '_' : ch;
     })
     .join('');
};

export const convertingToASCII = (s: string | undefined) =>
 forceWin1251(s && s.trim()
  .replace(/\u0142/g, "l")
  .replace(/\u00DF/g, "s")
  .replace(/\u00C8/g, "e")
  // .replace(/Ў/g, "У")
  // .replace(/ў/g, "у")
  // .replace(/і/g, "и")
  // .replace(/й/g, "и")
  // .replace(/Й/g, "И")
  // .replace(/ё/g, "е")
  // .replace(/Ё/g, "Е")
  .replace(/[«»“”]/g, '"')
  .replace(/[®±©]/g, ' ')
  .replace("'", '"')
  .replace(/[\u0300-\u036f,\u200b]/g, "")
  .normalize('NFC'));

const SALT_ROUND = 10;

export const getHashedPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUND);
  return bcrypt.hash(password, salt);
  };

export const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}

/**
 *
 * @param convert Polish Al
 * @returns
/*export const convertPolishToASCII = (s: string | undefined) => s && s.split('')
  .map( l => upperPolishLetters[l] ?? lowerPolishLetters[l] ?? l )
  .join('');

type AlphabetMap = {
  [letter: string]: string;
};

const upperPolishLetters: AlphabetMap = {
  'A': 'A',
  'Ą': 'A',
  'B': 'B',
  'C': 'C',
  'Ć': 'C',
  'D': 'D',
  'E': 'E',
  'Ę': 'E',
  'F': 'F',
  'G': 'G',
  'H': 'H',
  'I': 'I',
  'J': 'J',
  'K': 'K',
  'L': 'L',
  'Ł': 'L',
  'M': 'M',
  'N': 'N',
  'Ń': 'N',
  'O': 'O',
  'Ó': 'O',
  'P': 'P',
  'Q': 'Q',
  'R': 'R',
  'S': 'S',
  'Ś': 'S',
  'T': 'T',
  'U': 'U',
  'V': 'V',
  'W': 'W',
  'X': 'X',
  'Y': 'Y',
  'Z': 'Z',
  'Ź': 'Z',
  'Ż': 'Z'
};

const lowerPolishLetters: AlphabetMap = {
  'a': 'a',
  'ą': 'a',
  'b': 'b',
  'c': 'c',
  'ć': 'c',
  'd': 'd',
  'e': 'e',
  'ę': 'e',
  'f': 'f',
  'g': 'g',
  'h': 'h',
  'i': 'i',
  'j': 'j',
  'k': 'k',
  'l': 'l',
  'ł': 'l',
  'm': 'm',
  'n': 'n',
  'ń': 'n',
  'o': 'o',
  'ó': 'o',
  'p': 'p',
  'q': 'q',
  'r': 'r',
  's': 's',
  'ś': 's',
  't': 't',
  'u': 'u',
  'v': 'v',
  'w': 'w',
  'x': 'x',
  'y': 'y',
  'z': 'z',
  'ź': 'z',
  'ż': 'z'
};*/

/**
 * Мы договорились в спецификации с клиентом, что даты в строковом виде
 * будут передаваться строго в формате YYYY/MM/DD. При этом, год передается
 * всегда строго четырьмя цифрами, а месяц и день могут передаваться одной
 * или двумя цифрами, с лидирующим нулем или без.
 * Функция вызовет исключение, если дата не соответствует нужному формату
 * или вернет объект типа Date, сконвертированный из переданной строки.
 * @param s Дата в строковом формате.
 */
export const str2date = (s: string) => {
  let splitted = s.split('-');

  if (splitted.length === 3) {
    const arr = splitted.map( d => parseFloat(d) ).filter( d => !isNaN(d) && d > 0 && d === Math.floor(d) );

    if (arr.length === 3 && arr[0] >= 2000 && arr[0] < 2200 && arr[1] >= 1 && arr[1] <= 12 && arr[2] >= 1 && arr[2] <= 31) {
      const d = new Date(arr[0], arr[1] - 1, arr[2]);

      if (d instanceof Date && !isNaN(d.getTime())) {
        return d;
      }
    }
  }
  throw new Error(`Invalid date string ${s}`);
};

// export const isValidItem = (itemObj: any, validator: (obj: any) => boolean) => {
//   if (!validator(itemObj)) {
//     throw new Error(`Неверный формат данных ${JSON.stringify(itemObj)}`);
//   }
// }
