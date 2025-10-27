"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import React from "react";
import { PrintableVoucher } from "@/components/printable-voucher";
import type { Voucher } from "@/components/voucher-list";

export const downloadVoucherAsPdf = async (voucher: Voucher): Promise<void> => {
  // 1. Create a temporary container for rendering the voucher off-screen
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px"; // Position it far off the left
  container.style.top = "0px";
  // Set a fixed width corresponding to A5 paper aspect ratio to ensure consistent layout
  container.style.width = "559px";
  document.body.appendChild(container);

  // 2. Render the PrintableVoucher component into our hidden container
  const root = createRoot(container);
  root.render(React.createElement(PrintableVoucher, { voucher }));

  // 3. Wait a moment for the component and any images (like logos) to render fully
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 4. Use html2canvas to capture the rendered component as a high-quality image
  const canvas = await html2canvas(container, {
    scale: 3, // Use a higher scale for better resolution in the PDF
    useCORS: true, // This is crucial for loading external images like company logos
    logging: false,
  });

  // 5. Clean up the DOM by removing our temporary container
  root.unmount();
  document.body.removeChild(container);

  // 6. Use jspdf to create the PDF document
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5", // A5 format is 148x210 mm
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Add the captured image to the PDF, making it fit the page
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  // 7. Trigger the browser to download the generated PDF
  const safePayTo = voucher.details.payTo.replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save(`Voucher-${voucher.id}-${safePayTo}.pdf`);
};