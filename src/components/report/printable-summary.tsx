"use client";

import { format } from "date-fns";

type SummaryDataItem = {
  category: string;
  total_amount: number;
};

type PrintableSummaryProps = {
  data: SummaryDataItem[];
  companyName: string;
  dateRange: { from: Date; to: Date };
  personResponsible: string;
  bankName?: string;
  bankAccount?: string;
};

export const PrintableSummary = ({
  data,
  companyName,
  dateRange,
  personResponsible,
  bankName,
  bankAccount,
}: PrintableSummaryProps) => {
  const totalAmount = data.reduce((sum, item) => sum + item.total_amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-white text-black p-4 font-sans w-full max-w-4xl mx-auto text-sm print:text-[10pt] print:p-0 print:max-w-full print:shadow-none print:border-none flex flex-col h-full">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Petty Cash Summary
        </h1>
        <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
          <div className="font-semibold">Period:</div>
          <div>
            {format(dateRange.from, "dd MMMM yyyy")} to{" "}
            {format(dateRange.to, "dd MMMM yyyy")}
          </div>
          <div className="font-semibold">Person Responsible:</div>
          <div>{personResponsible}</div>
          <div className="font-semibold">Submit to:</div>
          <div>{companyName}</div>
        </div>
      </header>

      <section className="flex-grow">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black py-2 px-1.5 text-center font-bold w-[10%]">
                No.
              </th>
              <th className="border border-black py-2 px-3 text-left font-bold w-[60%]">
                Category
              </th>
              <th className="border border-black py-2 px-1.5 text-right font-bold w-[30%]">
                Total Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td className="border border-black py-2 px-1.5 text-center">
                  {index + 1}
                </td>
                <td className="border border-black py-2 px-3">
                  {item.category}
                </td>
                <td className="border border-black py-2 px-1.5 text-right">
                  {formatCurrency(item.total_amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={2}
                className="border border-black py-2 px-3 text-right font-bold"
              >
                Grand Total
              </td>
              <td className="border border-black py-2 px-1.5 text-right font-bold">
                {formatCurrency(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <footer className="mt-auto pt-8 text-sm">
        <div className="border border-black bg-gray-200 p-4 text-center">
          <p>
            Please make cheque payment to{" "}
            <span className="font-semibold">{personResponsible}</span>
          </p>
          {bankName && bankAccount && (
            <p>
              Or Deposit into bank name{" "}
              <span className="font-semibold">{bankName}</span> Account No.{" "}
              <span className="font-semibold">{bankAccount}</span>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};