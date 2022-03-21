import converter from "bech32-converting";

export function convertAddressToHex(address: string) {
  if (address.startsWith('wq')) {
    return converter('wq').toHex(address).toLowerCase();
  }

  return address.toLowerCase();
}
