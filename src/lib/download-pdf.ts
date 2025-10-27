"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { createRoot } from "react-dom/client";
import React from "react";
import { PrintableVoucher } from "@/components/printable-voucher";
import type { Voucher } from "@/components/voucher-list";

export const downloadVoucherAsPdf = async (voucher: Voucher): Promise<void> => {
  // 1. Create a temporary container that simulates an A5 page for rendering
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0px";

  // A5 paper dimensions in pixels at 96 DPI. This forces the component to render at the correct size.
  const a5WidthPx = 559;
  const a5HeightPx = 794;
  container.style.width = `${a5WidthPx}px`;
  container.style.height = `${a5HeightPx}px`;

  document.body.appendChild(container);

  // 2. Render the PrintableVoucher component into our hidden, A5-sized container
  const root = createRoot(container);
  // The PrintableVoucher component is designed to fill its parent's height
  root.render(React.createElement(PrintableVoucher, { voucher }));

  // 3. Wait a moment for the component and any images to render fully
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 4. Use html2canvas to capture the rendered component as a high-quality image
  const canvas = await html2canvas(container, {
    scale: 3, // Higher scale for better resolution
    useCORS: true,
    logging: false,
    width: a5WidthPx,
    height: a5HeightPx,
    windowWidth: a5WidthPx,
    windowHeight: a5HeightPx,
  });

  // 5. Clean up the DOM
  root.unmount();
  document.body.removeChild(container);

  // 6. Use jspdf to create the PDF document
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5", // A5 format: 148mm x 210mm
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Add the image, fitting it to the entire A5 page.
  // Since the source canvas and destination PDF have the same aspect ratio, it will be a perfect fit.
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  // 7. Trigger the browser to download the generated PDF
  const safePayTo = voucher.details.payTo.replace(/[^a-zA-Z0-9]/g, "_");
  pdf.save(`Voucher-${voucher.id}-${safePayTo}.pdf`);
};