import {
  buildBancoBrasilBoletoIdentifiers,
  buildLinhaDigitavel,
  calculateDueDateFactor,
  modulo11Barcode,
} from '../src/lib/bancoBrasilBoleto.js';

const assertEqual = (actual, expected, label) => {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${expected}, recebido ${actual}`);
  }
};

const sampleBarcode = '00193373700000001000500940144816060680935031';
const sampleBarcodeWithoutDv = `${sampleBarcode.slice(0, 4)}${sampleBarcode.slice(5)}`;

assertEqual(calculateDueDateFactor('2000-07-03'), '1000', 'fator de vencimento original');
assertEqual(calculateDueDateFactor('2025-02-21'), '9999', 'fator antes do reinicio');
assertEqual(calculateDueDateFactor('2025-02-22'), '1000', 'fator no reinicio de 2025');
assertEqual(modulo11Barcode(sampleBarcodeWithoutDv), 3, 'DV geral do codigo de barras');
assertEqual(
  buildLinhaDigitavel(sampleBarcode),
  '00190.50095 40144.816069 06809.350314 3 37370000000100',
  'linha digitavel do exemplo BB',
);

const identifiers = buildBancoBrasilBoletoIdentifiers({
  convenio: '123456',
  sequencial: '42',
  agencia: '1234',
  conta: '12345678',
  carteira: '17',
  dueDate: '2026-08-04',
  amount: 1500.75,
});

if (identifiers.barcode.length !== 44) {
  throw new Error('codigo de barras gerado deve conter 44 posicoes');
}

if (!/^\d{5}\.\d{5} \d{5}\.\d{6} \d{5}\.\d{6} \d \d{14}$/.test(identifiers.linhaDigitavel)) {
  throw new Error('linha digitavel gerada esta fora do formato esperado');
}

console.log('Validacao Banco do Brasil boleto OK');
