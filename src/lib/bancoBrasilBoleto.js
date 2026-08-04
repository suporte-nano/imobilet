const BANK_CODE_BB = '001';
const CURRENCY_REAL = '9';
const RESET_FACTOR_DATE = '2025-02-22';
const ORIGINAL_FACTOR_BASE_DATE = '1997-10-07';

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

const padLeft = (value, length) => {
  const digits = onlyDigits(value);
  if (digits.length > length) {
    throw new Error(`Valor numerico excede ${length} posicoes.`);
  }
  return digits.padStart(length, '0');
};

const toDateAtNoon = (value) => {
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Data invalida.');
  }
  return date;
};

const daysBetween = (start, end) => {
  const startDate = toDateAtNoon(start);
  const endDate = toDateAtNoon(end);
  return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
};

export const modulo10 = (digits) => {
  const sequence = onlyDigits(digits);
  let sum = 0;
  let weight = 2;

  for (let index = sequence.length - 1; index >= 0; index -= 1) {
    const product = Number(sequence[index]) * weight;
    sum += product > 9 ? Math.floor(product / 10) + (product % 10) : product;
    weight = weight === 2 ? 1 : 2;
  }

  const result = 10 - (sum % 10);
  return result === 10 ? 0 : result;
};

export const modulo11Barcode = (barcodeWithoutDv) => {
  const sequence = onlyDigits(barcodeWithoutDv);
  if (sequence.length !== 43) {
    throw new Error('O DV do codigo de barras exige 43 posicoes.');
  }

  let sum = 0;
  let weight = 2;

  for (let index = sequence.length - 1; index >= 0; index -= 1) {
    sum += Number(sequence[index]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const digit = 11 - (sum % 11);
  return [0, 10, 11].includes(digit) ? 1 : digit;
};

export const modulo11NossoNumero = (digits) => {
  const sequence = onlyDigits(digits);
  let sum = 0;
  let weight = 9;

  for (let index = sequence.length - 1; index >= 0; index -= 1) {
    sum += Number(sequence[index]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  const remainder = sum % 11;
  if (remainder === 10) return 'X';
  return String(remainder);
};

export const calculateDueDateFactor = (dueDate) => {
  const date = toDateAtNoon(dueDate);
  const resetDate = toDateAtNoon(RESET_FACTOR_DATE);

  if (date >= resetDate) {
    return padLeft(1000 + daysBetween(resetDate, date), 4);
  }

  return padLeft(daysBetween(ORIGINAL_FACTOR_BASE_DATE, date), 4);
};

export const formatAmountForBarcode = (amount) => {
  const cents = Math.round((Number(amount) || 0) * 100);
  if (cents < 0) throw new Error('Valor do boleto nao pode ser negativo.');
  return padLeft(cents, 10);
};

export const buildNossoNumero = ({ convenio, sequencial }) => {
  const agreement = onlyDigits(convenio);
  if (![4, 6, 7].includes(agreement.length)) {
    throw new Error('Convenio BB deve ter 4, 6 ou 7 posicoes.');
  }

  if (agreement.length === 4) {
    const base = `${agreement}${padLeft(sequencial, 7)}`;
    return { base, formatted: `${base}-${modulo11NossoNumero(base)}` };
  }

  if (agreement.length === 6) {
    const base = `${agreement}${padLeft(sequencial, 5)}`;
    return { base, formatted: `${base}-${modulo11NossoNumero(base)}` };
  }

  const base = `${agreement}${padLeft(sequencial, 10)}`;
  return { base, formatted: base };
};

export const buildCampoLivreBancoBrasil = ({
  convenio,
  sequencial,
  agencia,
  conta,
  carteira,
  modalidade = 'registered',
}) => {
  const agreement = onlyDigits(convenio);
  const wallet = padLeft(carteira, 2);

  if (modalidade === 'free_17_no_registration') {
    if (agreement.length !== 6) {
      throw new Error('Nosso numero livre de 17 posicoes exige convenio de 6 posicoes.');
    }
    return `${agreement}${padLeft(sequencial, 17)}21`;
  }

  const nossoNumero = buildNossoNumero({ convenio: agreement, sequencial }).base;

  if (agreement.length === 7) {
    return `${'0'.repeat(6)}${nossoNumero}${wallet}`;
  }

  return `${nossoNumero}${padLeft(agencia, 4)}${padLeft(conta, 8)}${wallet}`;
};

export const buildBancoBrasilBarcode = ({
  convenio,
  sequencial,
  agencia,
  conta,
  carteira,
  dueDate,
  amount,
  modalidade = 'registered',
}) => {
  const campoLivre = buildCampoLivreBancoBrasil({
    convenio,
    sequencial,
    agencia,
    conta,
    carteira,
    modalidade,
  });

  if (campoLivre.length !== 25) {
    throw new Error('Campo livre do codigo de barras deve ter 25 posicoes.');
  }

  const withoutDv = [
    BANK_CODE_BB,
    CURRENCY_REAL,
    calculateDueDateFactor(dueDate),
    formatAmountForBarcode(amount),
    campoLivre,
  ].join('');

  const dv = modulo11Barcode(withoutDv);
  return `${withoutDv.slice(0, 4)}${dv}${withoutDv.slice(4)}`;
};

const formatLinhaDigitavelField = (fieldWithDv) => `${fieldWithDv.slice(0, 5)}.${fieldWithDv.slice(5)}`;

export const buildLinhaDigitavel = (barcode) => {
  const code = onlyDigits(barcode);
  if (code.length !== 44) {
    throw new Error('Codigo de barras deve ter 44 posicoes.');
  }

  const field1 = `${code.slice(0, 4)}${code.slice(19, 24)}`;
  const field2 = code.slice(24, 34);
  const field3 = code.slice(34, 44);
  const field4 = code.slice(4, 5);
  const field5 = code.slice(5, 19);

  return [
    formatLinhaDigitavelField(`${field1}${modulo10(field1)}`),
    formatLinhaDigitavelField(`${field2}${modulo10(field2)}`),
    formatLinhaDigitavelField(`${field3}${modulo10(field3)}`),
    field4,
    field5,
  ].join(' ');
};

export const buildBancoBrasilBoletoIdentifiers = (params) => {
  const barcode = buildBancoBrasilBarcode(params);
  return {
    barcode,
    linhaDigitavel: buildLinhaDigitavel(barcode),
    nossoNumero: buildNossoNumero(params).formatted,
    dueDateFactor: calculateDueDateFactor(params.dueDate),
  };
};
