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

  const amountInWords = numberToWordsEn(voucher.total_amount);

  // A5 dimensions: 148mm x 210mm (using a slightly larger container for better visual fit on screen)
  return (
    <div className="bg-white text-black p-6 font-sans w-[148mm] h-[210mm] border border-gray-300 shadow-lg print:shadow-none print:border-none flex flex-col text-sm print:text-[10pt]">
      {/* Header Section */}
      <header className="text-center mb-6">
        <p className="text-xs mb-1">[LOGO]</p>
        <h1 className="text-xl font-bold uppercase border-b border-black inline-block px-4 pb-1">
          Petty Cash Voucher
        </h1>
      </header>

      {/* Pay To and Date Section */}
      <section className="flex justify-between items-end mb-4 text-sm">
        <div className="flex-1 flex items-end mr-4">
          <p className="font-semibold whitespace-nowrap mr-2">PAY TO:</p>
          <p className="flex-1 border-b border-black pb-[1px] text-left">
            {voucher.details.payTo}
          </p>
        </div>
        <div className="flex items-end">
          <p className="font-semibold whitespace-nowrap mr-2">Date:</p>
          <p className="border-b border-black pb-[1px] text-right">
            {formatDate(voucher.details.date)}
          </p>
        </div>
      </section>

      {/* Table Section */}
      <section className="flex-grow">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200/70">
              <th className="border border-black p-2 text-center font-bold w-[10%]">
                NO.
              </th>
              <th className="border border-black p-2 text-center font-bold w-[65%]">
                PARTICULARS
              </th>
              <th className="border border-black p-2 text-center font-bold w-[25%]">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            {voucher.details?.items?.map((item, index) => (
              <tr key={index}>
                <td className="border-x border-black p-2 text-center align-top">
                  {index + 1}
                </td>
                <td className="border-x border-black p-2 align-top">
                  {item.particulars}
                </td>
                <td className="border-x border-black p-2 text-right align-top">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
            {/* Fill remaining space with empty rows for visual consistency and to push the total row down */}
            {Array.from({ length: Math.max(0, 8 - (voucher.details?.items?.length || 0)) }).map((_, index) => (
              <tr key={`empty-${index}`} className="h-6">
                <td className="border-x border-black"></td>
                <td className="border-x border-black"></td>
                <td className="border-x border-black"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200/70">
              <td
                colSpan={2}
                className="border border-black p-2 text-right font-bold uppercase"
              >
                Total
              </td>
              <td className="border border-black p-2 text-right font-bold">
                {formatCurrency(voucher.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Amount in Words Section (Optional, based on template interpretation) */}
      {/* Keeping this section for now, but styling it simply as a note, not a box */}
      <section className="mt-4 text-xs">
        <p className="font-semibold">Amount in Words:</p>
        <p className="italic">{amountInWords}</p>
      </section>

      {/* Footer Signatures */}
      <footer className="grid grid-cols-2 gap-x-8 mt-auto text-center text-xs pt-8">
        <div className="flex flex-col space-y-6">
          <div className="w-full">
            <p className="border-t border-black pt-1">Approved By</p>
          </div>
          <div className="w-full">
            <p className="border-t border-black pt-1">Paid By</p>
          </div>
        </div>
        <div className="flex flex-col space-y-6">
          <div className="w-full">
            <p className="border-t border-black pt-1">Request By</p>
          </div>
          <div className="w-full">
            <p className="border-t border-black pt-1">Received By</p>
          </div>
        </div>
      </footer>
    </div>
  );
};