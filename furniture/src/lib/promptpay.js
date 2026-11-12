// PromptPay EMVCo QR payload generator (Thai QR Payment standard)
// Produces a payload that real Thai banking apps can scan.

const tlv = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`;

function crc16(data) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTarget(id) {
  const digits = String(id).replace(/[^0-9]/g, '');
  if (digits.length >= 13) return { tag: '02', value: digits }; // National ID / Tax ID
  if (digits.length === 15) return { tag: '03', value: digits }; // e-Wallet
  // Mobile: 0812345678 -> 0066812345678
  const mobile = ('0000000000000' + digits.replace(/^0/, '66')).slice(-13);
  return { tag: '01', value: mobile };
}

export function isValidPromptPayId(id) {
  const d = String(id || '').replace(/[^0-9]/g, '');
  return /^0\d{9}$/.test(d) || d.length === 13 || d.length === 15;
}

export function buildPromptPayPayload(id, amount) {
  const target = formatTarget(id);
  const merchant = tlv('00', 'A000000677010111') + tlv(target.tag, target.value);
  const hasAmount = typeof amount === 'number' && amount > 0;
  let payload =
    tlv('00', '01') +
    tlv('01', hasAmount ? '12' : '11') +
    tlv('29', merchant) +
    tlv('58', 'TH') +
    tlv('53', '764') +
    (hasAmount ? tlv('54', amount.toFixed(2)) : '');
  payload += '6304';
  return payload + crc16(payload);
}
