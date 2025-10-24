"use client";

import { Voucher } from "@/components/voucher-list";
import { numberToWordsEn } from "@/lib/utils";
import { format } from "date-fns";

type PrintableVoucherProps = {
  voucher: Voucher;
};

export const PrintableVoucher = ({ voucher }: PrintableVoucherProps) => {
  if (!voucher) return null;

  const formatDate = (dateString: string) => {
    // Use the date from the details object, formatted as DD/MM/YYYY
    return format(new Date(voucher.details.date), "dd/MM/yyyy");
  };

  const formatCurrency = (amount: number) => {
    // Format as a decimal number with two places, without currency symbol
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Using a wider container (e.g., A4 width equivalent for better screen viewing, but allowing print to expand)
  return (
    <div className="bg-white text-black p-8 font-sans w-full max-w-4xl mx-auto border border-gray-300 shadow-lg print:shadow-none print:border-none flex flex-col text-sm print:text-[10pt] print:p-0">
      {/* Header Section */}
      <header className="text-center mb-4">
        <p className="text-xs mb-1">[LOGO]</p>
        <h1 className="text-xl font-bold uppercase border-b border-black inline-block px-4 pb-1">
          Petty Cash Voucher
        </h1>
      </header>

      {/* Pay To and Date Section */}
      <section className="flex justify-between items-end mb-3 text-sm">
        <div className="flex-1 flex items-end mr-4">
          <p className="font-semibold whitespace-nowrap mr-2">PAY TO:</p>
          <p className="flex-1 border-b border-black pb-[1px] text-left">
            {voucher.details.payTo}
          </p>
        </div>
        <div className="flex items-end">
          <p className="font-semibold whitespace-nowrap mr-2">Date:</p>
          <p className="border-b border-black pb-[1px] text-right min-w-[100px]">
            {formatDate(voucher.details.date)}
          </p>
        </div>
      </section>

      {/* Table Section */}
      <section className="flex-grow mb-6">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200/70">
              <th className="border border-black p-1.5 text-center font-bold w-[10%]">
                NO.
              </th>
              <th className="border border-black p-1.5 text-center font-bold w-[65%]">
                PARTICULARS
              </th>
              <th className="border border-black p-1.5 text-center font-bold w-[25%]">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {voucher.details?.items?.map((item, index) => (
              <tr key={index}>
                <td className="border-x border-black p-1.5 text-center align-top">
                  {index + 1}
                </td>
                <td className="border-x border-black p-1.5 align-top">
                  {item.particulars}
                </td>
                <td className="border-x border-black p-1.5 text-right align-top">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            {/* Fill remaining space with empty rows for visual consistency (6 filler rows) */}
            {Array.from({ length: Math.max(0, 6 - (voucher.details?.items?.length || 0)) }).map((_, index) => (
              <tr key={`empty-${index}`} className="h-5">
                <td className="border-x border-black border-t border-gray-300"></td>
                <td className="border-x border-black border-t border-gray-300"></td>
                <td className="border-x border-black border-t border-gray-300"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200/70">
              <td
                colSpan={2}
                className="border border-black p-1.5 text-right font-bold uppercase"
              >
                Total
              </td>
              <td className="border border-black p-1.5 text-right font-bold">
                {formatCurrency(voucher.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Amount in Words Section */}
      <section className="mb-6">
        <div className="flex items-end">
          <p className="font-semibold whitespace-nowrap mr-2">Amount in Words:</p>
          <p className="flex-1 border-b border-black pb-[1px] text-left italic">
            {numberToWordsEn(voucher.total_amount)}
          </p>
        </div>
      </section>

      {/* Footer Signatures */}
      <footer className="grid grid-cols-4 gap-x-4 text-xs pt-6 mt-auto">
        {["Approved By", "Paid By", "Request By", "Received By"].map((label) => (
          <div key={label} className="flex flex-col items-center text-center">
            <div className="w-full border-b border-black h-6 mb-1"></div>
            <p className="pt-1">{label}</p>
          </div>
        ))}
      </footer>
    </div>
  );
};