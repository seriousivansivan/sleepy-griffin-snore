"use client";

import { format } from "date-fns";

type ReportDataItem = {
  voucher_id: number;
  voucher_date: string;
  particulars: string;
  approved_by: string;
  amount: number;
};

type PrintableReportProps = {
  data: ReportDataItem[];
  companyName: string;
  dateRange: { from: Date; to: Date };
  personResponsible: string;
};

export const PrintableReport = ({
  data,
  companyName,
  dateRange,
  personResponsible,
}: PrintableReportProps) => {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white text-black p-4 font-sans w-full max-w-4xl mx-auto text-sm print:text-[10pt] print:p-0 print:max-w-full print:shadow-none print:border-none">
      <header className="text-center mb-6">
        <h1 className="text-xl font-bold">{companyName}</h1>
        <h2 className="text-lg font-semibold">Petty Cash Log</h2>
        <p className="text-sm">
          For the period from {format(dateRange.from, "dd MMMM yyyy")} to{" "}
          {format(dateRange.to, "dd MMMM yyyy")}
        </p>
      </header>

      <section>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-1.5 text-center font-bold w-[5%]">
                No.
              </th>
              <th className="border border-black p-1.5 text-center font-bold w-[10%]">
                Date
              </th>
              <th className="border border-black p-1.5 text-left font-bold w-[45%]">
                Particulars
              </th>
              <th className="border border-black p-1.5 text-left font-bold w-[25%]">
                Approved by
              </th>
              <th className="border border-black p-1.5 text-right font-bold w-[15%]">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={`${item.voucher_id}-${index}`}>
                <td className="border border-black p-1.5 text-center">
                  {index + 1}
                </td>
                <td className="border border-black p-1.5 text-center">
                  {format(new Date(item.voucher_date), "dd/MM/yyyy")}
                </td>
                <td className="border border-black p-1.5">{item.particulars}</td>
                <td className="border border-black p-1.5">{item.approved_by}</td>
                <td className="border border-black p-1.5 text-right">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={4}
                className="border border-black p-1.5 text-right font-bold"
              >
                Total
              </td>
              <td className="border border-black p-1.5 text-right font-bold">
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="mt-16">
        <div className="w-1/3">
          <div className="border-b border-black h-8"></div>
          <p className="pt-1">Person Responsible: {personResponsible}</p>
        </div>
      </footer>
    </div>
  );
};