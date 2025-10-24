"use client";

import { Voucher } from "@/components/voucher-list";
import { numberToWordsTh } from "@/lib/utils";

type PrintableVoucherProps = {
  voucher: Voucher;
};

export const PrintableVoucher = ({ voucher }: PrintableVoucherProps) => {
  if (!voucher) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const amountInWords = numberToWordsTh(voucher.total_amount);

  return (
    <div className="bg-white text-black p-8 font-sarabun w-[148mm] h-[210mm] border border-gray-300 shadow-lg print:shadow-none print:border-none flex flex-col">
      <header className="flex justify-between items-start mb-4">
        <div className="w-1/3">
          <h2 className="font-bold text-lg">{voucher.companies?.name}</h2>
        </div>
        <div className="w-1/3 text-center">
          <h1 className="text-2xl font-bold">ใบสำคัญจ่าย</h1>
          <h2 className="text-lg">Petty Cash Voucher</h2>
        </div>
        <div className="w-1/3 text-right text-sm">
          <p>
            <span className="font-semibold">เลขที่:</span> {String(voucher.id).padStart(6, "0")}
          </p>
          <p>
            <span className="font-semibold">วันที่:</span> {formatDate(voucher.details.date)}
          </p>
        </div>
      </header>

      <section className="border-t border-b border-black py-2 my-4">
        <div className="flex">
          <p className="w-auto font-semibold mr-2">จ่ายให้ (Pay to):</p>
          <p className="flex-1 border-b border-dotted border-gray-500">
            {voucher.details.payTo}
          </p>
        </div>
      </section>

      <section className="flex-grow">
        <table className="w-full border-collapse border border-black mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 text-center font-semibold">
                รายการ (Particulars)
              </th>
              <th className="border border-black p-2 text-center font-semibold w-1/4">
                จำนวนเงิน (Amount)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2 align-top h-32">
                {voucher.details.particulars}
              </td>
              <td className="border border-black p-2 text-right align-top">
                {formatCurrency(voucher.total_amount)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="bg-gray-100">
              <td className="border border-black p-2 text-right font-semibold">
                รวมทั้งสิ้น (Total)
              </td>
              <td className="border border-black p-2 text-right font-semibold">
                {formatCurrency(voucher.total_amount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="border-t border-b border-black py-2 my-4 text-center">
        <p className="font-semibold">({amountInWords})</p>
      </section>

      <footer className="flex justify-around mt-auto text-center text-sm pt-8">
        <div className="w-1/4">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            ผู้จัดทำ
          </p>
          <p>(Prepared by)</p>
        </div>
        <div className="w-1/4">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            ผู้ตรวจสอบ
          </p>
          <p>(Checked by)</p>
        </div>
        <div className="w-1/4">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            ผู้อนุมัติ
          </p>
          <p>(Approved by)</p>
        </div>
        <div className="w-1/4">
          <p className="border-t border-dotted border-gray-500 pt-2 mt-8">
            ผู้รับเงิน
          </p>
          <p>(Receiver)</p>
        </div>
      </footer>
    </div>
  );
};