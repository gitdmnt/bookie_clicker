const normalizeIsbn = (input: string): string =>
  input.replace(/[-\s]/g, "").toUpperCase();

const validateIsbn10 = (isbn10: string): void => {
  if (isbn10.length !== 10) {
    throw new Error("invalid length");
  }

  let sum = 0;
  for (let i = 0; i < isbn10.length; i += 1) {
    const c = isbn10[i];
    const digit =
      c === "X" && i === 9 ? 10 : c >= "0" && c <= "9" ? Number(c) : null;

    if (digit === null) {
      throw new Error("invalid character in ISBN-10");
    }

    sum += digit * (10 - i);
  }

  if (sum % 11 !== 0) {
    throw new Error("invalid ISBN-10 checksum");
  }
};

const validateIsbn13 = (isbn13: string): void => {
  if (isbn13.length !== 13 || !/^[0-9]+$/.test(isbn13)) {
    throw new Error("invalid length or non-digit characters");
  }

  let sum = 0;
  for (let i = 0; i < isbn13.length; i += 1) {
    const digit = Number(isbn13[i]);
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }

  if (sum % 10 !== 0) {
    throw new Error("invalid ISBN-13 checksum");
  }
};

const calculateIsbn13CheckDigit = (isbn12: string): number => {
  let sum = 0;
  for (let i = 0; i < isbn12.length; i += 1) {
    const digit = Number(isbn12[i]);
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }
  return (10 - (sum % 10)) % 10;
};

const convertIsbn10ToIsbn13 = (isbn10: string): number => {
  const body = isbn10.slice(0, 9);
  if (!/^[0-9]{9}$/.test(body)) {
    throw new Error("invalid ISBN-10 format");
  }

  const isbn12 = `978${body}`;
  const checksum = calculateIsbn13CheckDigit(isbn12);
  return Number(`${isbn12}${checksum}`);
};

/**
 * ISBN文字列をバリデーションし、ISBN-13 の number を返す
 * ISBN-10 / ISBN-13 に対応
 */
export const parseIsbn = (input: string): number | null => {
  const isbn = normalizeIsbn(input);

  if (isbn.length === 10) {
    validateIsbn10(isbn);
    return convertIsbn10ToIsbn13(isbn);
  }

  if (isbn.length === 13) {
    validateIsbn13(isbn);
    return Number(isbn);
  }

  return null;
};
