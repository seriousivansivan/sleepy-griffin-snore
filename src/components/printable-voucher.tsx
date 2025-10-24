"use client";

import { Voucher } from "@/components/voucher-list";
import { numberToWordsEn } from "@/lib/utils";

type PrintableVoucherProps = {
  voucher: Voucher;
};

export const PrintableVoucher = ({ voucher }: PrintableVoucherProps) => {
  if (!voucher || !voucher.details) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const amountInWords = numberToWordsEn(voucher.total_amount);
  const items = voucher.details.items || [];

  return (
    // A5 size container (148mm x 210mm)
    <div className="bg-white text-black p-6 font-sans w-[148mm] h-[210mm] border border-gray-300 shadow-lg print:shadow-none print:border-none flex flex-col text-sm">
      
      {/* Header Section */}
      <header className="flex justify-between items-start mb-4 border-b border-black pb-2">
        <div className="w-1/3">
          <h2 className="font-bold text-lg">{voucher.companies?.name || "Company Name"}</h2>
        </div>
        <div className="w-1/3 text-center">
          <h1 className="text-xl font-bold uppercase">Payment Voucher</h1>
        </div>
        <div className="w-1/3 text-right text-sm">
          <p className="mb-1">
            <span className="font-semibold">No:</span> {String(voucher.id).padStart(6, "0")}
          </p>
          <p>
            <span className="font-semibold">Date:</span> {formatDate(voucher.details.date)}
          </p>
        </div>
      </header>

      {/* Pay To Section */}
      <section className="py-2 mb-4">
        <div className="flex items-end">
          <p className="w-auto font-semibold mr-2 whitespace-nowrap">Pay to:</p>
          <p className="flex-1 border-b border-dotted border-gray-500 text-base font-medium">
            {voucher.details.payTo}
          </p>
        </div>
      </section>

      {/* Items Table Section */}
      <section className="flex-grow min-h-[50%]">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100/50">
              <th className="border border-black p-2 text-center font-semibold w-3/4">
                Particulars
              </th>
              <th className="border border-black p-2 text-center font-semibold w-1/4">
                Amount (USD)
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="h-8">
                <td className="border-x border-black p-2 align-top">{item.particulars}</td>
                <td className="border-x border-black p-2 text-right align-top">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {/* Add empty rows to fill space if needed (for consistent look) */}
            {Array.from({ length: Math.max(0, 8 - items.length) }).map((_, index) => (
              <tr key={`empty-${index}`} className="h-8">
                <td className="border-x border-black p-2"></td>
                <td className="border-x border-black p-2"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100/50">
              <td className="border border-black p-2 text-right font-bold">
                TOTAL AMOUNT
              </td>
              <td className="border border-black p-2 text-right font-bold text-base">
                {formatCurrency(voucher.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Amount in Words Section */}
      <section className="border border-black p-2 mt-4 mb-6">
        <p className="font-semibold italic">
          Amount in Words: <span className="font-bold not-italic">{amountInWords}</span>
        </p>
      </section>

      {/* Signatures Footer */}
      <footer className="flex justify-between mt-auto text-center text-xs">
        <div className="w-1/4 px-2">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            Prepared by
          </p>
        </div>
        <div className="w-1/4 px-2">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            Checked by
          </p>
        </div>
        <div className="w-1/4 px-2">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            Approved by
          </p>
        </div>
        <div className="w-1/4 px-2">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            Receiver
          </p>
        </div>
      </footer>
    </div>
  );
};