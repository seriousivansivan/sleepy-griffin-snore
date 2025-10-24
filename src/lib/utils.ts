import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Thai number words and units
const THAI_NUMBERS = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const THAI_UNITS = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

/**
 * Converts a number to its Thai Baht string representation.
 * e.g., 123.45 -> "หนึ่งร้อยยี่สิบสามบาทสี่สิบห้าสตางค์"
 * @param num The number to convert.
 * @returns The Thai Baht string.
 */
export function numberToWordsTh(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";

  const numStr = num.toFixed(2);
  const [integerPart, fractionalPart] = numStr.split('.');

  const readInteger = (integerStr: string): string => {
    let result = "";
    const len = integerStr.length;

    if (len === 0 || parseInt(integerStr) === 0) {
      return "";
    }

    // Handle numbers larger than millions by recursively calling
    if (len > 7) {
      const millions = integerStr.slice(0, len - 6);
      const remainder = integerStr.slice(len - 6);
      const remainderText = readInteger(remainder);
      return `${readInteger(millions)}ล้าน${remainderText}`;
    }

    for (let i = 0; i < len; i++) {
      const digit = parseInt(integerStr[i]);
      if (digit === 0) continue;

      const position = len - 1 - i;

      if (position === 1 && digit === 2) {
        result += "ยี่";
      } else if (position === 1 && digit === 1) {
        // No "หนึ่ง" for "สิบ"
      } else if (position === 0 && len > 1 && digit === 1) {
        result += "เอ็ด";
      } else {
        result += THAI_NUMBERS[digit];
      }

      if (position > 0) {
        result += THAI_UNITS[position];
      }
    }
    return result;
  };

  let bahtText = readInteger(integerPart);
  if (bahtText) {
    bahtText += "บาท";
  }

  if (fractionalPart === "00" || parseInt(fractionalPart) === 0) {
    return bahtText.length > 0 ? bahtText + "ถ้วน" : "ศูนย์บาทถ้วน";
  }

  let satangText = readInteger(fractionalPart);
  if (satangText) {
    satangText += "สตางค์";
  }

  return bahtText + satangText;
}