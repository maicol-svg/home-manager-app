"use client";

import { useState } from "react";
import BillForm from "@/components/bollette/BillForm";

interface BillFormWrapperProps {
  children: React.ReactNode;
}

export default function BillFormWrapper({ children }: BillFormWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <BillForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
