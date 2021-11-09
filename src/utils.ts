import crypto from 'crypto';
import bcrypt from 'bcrypt';

export const convertingToASCII = (s: string | undefined) =>
 s && s
.replace(/\u0142/g, "l")
.replace(/\u00DF/g, "s")
.normalize('NFKD').replace(/[\u0300-\u036f]/g, "");

const SALT_ROUND = 10;

export const getHashedPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUND);
  return bcrypt.hash(password, salt);
  };

// export const getHashedPassword = (password: string) => {
//   const sha256 = crypto.createHash('sha256');
//   const hash = sha256.update(password).digest('base64');
//   return hash;
// }


export const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}

// (s: string | undefined) => s && s.normalize('NFKD').replace(combining, '');
// const combining = /[\u0300-\u036F]/g;   "NFC" | "NFD" | "NFKC" | "NFKD"
// str.normalize('NFKD').replace(combining, '');


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

