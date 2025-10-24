"use client";

import { Voucher } from "@/components/voucher-list";
import { numberToWordsEn } from "@/lib/utils";

type PrintableVoucherProps = {
  voucher: Voucher;
};

export const PrintableVoucher = ({ voucher }: PrintableVoucherProps) => {
  if (!voucher) return null;

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

  // A5 dimensions: 148mm x 210mm
  return (
    <div className="bg-white text-black p-6 font-sans w-[148mm] h-[210mm] border border-gray-300 shadow-lg print:shadow-none print:border-none flex flex-col text-sm">
      <header className="flex justify-between items-start mb-4">
        <div className="w-1/3">
          <h2 className="font-bold text-lg">{voucher.companies?.name}</h2>
        </div>
        <div className="w-1/3 text-center">
          <h1 className="text-xl font-bold uppercase">Payment Voucher</h1>
        </div>
        <div className="w-1/3 text-right text-sm">
          <p>
            <span className="font-semibold">No:</span> {String(voucher.id).padStart(6, "0")}
          </p>
          <p>
            <span className="font-semibold">Date:</span> {formatDate(voucher.details.date)}
          </p>
        </div>
      </header>

      <section className="border border-black p-2 mb-4">
        <div className="flex">
          <p className="w-auto font-semibold mr-2">Pay to:</p>
          <p className="flex-1 border-b border-dotted border-gray-500">
            {voucher.details.payTo}
          </p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center font-semibold w-1/12">
                No.
              </th>
              <th className="border border-black p-2 text-center font-semibold w-3/4">
                Particulars
              </th>
              <th className="border border-black p-2 text-center font-semibold w-1/4">
                Amount (USD)
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
            {/* Fill remaining space with empty rows for visual consistency */}
            {Array.from({ length: Math.max(0, 8 - (voucher.details?.items?.length || 0)) }).map((_, index) => (
              <tr key={`empty-${index}`} className="h-8">
                <td className="border-x border-black"></td>
                <td className="border-x border-black"></td>
                <td className="border-x border-black"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100">
              <td
                colSpan={2}
                className="border border-black p-2 text-right font-bold"
              >
                TOTAL AMOUNT
              </td>
              <td className="border border-black p-2 text-right font-bold">
                {formatCurrency(voucher.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="border border-black p-2 mt-4">
        <p className="font-semibold">Amount in Words:</p>
        <p className="italic mt-1">{amountInWords}</p>
      </section>

      <footer className="flex justify-around mt-auto text-center text-xs pt-8">
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