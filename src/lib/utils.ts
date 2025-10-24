import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// English number words
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
const TEENS = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const THOUSANDS = ["", "Thousand", "Million", "Billion"];

function convertLessThanOneThousand(num: number): string {
    if (num === 0) return "";
    if (num < 10) return ONES[num];
    if (num < 20) return TEENS[num - 10];
    if (num < 100) {
        const ten = Math.floor(num / 10);
        const one = num % 10;
        return TENS[ten] + (one > 0 ? " " + ONES[one] : "");
    }
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return ONES[hundred] + " Hundred" + (remainder > 0 ? " " + convertLessThanOneThousand(remainder) : "");
}

/**
 * Converts a number to its English words representation.
 * e.g., 123.45 -> "One Hundred Twenty Three Dollars and Forty Five Cents"
 * @param num The number to convert.
 * @returns The English words string.
 */
export function numberToWordsEn(num: number): string {
    if (num === 0) return "Zero Dollars and Zero Cents";

    const [integerPart, fractionalPart] = num.toFixed(2).split('.').map(p => parseInt(p));

    let integerWords = "";
    if (integerPart === 0) {
        integerWords = "Zero";
    } else {
        let i = 0;
        let n = integerPart;
        while (n > 0) {
            if (n % 1000 !== 0) {
                integerWords = (convertLessThanOneThousand(n % 1000) + " " + THOUSANDS[i] + " " + integerWords).trim();
            }
            n = Math.floor(n / 1000);
            i++;
        }
    }
    
    const dollarText = integerPart === 1 ? "Dollar" : "Dollars";
    
    let fractionalWords = "";
    if (fractionalPart === 0) {
        fractionalWords = "Zero";
    } else {
        fractionalWords = convertLessThanOneThousand(fractionalPart);
    }
    const centText = fractionalPart === 1 ? "Cent" : "Cents";

    return `${integerWords.trim()} ${dollarText} and ${fractionalWords.trim()} ${centText}`;
}